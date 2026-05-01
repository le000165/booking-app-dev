import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find their team_members row
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('id, business_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Employee record not found' }, { status: 404 });
    }

    // Get today's start and end of week (we will fetch from start of today to end of week)
    // Actually, let's just fetch all upcoming appointments from today onwards, 
    // or we can let the frontend filter them, but it's better to fetch upcoming ones.
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7); // Next 7 days

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
      .gte('start_time', now.toISOString())
      .lte('start_time', nextWeek.toISOString())
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

    return NextResponse.json({ appointments: formatted, employee: member });
  } catch (error: any) {
    console.error('[my-appointments GET]', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
