import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_STATUSES = ['confirmed', 'completed', 'cancelled', 'no_show'];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const supabase = await createClient();

    // Fetch appointment public details (anonymous access allowed for dev sprint)
    // TODO: Secure this with signed email token or verification token
    const { data: appt, error } = await supabase
      .from('appointments')
      .select(`
        id, status, customer_name, customer_email, start_time, end_time,
        business_id, assigned_employee_id,
        staff:assigned_employee_id ( id, first_name, last_name ),
        businesses ( id, name, slug ),
        appointment_services (
          service:service_id ( id, name, duration_mins, price )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !appt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ appointment: appt });
  } catch (error: any) {
    console.error('[appointments GET]', error.message);
    return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      status, assigned_employee_id, start_time, end_time, service_ids,
      customer_name, customer_email, customer_phone
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing appointment id' }, { status: 400 });
    }

    // Use service role key to bypass RLS for this specific anonymous cancel operation
    // Or we can just use the anon key if RLS allows it. Let's use the standard createClient and catch the RLS error to inform the user.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch appointment to get business_id and current times
    const { data: appt } = await supabase
      .from('appointments')
      .select('business_id, start_time, end_time, assigned_employee_id, customer_name, customer_email, customer_phone, status')
      .eq('id', id)
      .single();

    if (!appt) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    // ANONYMOUS CUSTOMER CANCELLATION
    if (!user) {
      const keys = Object.keys(body);
      if (keys.length === 1 && keys[0] === 'status' && status === 'cancelled') {
        if (appt.status === 'cancelled' || appt.status === 'completed') {
          return NextResponse.json({ success: false, error: 'Appointment cannot be cancelled' }, { status: 400 });
        }

        const { error: updateError } = await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', id);
          
        // console.log("[appointments PATCH] supabase error:", updateError);
          
        if (updateError) {
          return NextResponse.json(
            { success: false, error: updateError.message },
            { status: 500 }
          );
        }
        
        // Since we omitted .select() to bypass missing anonymous SELECT policies,
        // we manually reconstruct the updated appointment from the data we already fetched.
        const updatedAppointment = { ...appt, status: 'cancelled' };
        return NextResponse.json({ success: true, appointment: updatedAppointment });
      }
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // AUTHENTICATED STAFF/ADMIN LOGIC
    // Verify user belongs to this business
    const { data: member } = await supabase
      .from('team_members')
      .select('id, role')
      .eq('user_id', user.id)
      .eq('business_id', appt.business_id)
      .single();

    if (!member) {
      console.error('[PATCH] Forbidden: User is not a team member of business', appt.business_id);
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      console.error('[PATCH] Invalid status:', status);
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const isAdmin = ['owner', 'admin'].includes(member.role);

    // If employee, they can only update their own appointment's status
    if (!isAdmin) {
      if (appt.assigned_employee_id !== member.id) {
        return NextResponse.json({ success: false, error: 'Forbidden: Cannot update other employees appointments' }, { status: 403 });
      }
      
      // Employees should only be able to update status
      if (assigned_employee_id || start_time || end_time || service_ids || customer_name || customer_email || customer_phone !== undefined) {
        return NextResponse.json({ success: false, error: 'Forbidden: Employees can only update appointment status' }, { status: 403 });
      }
    }

    // 1. Conflict Check: If time or staff changed, ensure no overlaps
    const newStaffId = assigned_employee_id || appt.assigned_employee_id;
    const newStart = start_time || appt.start_time;
    const newEnd = end_time || appt.end_time;

    if (newStaffId && (start_time || end_time || assigned_employee_id)) {
      const { data: overlaps } = await supabase
        .from('appointments')
        .select('id')
        .eq('assigned_employee_id', newStaffId)
        .neq('id', id)
        .neq('status', 'cancelled')
        .lt('start_time', newEnd)
        .gt('end_time', newStart);

      if (overlaps && overlaps.length > 0) {
        return NextResponse.json({ success: false, error: 'This time slot conflicts with another appointment for this staff member.', code: 'CONFLICT' }, { status: 409 });
      }
    }

    // 2. Update appointment record
    const updates: any = {};
    if (status) updates.status = status;
    if (assigned_employee_id) updates.assigned_employee_id = assigned_employee_id;
    if (start_time) updates.start_time = start_time;
    if (end_time) updates.end_time = end_time;
    if (service_ids && service_ids.length > 0) updates.service_id = service_ids[0];
    if (customer_name) updates.customer_name = customer_name;
    if (customer_email) updates.customer_email = customer_email;
    if (customer_phone !== undefined) updates.customer_phone = customer_phone;



    const { data: updatedData, error: updateError } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    // console.log("[appointments PATCH] supabase data:", updatedData);
    // console.log("[appointments PATCH] supabase error:", updateError);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // 3. Update appointment_services if provided
    if (service_ids && service_ids.length > 0) {
      // Clear old services
      await supabase.from('appointment_services').delete().eq('appointment_id', id);

      // Insert new ones
      const newSvcRows = service_ids.map((sid: string) => ({
        appointment_id: id,
        service_id: sid,
        business_id: appt.business_id
      }));

      const { error: svcError } = await supabase
        .from('appointment_services')
        .insert(newSvcRows);

      if (svcError) console.error('[PATCH appt] svc error:', svcError.message);
    }

    return NextResponse.json({ success: true, appointment: updatedData });
  } catch (error: any) {
    console.error('[appointments PATCH] Uncaught error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

