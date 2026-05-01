import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const business_id = searchParams.get('business_id');

  if (!business_id) {
    return NextResponse.json({ error: 'Missing business_id' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user is an admin/owner for this business
  const { data: member } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('business_id', business_id)
    .single();

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch all team members for this business
  const { data: staff, error } = await supabase
    .from('team_members')
    .select('id, user_id, first_name, last_name, role, is_active')
    .eq('business_id', business_id);

  if (error) {
    console.error('[staff GET]', error.message);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }

  return NextResponse.json({ staff: staff || [] });
}

