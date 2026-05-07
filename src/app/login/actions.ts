'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// Admin client — Service Role, bypasses RLS. Server-only. Never expose to browser.
// ─────────────────────────────────────────────────────────────────────────────
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      '[ADMIN CLIENT] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. ' +
      'Check your .env.local — service role key must NOT be prefixed with NEXT_PUBLIC_.'
    )
  }

  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────
export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  console.log('[AUTH][LOGIN] Attempting login for:', email)

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('[AUTH][LOGIN] signInWithPassword failed:', error.message)
    return { error: error.message }
  }

  console.log('[AUTH][LOGIN] Auth success, user_id:', data.user.id)

  // Resolve redirect via business_members (SaaS access layer)
  const { data: membership, error: memberError } = await supabase
    .from('business_members')
    .select('role, business_id')
    .eq('user_id', data.user.id)
    .limit(1)
    .single()

  console.log('[AUTH][LOGIN] Membership lookup:', {
    membership,
    error: memberError?.message || null,
  })

  let redirectUrl = '/onboarding'
  if (membership) {
    redirectUrl = membership.role === 'employee' ? '/employee' : '/admin'
  }

  console.log('[AUTH][LOGIN] Redirecting to:', redirectUrl)

  revalidatePath('/', 'layout')
  redirect(redirectUrl)
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNUP
// Flow:
//   1. auth.signUp()            → create auth user (anon client)
//   2. businesses INSERT        → create tenant (service role)
//   3. profiles INSERT          → store login user info (service role)
//   4. business_members INSERT  → link user as owner (service role)
//   4a. business_members SELECT → verify row exists (read-back via service role)
//   5. team_members INSERT      → create bookable staff entry (service role)
//   6. redirect('/onboarding')  → only if ALL steps succeed
//
// Best-effort rollback on any failure after auth user creation.
// ─────────────────────────────────────────────────────────────────────────────
export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // ── Step 1: Create auth user ──────────────────────────────────────────────
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })

  if (authError || !authData.user) {
    console.error('[AUTH][SIGNUP] auth.signUp failed:', authError?.message)
    return { error: authError?.message ?? 'Signup failed. Please try again.' }
  }

  const userId = authData.user.id
  console.log('[AUTH][SIGNUP] Step 1 ✓ Auth user created:', userId)

  // Get admin client for all DB inserts (bypasses RLS)
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch (err: any) {
    console.error('[AUTH][SIGNUP] Admin client init failed:', err.message)
    return { error: 'Server configuration error. Please contact support.' }
  }

  // Rollback helper — best effort cleanup on failure
  const rollback = async (businessId?: string) => {
    console.log('[AUTH][SIGNUP][ROLLBACK] Cleaning up for user:', userId)
    try {
      if (businessId) {
        await admin.from('businesses').delete().eq('id', businessId)
      }
      await admin.from('profiles').delete().eq('user_id', userId)
      await admin.from('business_members').delete().eq('user_id', userId)
      await admin.auth.admin.deleteUser(userId)
      console.log('[AUTH][SIGNUP][ROLLBACK] Cleanup complete')
    } catch (e: any) {
      console.error('[AUTH][SIGNUP][ROLLBACK] Cleanup failed:', e.message)
    }
  }

  // ── Step 2: Create business ───────────────────────────────────────────────
  const { data: business, error: bizError } = await admin
    .from('businesses')
    .insert({
      name: 'My Business',
      slug: `biz-${userId.slice(0, 8)}`,
      owner_id: userId,
    })
    .select('id')
    .single()

  if (bizError || !business) {
    console.error('[AUTH][SIGNUP] Step 2 ✗ businesses INSERT failed:', bizError?.message)
    await rollback()
    return { error: 'Could not create your business account. Please try again.' }
  }

  console.log('[AUTH][SIGNUP] Step 2 ✓ Business created:', business.id)

  // ── Step 3: Create profile ────────────────────────────────────────────────
  const { error: profileError } = await admin
    .from('profiles')
    .insert({
      user_id: userId,
      email: email,
    })

  if (profileError) {
    console.error('[AUTH][SIGNUP] Step 3 ✗ profiles INSERT failed:', profileError.message)
    await rollback(business.id)
    return { error: 'Could not create your profile. Please try again.' }
  }

  console.log('[AUTH][SIGNUP] Step 3 ✓ Profile created')

  // ── Step 4: Create business_members (owner) ───────────────────────────────
  const { error: bizMemberError } = await admin
    .from('business_members')
    .insert({
      business_id: business.id,
      user_id: userId,
      role: 'owner',
    })

  if (bizMemberError) {
    console.error('[AUTH][SIGNUP] Step 4 ✗ business_members INSERT failed:', bizMemberError.message)
    await rollback(business.id)
    return { error: 'Could not link you to your business. Please try again.' }
  }

  // ── Step 4a: Verify business_members row actually exists ──────────────────
  const { data: verifiedMembership, error: verifyError } = await admin
    .from('business_members')
    .select('id, user_id, business_id, role')
    .eq('user_id', userId)
    .eq('business_id', business.id)
    .single()

  if (verifyError || !verifiedMembership) {
    console.error('[AUTH][SIGNUP] Step 4a ✗ business_members verify failed — row not found after insert!')
    console.error('[AUTH][SIGNUP] Verify error:', verifyError?.message)
    await rollback(business.id)
    return { error: 'Membership verification failed. Please try again.' }
  }

  console.log('[AUTH][SIGNUP] Step 4 ✓ business_members verified:', {
    id: verifiedMembership.id,
    user_id: verifiedMembership.user_id,
    business_id: verifiedMembership.business_id,
    role: verifiedMembership.role,
  })

  // ── Step 5: Create team_members (bookable staff entry for owner) ──────────
  const { error: memberError } = await admin
    .from('team_members')
    .insert({
      business_id: business.id,
      user_id: userId,
      role: 'owner',
      first_name: email.split('@')[0],
      last_name: '',
      is_active: true,
    })

  if (memberError) {
    console.error('[AUTH][SIGNUP] Step 5 ✗ team_members INSERT failed:', memberError.message)
    await rollback(business.id)
    return { error: 'Could not complete your account setup. Please try again.' }
  }

  console.log('[AUTH][SIGNUP] Step 5 ✓ team_members created')
  console.log('[AUTH][SIGNUP] ✓ Full signup complete for user:', userId)

  // ── Step 6: Redirect ──────────────────────────────────────────────────────
  revalidatePath('/', 'layout')
  redirect('/onboarding')
}
