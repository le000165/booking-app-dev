import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { BusinessMemberRole } from '@/types/database';

export function isAdminRole(role: BusinessMemberRole | null | undefined) {
  return role === 'owner' || role === 'admin';
}

export function isStaffRole(role: BusinessMemberRole | null | undefined) {
  return role === 'staff';
}

export async function requireBusinessMember(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const { data: member } = await supabase
    .from('team_members')
    .select('id, role, business_id')
    .eq('user_id', user.id)
    .eq('business_id', businessId)
    .eq('is_active', true)
    .single();

  if (!member) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { supabase, user, member };
}

export async function requireAdminOrOwner(businessId: string) {
  const result = await requireBusinessMember(businessId);

  if ('error' in result) {
    return result;
  }

  if (!isAdminRole(result.member.role)) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return result;
}
