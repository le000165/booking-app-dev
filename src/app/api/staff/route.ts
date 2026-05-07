import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase service role config');
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── GET /api/staff ──────────────────────────────────────────────────────────
// Returns all team_members for the authenticated user's business.
// business_id is resolved server-side — never trusted from client.
export async function GET() {
  console.log('[STAFF][GET] Request start');
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[STAFF][GET] 401 — No session');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('[STAFF][GET] Auth user_id:', user.id);

  // Resolve business_id from business_members (SaaS access layer)
  const { data: membership, error: memberError } = await supabase
    .from('business_members')
    .select('business_id, role')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .limit(1)
    .single();

  if (memberError || !membership) {
    console.error('[STAFF][GET] 403 — No membership:', memberError?.message);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  console.log('[STAFF][GET] Resolved business_id:', membership.business_id);

  const { data: staff, error } = await supabase
    .from('team_members')
    .select('id, user_id, first_name, last_name, role, is_active, email, phone')
    .eq('business_id', membership.business_id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[STAFF][GET] Query error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }

  // Enrich with business_members to know who has login access
  const { data: loginMembers } = await supabase
    .from('business_members')
    .select('user_id, role')
    .eq('business_id', membership.business_id);

  const loginSet = new Set((loginMembers || []).map((m: any) => m.user_id));

  const enriched = (staff || []).map((s: any) => ({
    ...s,
    has_login: s.user_id ? loginSet.has(s.user_id) : false,
  }));

  console.log('[STAFF][GET] Returning', enriched.length, 'staff members');
  return NextResponse.json({ staff: enriched });
}

// ─── POST /api/staff ─────────────────────────────────────────────────────────
// Creates a new bookable team member.
// If email is provided, optionally invites them to create an account.
export async function POST(request: Request) {
  console.log('[STAFF][POST] Request start');
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[STAFF][POST] 401 — No session');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('[STAFF][POST] Auth user_id:', user.id);

  const body = await request.json();
  const { first_name, last_name, email, phone, invite } = body;
  console.log('[STAFF][POST] Submitted form values:', { first_name, last_name, email, phone, invite });

  if (!first_name?.trim()) {
    return NextResponse.json({ error: 'First name is required' }, { status: 400 });
  }

  // Resolve business_id from business_members
  const { data: membership, error: memberError } = await supabase
    .from('business_members')
    .select('business_id, role')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .limit(1)
    .single();

  if (memberError || !membership) {
    console.error('[STAFF][POST] 403 — No membership:', memberError?.message);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  console.log('[STAFF][POST] Resolved business_id:', membership.business_id);

  const admin = createAdminClient();
  let newUserId: string | null = null;
  let inviteStatus: 'none' | 'invited' | 'existing' = 'none';

  // ── Optional: invite staff member via email ────────────────────────────────
  if (email && invite) {
    console.log('[STAFF][POST] Invite flow for email:', email);

    // Check if user already exists
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email === email.toLowerCase());

    if (existingUser) {
      newUserId = existingUser.id;
      inviteStatus = 'existing';
      console.log('[STAFF][POST] Existing auth user found:', newUserId);
    } else {
      // Send magic link invite — user sets their own password on first login
      const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
        email.toLowerCase(),
        {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/employee`,
          data: {
            business_id: membership.business_id,
            role: 'staff',
          },
        }
      );

      if (inviteError) {
        console.error('[STAFF][POST] Invite error:', inviteError.message);
        // Don't fail the whole operation — just create bookable staff without login
        console.log('[STAFF][POST] Continuing without invite...');
      } else {
        newUserId = inviteData.user?.id || null;
        inviteStatus = 'invited';
        console.log('[STAFF][POST] Invite sent, new user_id:', newUserId);
      }
    }

    // If we have a userId, ensure profile + business_members exist
    if (newUserId) {
      // Upsert profile
      const { error: profileError } = await admin
        .from('profiles')
        .upsert({ user_id: newUserId, email: email.toLowerCase() }, { onConflict: 'user_id' });
      if (profileError) {
        console.error('[STAFF][POST] Profile upsert error:', profileError.message);
      } else {
        console.log('[STAFF][POST] Profile upserted for:', newUserId);
      }

      // Upsert business_members with staff role
      const { error: bmError } = await admin
        .from('business_members')
        .upsert(
          { user_id: newUserId, business_id: membership.business_id, role: 'staff' },
          { onConflict: 'user_id,business_id' }
        );
      if (bmError) {
        console.error('[STAFF][POST] business_members upsert error:', bmError.message);
      } else {
        console.log('[STAFF][POST] business_members row created/updated for:', newUserId);
      }
    }
  }

  // ── Always: create team_members row ───────────────────────────────────────
  const teamMemberPayload: any = {
    business_id: membership.business_id,
    role: 'employee',
    first_name: first_name.trim(),
    last_name: last_name?.trim() || '',
    is_active: true,
    ...(email ? { email: email.toLowerCase() } : {}),
    ...(phone ? { phone } : {}),
    ...(newUserId ? { user_id: newUserId } : {}),
  };

  console.log('[STAFF][POST] Final team_members payload:', teamMemberPayload);

  const { data: newMember, error: insertError } = await admin
    .from('team_members')
    .insert(teamMemberPayload)
    .select('id, first_name, last_name, role, is_active, email, phone, user_id')
    .single();

  if (insertError) {
    console.error('[STAFF][POST] Supabase team_members insert error:', insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  console.log('[STAFF][POST] ✓ Successfully inserted staff row:', newMember);

  return NextResponse.json({
    success: true,
    staff: {
      ...newMember,
      has_login: !!newUserId,
      invite_status: inviteStatus,
    },
  });
}
