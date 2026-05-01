import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const business_id = searchParams.get('business_id');
    const today_start = searchParams.get('today_start');
    const today_end = searchParams.get('today_end');
    const now = searchParams.get('now');

    if (!business_id || !today_start || !today_end || !now) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a team member for this business
    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', business_id)
      .single() as any;

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch today's appointments
    const { data: todayAppointments, error: todayError } = await supabase
      .from('appointments')
      .select(`
        id, status, start_time,
        appointment_services (
          service:service_id ( price )
        )
      `)
      .eq('business_id', business_id)
      .gte('start_time', today_start)
      .lte('start_time', today_end)
      .neq('status', 'cancelled');

    if (todayError) {
      throw todayError;
    }

    let todayBookingCount = 0;
    let revenueToday = 0;

    if (todayAppointments) {
      todayBookingCount = todayAppointments.length;
      todayAppointments.forEach((appt: any) => {
        if (appt.appointment_services) {
          appt.appointment_services.forEach((s: any) => {
            if (s.service && s.service.price) {
              revenueToday += Number(s.service.price);
            }
          });
        }
      });
    }

    // Fetch next upcoming appointment
    const { data: upcomingAppointments, error: upcomingError } = await supabase
      .from('appointments')
      .select(`
        id, customer_name, start_time,
        staff:assigned_employee_id ( first_name, last_name ),
        appointment_services (
          service:service_id ( name )
        )
      `)
      .eq('business_id', business_id)
      .gt('start_time', now)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true })
      .limit(1);

    if (upcomingError) {
      throw upcomingError;
    }

    let nextUpcomingAppointment = null;
    if (upcomingAppointments && upcomingAppointments.length > 0) {
      const nextAppt = upcomingAppointments[0];
      const serviceNames = nextAppt.appointment_services?.map((s: any) => s.service?.name).filter(Boolean) || [];
      const staffData = nextAppt.staff as any;
      nextUpcomingAppointment = {
        id: nextAppt.id,
        customer_name: nextAppt.customer_name,
        appointment_time: nextAppt.start_time,
        service_names: serviceNames,
        assigned_employee_name: staffData ? `${staffData.first_name} ${staffData.last_name}` : null
      };
    }

    return NextResponse.json({
      todayBookingCount,
      revenueToday,
      nextUpcomingAppointment
    });
  } catch (error: any) {
    console.error('[admin/stats API] error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
