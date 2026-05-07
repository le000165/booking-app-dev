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

// ─── PATCH /api/staff/[id] ───────────────────────────────────────────────────
// Updates a team member (name, active status, phone, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log('[STAFF][PATCH] Request for team_member id:', id);

  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    console.error('[STAFF][PATCH] 403 — No membership:', memberError?.message);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { first_name, last_name, phone, is_active } = body;

  const updatePayload: any = {};
  if (first_name !== undefined) updatePayload.first_name = first_name.trim();
  if (last_name !== undefined) updatePayload.last_name = last_name?.trim() || '';
  if (phone !== undefined) updatePayload.phone = phone;
  if (is_active !== undefined) updatePayload.is_active = is_active;

  const admin = createAdminClient();

  // Verify the team_member belongs to this business before updating
  const { data: updated, error: updateError } = await admin
    .from('team_members')
    .update(updatePayload)
    .eq('id', id)
    .eq('business_id', membership.business_id)
    .select('id, first_name, last_name, role, is_active, email, phone, user_id')
    .single();

  if (updateError) {
    console.error('[STAFF][PATCH] Update error:', updateError.message);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  console.log('[STAFF][PATCH] ✓ Updated team_member:', id);
  return NextResponse.json({ success: true, staff: updated });
}

// ─── DELETE /api/staff/[id] ──────────────────────────────────────────────────
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log('[STAFF][DELETE] Request for team_member id:', id);

  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership, error: memberError } = await supabase
    .from('business_members')
    .select('business_id, role')
    .eq('user_id', user.id)
    .eq('role', 'owner') // only owner can delete
    .limit(1)
    .single();

  if (memberError || !membership) {
    return NextResponse.json({ error: 'Forbidden — owner only' }, { status: 403 });
  }

  const admin = createAdminClient();

  const { error: deleteError } = await admin
    .from('team_members')
    .delete()
    .eq('id', id)
    .eq('business_id', membership.business_id);

  if (deleteError) {
    console.error('[STAFF][DELETE] Error:', deleteError.message);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  console.log('[STAFF][DELETE] ✓ Deleted team_member:', id);
  return NextResponse.json({ success: true });
}
