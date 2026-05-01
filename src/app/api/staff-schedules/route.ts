import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const business_id = searchParams.get('business_id');
  const team_member_id = searchParams.get('team_member_id');

  if (!business_id || !team_member_id) {
    return NextResponse.json({ error: 'Missing business_id or team_member_id' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: member } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('business_id', business_id)
    .single();

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: schedules, error } = await supabase
    .from('employee_schedules')
    .select('day_of_week, start_time, end_time')
    .eq('business_id', business_id)
    .eq('team_member_id', team_member_id);

  if (error) {
    console.error('[staff-schedules GET]', error.message);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }

  return NextResponse.json({ schedules: schedules || [] });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { business_id, team_member_id, schedules } = body;

    if (!business_id || !team_member_id || !Array.isArray(schedules)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', business_id)
      .single();

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify team member belongs to this business
    const { data: targetMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('id', team_member_id)
      .eq('business_id', business_id)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: 'Team member not found in this business' }, { status: 404 });
    }

    // Delete existing schedules for this member
    await supabase
      .from('employee_schedules')
      .delete()
      .eq('business_id', business_id)
      .eq('team_member_id', team_member_id);

    // Insert new schedules
    const toInsert = schedules.filter(s => s.open).map(s => ({
      business_id,
      team_member_id,
      day_of_week: s.day_of_week,
      start_time: s.open_time,
      end_time: s.close_time
    }));

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('employee_schedules')
        .insert(toInsert);

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[staff-schedules PUT]', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
