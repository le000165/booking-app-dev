import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendAppointmentReminderEmail } from '@/lib/email';
import { sendSMS } from '@/lib/sms';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { channel } = await request.json();

    if (!id || (channel !== 'email' && channel !== 'sms')) {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch appointment and related data
    const { data: appt, error } = await supabase
      .from('appointments')
      .select(`
        id, status, customer_name, customer_email, customer_phone, start_time, end_time,
        business_id, assigned_employee_id,
        staff:assigned_employee_id ( id, first_name, last_name ),
        businesses ( id, name, slug ),
        appointment_services (
          service:service_id ( id, name, duration_mins, price )
        )
      `)
      .eq('id', id)
      .single();

    const apptData = appt as any;

    if (error || !appt) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    // Check admin permissions
    const { data: member } = await supabase
      .from('team_members')
      .select('id, role')
      .eq('user_id', user.id)
      .eq('business_id', appt.business_id)
      .single();

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Validate status
    if (apptData.status === 'cancelled' || apptData.status === 'completed') {
      return NextResponse.json({ success: false, error: 'Cannot send reminder for completed or cancelled appointments' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const manageUrl = `${appUrl}/booking/manage?id=${apptData.id}`;
    
    // Prepare data
    const businessName = apptData.businesses?.name || 'Your Business';
    const staffName = apptData.staff ? `${apptData.staff.first_name} ${apptData.staff.last_name}` : null;
    const serviceNames = apptData.appointment_services?.map((s: any) => s.service.name) || [];

    // Send based on channel
    if (channel === 'email') {
      if (!apptData.customer_email) {
        return NextResponse.json({ success: false, error: 'Customer email is missing' }, { status: 400 });
      }

      try {
        const result = await sendAppointmentReminderEmail({
          to: apptData.customer_email,
          customerName: apptData.customer_name,
          businessName,
          appointmentTime: apptData.start_time,
          serviceNames,
          staffName,
          manageUrl,
          status: apptData.status,
        });
        return NextResponse.json({ success: true, channel: 'email', message: 'Reminder sent' });
      } catch (err: any) {
        console.error("[reminder] error:", err);
        return NextResponse.json({ success: false, error: err.message || 'Failed to send email' }, { status: 500 });
      }
    } else if (channel === 'sms') {
      if (!apptData.customer_phone) {
        return NextResponse.json({ success: false, error: 'Customer phone is missing' }, { status: 400 });
      }

      try {
        const dateStr = new Date(apptData.start_time).toLocaleString('en-US', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        });
        const serviceText = serviceNames.length > 0 ? serviceNames[0] : 'your appointment';
        const body = `Reminder: Your appointment is on ${dateStr} for ${serviceText}. Manage: ${manageUrl}`;
        
        const result = await sendSMS({
          to: apptData.customer_phone,
          body,
        });
        return NextResponse.json({ success: true, channel: 'sms', message: 'Reminder sent' });
      } catch (err: any) {
        console.error("[reminder] error:", err);
        return NextResponse.json({ success: false, error: err.message || 'Failed to send SMS' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ success: false, error: 'Unknown channel' }, { status: 400 });
  } catch (error: any) {
    console.error("[reminder] error:", error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
