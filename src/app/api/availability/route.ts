import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const business_id = searchParams.get('business_id');

  if (!business_id) {
    return NextResponse.json({ error: 'Missing business_id' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('availability')
    .select('id, day_of_week, open_time, close_time')
    .eq('business_id', business_id)
    .order('day_of_week', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }

  return NextResponse.json({ availability: data || [] });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { business_id, hours } = body;

    if (!business_id || !hours) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is an admin/owner for this business
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', business_id)
      .single();

    if (memberError || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete existing availability for this business, then re-insert open days
    const { error: deleteError } = await supabase
      .from('availability')
      .delete()
      .eq('business_id', business_id);

    if (deleteError) throw deleteError;

    // Filter to only open days and insert
    const openDays = hours
      .filter((h: any) => h.open)
      .map((h: any) => ({
        business_id,
        day_of_week: h.day_of_week,
        open_time: h.open_time,
        close_time: h.close_time,
      }));

    if (openDays.length > 0) {
      const { error: insertError } = await supabase
        .from('availability')
        .insert(openDays);

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update availability:', error);
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
  }
}
