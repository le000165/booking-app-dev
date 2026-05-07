import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PUT /api/onboarding/availability
// Upserts business availability (open days + hours) during onboarding
export async function PUT(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { hours } = body as {
    hours: { day_of_week: number; open: boolean; open_time: string; close_time: string }[];
  };

  if (!Array.isArray(hours)) {
    return NextResponse.json({ error: 'Invalid hours data' }, { status: 400 });
  }

  // Resolve business_id from session
  const { data: membership, error: memberError } = await supabase
    .from('business_members')
    .select('business_id, role')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .limit(1)
    .single();

  if (memberError || !membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const businessId = membership.business_id;

  // Delete existing availability rows and re-insert enabled days
  await supabase.from('availability').delete().eq('business_id', businessId);

  const openDays = hours.filter(h => h.open);
  if (openDays.length > 0) {
    const rows = openDays.map(h => ({
      business_id: businessId,
      day_of_week: h.day_of_week,
      open_time: h.open_time,
      close_time: h.close_time,
    }));

    const { error } = await supabase.from('availability').insert(rows);
    if (error) {
      console.error('[onboarding/availability] insert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
