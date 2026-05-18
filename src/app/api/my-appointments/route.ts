import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(request.url);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find their team_members row
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('id, business_id, role, is_active, first_name, last_name, email, phone')
      .eq('user_id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Employee record not found' }, { status: 404 });
    }

    if (!member.is_active) {
      return NextResponse.json({ error: 'Employee record is inactive' }, { status: 403 });
    }

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, timezone, phone, address')
      .eq('id', member.business_id)
      .single();

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business record not found' }, { status: 404 });
    }

    const requestedFrom = searchParams.get('from');
    const requestedTo = searchParams.get('to');

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const fallbackEnd = new Date(now);
    fallbackEnd.setDate(now.getDate() + 7);

    const rangeStart = requestedFrom ? new Date(requestedFrom) : now;
    const rangeEnd = requestedTo ? new Date(requestedTo) : fallbackEnd;

    if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime()) || rangeStart >= rangeEnd) {
      return NextResponse.json({ error: 'Invalid appointment date range' }, { status: 400 });
    }

    const { data: appointments, error: apptError } = await supabase
      .from('appointments')
      .select(`
        id,
        business_id,
        assigned_employee_id,
        start_time,
        end_time,
        status,
        customer_name,
        customer_email,
        customer_phone,
        service_id,
        appointment_services(
          services(id, name, duration_mins, price, emoji)
        )
      `)
      .eq('business_id', member.business_id)
      .eq('assigned_employee_id', member.id)
      .gte('start_time', rangeStart.toISOString())
      .lt('start_time', rangeEnd.toISOString())
      .order('start_time', { ascending: true });

    if (apptError) {
      console.error('[my-appointments GET] Fetch error:', apptError.message);
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }

    // Flatten services like we do in admin
    const formatted = appointments?.map(appt => ({
      ...appt,
      services: appt.appointment_services
        ?.map((as: any) => as.services)
        .filter(Boolean) || []
    })) || [];

    return NextResponse.json({ appointments: formatted, employee: member, business });
  } catch (error: any) {
    console.error('[my-appointments GET]', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
