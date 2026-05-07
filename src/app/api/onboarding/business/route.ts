import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Convert a business name into a URL-safe slug.
 *  e.g. "Pojo Nails Studio!" → "pojo-nails-studio"
 */
function toBaseSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);
}

/** Find the first available slug, appending -2, -3, ... if taken by another business. */
async function resolveUniqueSlug(
  admin: ReturnType<typeof createAdminClient>,
  baseName: string,
  currentBusinessId: string
): Promise<string> {
  const base = toBaseSlug(baseName);
  let candidate = base;
  let attempt = 2;

  while (true) {
    const { data } = await admin
      .from('businesses')
      .select('id')
      .eq('slug', candidate)
      .neq('id', currentBusinessId)  // allow keeping the same slug
      .limit(1)
      .maybeSingle();

    if (!data) return candidate;  // slug is free
    candidate = `${base}-${attempt}`;
    attempt++;
    if (attempt > 99) return `${base}-${currentBusinessId.slice(0, 6)}`; // fallback
  }
}

// PATCH /api/onboarding/business
// Updates the business name, phone, timezone, and slug for the authenticated owner
export async function PATCH(request: Request) {
  console.log('[ONBOARDING][BUSINESS] ── PATCH request start ──');

  const supabase = await createClient();

  // Step 1: Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('[ONBOARDING][BUSINESS] 401 — No user in session:', authError?.message);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[ONBOARDING][BUSINESS] Authenticated user_id:', user.id);

  // Step 2: Parse body
  const body = await request.json();
  const { name, phone, timezone } = body;
  console.log('[ONBOARDING][BUSINESS] Incoming payload:', { name, phone, timezone });

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
  }

  // Step 3: Resolve business_id from business_members
  console.log('[ONBOARDING][BUSINESS] Querying business_members for user_id:', user.id);

  const { data: membership, error: memberError } = await supabase
    .from('business_members')
    .select('business_id, role')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .limit(1)
    .single();

  console.log('[ONBOARDING][BUSINESS] business_members query result:', {
    membership,
    error: memberError?.message || null,
    errorCode: memberError?.code || null,
    errorHint: (memberError as any)?.hint || null,
  });

  if (memberError || !membership) {
    console.error('[ONBOARDING][BUSINESS] 403 — REASON: business_members query returned no rows.');
    console.error('[ONBOARDING][BUSINESS] This is almost certainly an RLS policy issue.');
    console.error('[ONBOARDING][BUSINESS] The row was inserted by the admin client (service role),');
    console.error('[ONBOARDING][BUSINESS] but the anon client cannot read it due to a recursive RLS policy.');
    console.error('[ONBOARDING][BUSINESS] FIX: Run the SQL to replace the business_members RLS policy.');
    return NextResponse.json(
      { error: 'Forbidden — could not resolve your business membership.' },
      { status: 403 }
    );
  }

  const businessId = membership.business_id;
  console.log('[ONBOARDING][BUSINESS] Resolved business_id:', businessId, '| role:', membership.role);

  // Step 4: Generate a unique human-readable slug from the business name
  const admin = createAdminClient();
  const slug = await resolveUniqueSlug(admin, name.trim(), businessId);
  console.log('[ONBOARDING][BUSINESS] Generated slug:', slug);

  // Step 5: Update business using admin client (bypasses RLS)
  const { data: updated, error: updateError } = await admin
    .from('businesses')
    .update({
      name: name.trim(),
      slug,
      ...(phone ? { phone } : {}),
      ...(timezone ? { timezone } : {}),
    })
    .eq('id', businessId)
    .select('id, name, slug, phone, timezone');

  if (updateError) {
    console.error('[ONBOARDING][BUSINESS] 500 — businesses UPDATE failed:', updateError.message);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updated || updated.length === 0) {
    console.error('[ONBOARDING][BUSINESS] 500 — UPDATE returned 0 rows. Likely RLS blocking update.');
    console.error('[ONBOARDING][BUSINESS] Check that businesses has owner_id set, or that the UPDATE policy allows business_members-based access.');
    return NextResponse.json({ error: 'Could not update business. Please contact support.' }, { status: 500 });
  }

  console.log('[ONBOARDING][BUSINESS] ✓ Business updated successfully:', updated[0]);

  return NextResponse.json({ success: true, data: updated });
}
