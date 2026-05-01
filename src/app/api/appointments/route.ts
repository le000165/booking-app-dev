import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendAppointmentConfirmationEmail } from '@/lib/email';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const business_id = searchParams.get('business_id');
  const status      = searchParams.get('status');
  const staff_id    = searchParams.get('staff_id');
  const search      = searchParams.get('search');
  const from        = searchParams.get('from');
  const to          = searchParams.get('to');

  // console.log('[appointments API] Incoming params:', { business_id, status, staff_id, search, from, to });

  if (!business_id) {
    console.warn('[appointments API] Missing business_id');
    return NextResponse.json({ error: 'Missing business_id' }, { status: 400 });
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
    .single();

  if (!member) {
    console.warn('[appointments API] Forbidden: User is not a member of business', business_id);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // console.log('[appointments API] User role verified:', member.role);

  let query = supabase
    .from('appointments')
    .select(`
      id, status, customer_name, customer_email, customer_phone,
      start_time, end_time, created_at,
      assigned_employee_id,
      staff:assigned_employee_id ( id, first_name, last_name ),
      appointment_services (
        service:service_id ( id, name, duration_mins, price )
      )
    `)
    .eq('business_id', business_id)
    .order('start_time', { ascending: false });

  // Status Filter Logic
  let statusesToFilter: string[] = [];
  if (status && status !== 'all') {
    // console.log('[appointments API] Parsing status filter:', status);
    // Split comma-separated values (e.g. "confirmed,completed")
    statusesToFilter = status.split(',').map(s => s.trim()).filter(Boolean);
    // console.log('[appointments API] Statuses split into array:', statusesToFilter);
  }

  if (statusesToFilter.length > 0) {
    // console.log('[appointments API] Applying IN filter for statuses:', statusesToFilter);
    query = query.in('status', statusesToFilter);
  }

  if (staff_id) {
    // console.log('[appointments API] Filtering by staff_id:', staff_id);
    query = query.eq('assigned_employee_id', staff_id);
  }
  if (search) {
    // console.log('[appointments API] Filtering by search:', search);
    query = query.ilike('customer_name', `%${search}%`);
  }
  if (from) {
    // console.log('[appointments API] Filtering from (ISO):', from);
    // console.log('[appointments API] Timezone context: Server time is', new Date().toString(), 'Query using GTE:', from);
    query = query.gte('start_time', from);
  }
  if (to) {
    // console.log('[appointments API] Filtering to (ISO):', to);
    // console.log('[appointments API] Query using LTE:', to);
    query = query.lte('start_time', to);
  }

  // console.log('[appointments API] Executing query for business:', business_id);


  const { data, error } = await query;

  if (error) {
    console.error('[appointments API] Supabase error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }

  // console.log(`[appointments API] Result: ${data?.length || 0} appointments found`);
  if (!data || data.length === 0) {
    console.warn('[appointments API] NO APPOINTMENTS FOUND. Possible causes: RLS blocking, wrong date range, invalid status filter, or missing records.');
  }

  return NextResponse.json({ appointments: data || [] });
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      business_id, service_id, service_ids,
      assigned_employee_id, customer_name, customer_email, customer_phone,
      start_time, end_time
    } = body;

    // Support both single service_id (old) and array service_ids (new)
    const allServiceIds: string[] = service_ids && service_ids.length > 0
      ? service_ids
      : service_id ? [service_id] : [];
    const primaryServiceId = allServiceIds[0] || null;

    if (!business_id || allServiceIds.length === 0 || !start_time || !end_time || !customer_name || !customer_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const appointmentId = crypto.randomUUID();
    let finalEmployeeId = (assigned_employee_id === 'any' || !assigned_employee_id) ? null : assigned_employee_id;

    // Auto-assign if "Any" was selected
    if (!finalEmployeeId) {
      // Find all staff for this business
      const { data: staff } = await supabase
        .from('team_members')
        .select('id')
        .eq('business_id', business_id)
        .eq('is_active', true);

      if (staff && staff.length > 0) {
        // Find existing appointments that overlap with this slot
        const { data: overlaps } = await supabase
          .from('appointments')
          .select('assigned_employee_id')
          .eq('business_id', business_id)
          .neq('status', 'cancelled')
          .lt('start_time', end_time)
          .gt('end_time', start_time);

        const busyIds = new Set(overlaps?.map(o => o.assigned_employee_id));
        // Pick the first staff member who isn't busy
        const availableStaff = staff.find(s => !busyIds.has(s.id));
        if (availableStaff) {
          finalEmployeeId = availableStaff.id;
        } else {
           return NextResponse.json({ error: 'No staff available at this time', code: 'CONFLICT' }, { status: 409 });
        }
      }
    }

    // Check for direct overlaps to prevent double bookings if GiST is missing
    if (finalEmployeeId) {
      const { data: directOverlaps } = await supabase
        .from('appointments')
        .select('id')
        .eq('business_id', business_id)
        .eq('assigned_employee_id', finalEmployeeId)
        .neq('status', 'cancelled')
        .lt('start_time', end_time)
        .gt('end_time', start_time)
        .limit(1);

      if (directOverlaps && directOverlaps.length > 0) {
        return NextResponse.json({ error: 'This time slot is no longer available.', code: 'CONFLICT' }, { status: 409 });
      }
    }

    // Insert appointment
    const { error } = await supabase
      .from('appointments')
      .insert([{
        id:                   appointmentId,
        business_id,
        service_id:           primaryServiceId,
        assigned_employee_id: finalEmployeeId,
        customer_name,
        customer_email,
        customer_phone,
        start_time,
        end_time,
        status: 'confirmed',
      }]);

    if (error) {
      if (error.code === '23P01') {
        return NextResponse.json({ error: 'This time slot is no longer available.', code: 'CONFLICT' }, { status: 409 });
      }
      throw error;
    }

    // Insert one row per selected service into the join table
    if (allServiceIds.length > 0) {
      const serviceRows = allServiceIds.map(sid => ({
        appointment_id: appointmentId,
        service_id:     sid,
        business_id,
      }));
      const { error: svcError } = await supabase
        .from('appointment_services')
        .insert(serviceRows);
      if (svcError) {
        console.error('[appointments] Failed to insert appointment_services:', svcError.message);
      }
    }

    // ── Send confirmation email ──────────────────────────────────────
    let emailSent = false;
    let emailError: string | undefined;

    try {
      // console.log('[booking email] preparing confirmation email');
      // console.log('[booking email] to:', customer_email);
      // console.log('[booking email] appointment id:', appointmentId);

      // Fetch service names for the email
      let serviceNames: string[] = [];
      if (allServiceIds.length > 0) {
        const { data: svcs } = await supabase
          .from('services')
          .select('name')
          .in('id', allServiceIds);
        serviceNames = svcs?.map((s: any) => s.name) ?? [];
      }

      // Fetch business name
      const { data: biz } = await supabase
        .from('businesses')
        .select('name')
        .eq('id', business_id)
        .single();
      const bizData = biz as any;
      const businessName = bizData?.name ?? 'Your Business';

      // Fetch staff name if assigned
      let staffName: string | null = null;
      if (finalEmployeeId) {
        const { data: member } = await supabase
          .from('team_members')
          .select('first_name, last_name')
          .eq('id', finalEmployeeId)
          .single();
        const memberData = member as any;
        if (memberData) staffName = `${memberData.first_name} ${memberData.last_name}`;
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const manageUrl = `${appUrl}/booking/manage?id=${appointmentId}`;

      // console.log('[booking email] manage url:', manageUrl);

      const result = await sendAppointmentConfirmationEmail({
        to: customer_email,
        customerName: customer_name,
        businessName,
        appointmentTime: start_time,
        serviceNames,
        staffName,
        status: 'confirmed',
        manageUrl,
      });

      // console.log('[booking email] sent:', result);
      emailSent = true;
    } catch (err: any) {
      console.error('[booking email] failed:', err?.message ?? err);
      emailError = err?.message ?? 'Unknown email error';
    }
    // ────────────────────────────────────────────────────────────────

    return NextResponse.json(
      {
        appointment: { id: appointmentId },
        emailSent,
        ...(emailError ? { emailError } : {}),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to create appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
