import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/slots
 *
 * Slot generation logic:
 *  1. Fetch business operating hours for the day (outer booking window).
 *  2. If a specific employee is selected, fetch their schedule for the day.
 *     Intersect with business hours so slots only fall inside both windows.
 *     If no employee schedule exists yet, fall back to business hours.
 *  3. Fetch existing confirmed/pending appointments for the employee that day.
 *  4. Walk the window in 30-minute increments; emit a slot only when:
 *       a. the full service duration fits before the window closes, AND
 *       b. there is no overlapping appointment for that employee.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const business_id = searchParams.get('business_id');
  // Accept comma-separated service_ids (new) or single service_id (backward compat)
  const raw_service_ids = searchParams.get('service_ids') || searchParams.get('service_id') || '';
  const service_ids = raw_service_ids.split(',').map(s => s.trim()).filter(Boolean);
  const date_string = searchParams.get('date');        // YYYY-MM-DD (local date)
  const employee_id = searchParams.get('employee_id'); // UUID or 'any'

  if (!business_id || service_ids.length === 0 || !date_string) {
    return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
  }

  // day_of_week: parse from the date string parts to avoid any UTC shift.
  // new Date("YYYY-MM-DD") parses as UTC midnight, so .getUTCDay() is safe here.
  const [yyyy, mm, dd] = date_string.split('-').map(Number);
  const dayOfWeek = new Date(Date.UTC(yyyy, mm - 1, dd)).getUTCDay();

  // ── 1. Fetch services + business in parallel ──────────────────────────────
  const [servicesRes, businessRes] = await Promise.all([
    supabase
      .from('services')
      .select('id, duration_mins')
      .in('id', service_ids)
      .eq('business_id', business_id),
    supabase
      .from('businesses')
      .select('timezone')
      .eq('id', business_id)
      .single(),
  ]);

  const fetchedServices = (servicesRes.data || []) as { id: string; duration_mins: number }[];
  const business = businessRes.data as { timezone: string } | null;
  const timezone = business?.timezone ?? 'UTC';

  if (fetchedServices.length === 0) {
    return NextResponse.json({ error: 'Service(s) not found' }, { status: 404 });
  }

  // Combined duration = sum of all selected services
  const totalDurationMins = fetchedServices.reduce((sum, s) => sum + s.duration_mins, 0);

  // ── 2. Business operating hours for the day ────────────────────────────────
  const bizHoursRes = await supabase
    .from('availability')
    .select('open_time, close_time')
    .eq('business_id', business_id)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle();

  const bizHours = bizHoursRes.data as { open_time: string; close_time: string } | null;

  if (!bizHours) {
    // Business is closed on this day — return no slots.
    return NextResponse.json({ slots: [] });
  }

  // ── 3. Employee schedule for the day ──────────────────────────────────────
  const specificEmployee = employee_id && employee_id !== 'any';

  // Fetch all relevant staff schedules for this day
  let scheduleQuery = supabase
    .from('employee_schedules')
    .select('team_member_id, start_time, end_time')
    .eq('business_id', business_id)
    .eq('day_of_week', dayOfWeek);

  if (specificEmployee) {
    scheduleQuery = scheduleQuery.eq('team_member_id', employee_id);
  }

  const schedulesRes = await scheduleQuery;

  // ── 4. Existing appointments for the day ──────────────────────────────────
  // Use business hours as the absolute max query window to fetch all appointments
  const maxOpenUTC = localTimeToUTC(date_string, bizHours.open_time, timezone);
  const maxCloseUTC = localTimeToUTC(date_string, bizHours.close_time, timezone);

  if (isNaN(maxOpenUTC.getTime()) || isNaN(maxCloseUTC.getTime()) || maxOpenUTC >= maxCloseUTC) {
    console.error('[slots] Invalid max window after timezone conversion', { maxOpenUTC, maxCloseUTC });
    return NextResponse.json({ slots: [] });
  }

  const queryStart = new Date(maxOpenUTC.getTime() - 2 * 60 * 60_000).toISOString();
  const queryEnd = new Date(maxCloseUTC.getTime() + 2 * 60 * 60_000).toISOString();

  let apptQuery = supabase
    .from('appointments')
    .select('start_time, end_time, assigned_employee_id')
    .eq('business_id', business_id)
    .neq('status', 'cancelled')
    .lt('start_time', queryEnd)
    .gt('end_time', queryStart);

  if (specificEmployee) {
    // FIX: Include appointments assigned to this employee OR unassigned (null) appointments.
    // A null assigned_employee_id means the slot is occupied but not yet matched to a specific
    // staff member — it still blocks this employee's availability.
    apptQuery = apptQuery.or(`assigned_employee_id.eq.${employee_id},assigned_employee_id.is.null`);
  }

  const { data } = await apptQuery;
  const appointments = (data || []) as { start_time: string; end_time: string; assigned_employee_id: string | null }[];
  const empSchedules = (schedulesRes.data || []) as { team_member_id: string; start_time: string; end_time: string }[];

  // If specific staff selected but they have no schedule, fall back to business hours (legacy fallback)
  // If "any" selected and NO staff have schedules, fall back to business hours (legacy fallback)
  const schedulesToUse = (empSchedules.length > 0)
    ? empSchedules
    : [{ team_member_id: specificEmployee ? (employee_id as string) : 'any', start_time: bizHours.open_time, end_time: bizHours.close_time }];

  // ── 5. Generate slots ─────────────────────────────────────────────────────
  const slots: string[] = [];
  const INTERVAL_MS = 30 * 60_000;
  const durationMs = totalDurationMins * 60_000;

  // We need staffCount for the 'any' fallback mode where no schedules are set
  let fallbackStaffCount = 1;
  if (!specificEmployee && (!empSchedules || empSchedules.length === 0)) {
    const { count } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business_id)
      .eq('is_active', true);
    fallbackStaffCount = count ?? 1;
  }

  // We iterate through the business hours. A slot is valid if AT LEAST ONE staff member is available.
  let cursor = new Date(maxOpenUTC);

  while (cursor < maxCloseUTC) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + durationMs);

    // Slot must fit entirely before business closes.
    if (slotEnd > maxCloseUTC) break;

    // Check availability across all relevant schedules
    let isSlotAvailable = false;

    if (!specificEmployee && (!empSchedules || empSchedules.length === 0)) {
      // FALLBACK MODE FOR "ANY" STAFF: No schedules defined yet, use business hours + total active staff
      const overlapping = appointments.filter(appt => {
        const aStart = new Date(appt.start_time);
        const aEnd = new Date(appt.end_time);
        return aStart < slotEnd && aEnd > slotStart;
      }).length;

      if (overlapping < fallbackStaffCount) {
        isSlotAvailable = true;
      }
    } else {
      for (const schedule of schedulesToUse) {
        // Intersect staff schedule with business hours
        const staffStart = maxTime(schedule.start_time, bizHours.open_time);
        const staffEnd = minTime(schedule.end_time, bizHours.close_time);

        const staffStartUTC = localTimeToUTC(date_string, staffStart, timezone);
        const staffEndUTC = localTimeToUTC(date_string, staffEnd, timezone);

        // Does this staff member's shift cover this slot?
        if (slotStart >= staffStartUTC && slotEnd <= staffEndUTC) {
          // Yes, shift covers it. Now check their specific appointments.
          // FIX: A null assigned_employee_id appointment occupies the slot for ALL staff.
          const staffAppts = appointments.filter(
            a => a.assigned_employee_id === schedule.team_member_id || a.assigned_employee_id === null
          );

          const hasOverlap = staffAppts.some(appt => {
            const aStart = new Date(appt.start_time);
            const aEnd = new Date(appt.end_time);
            // Correct boundary: slot_start < appt_end AND slot_end > appt_start
            // This means: slot_end == appt_start is VALID (adjacent, not overlapping)
            return aStart < slotEnd && aEnd > slotStart;
          });

          if (!hasOverlap) {
            isSlotAvailable = true;
            break; // We only need ONE available staff member to offer the slot
          }
        }
      }
    }

    if (isSlotAvailable) {
      slots.push(slotStart.toISOString());
    }

    cursor = new Date(cursor.getTime() + INTERVAL_MS);
  }

  return NextResponse.json({ slots });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a "HH:MM" or "HH:MM:SS" local time on a given date in a named timezone
 * into a UTC Date object.
 *
 * Strategy: treat the time as if it were UTC first, then ask Intl what the
 * target timezone's clock shows at that moment, compute the delta, and apply it.
 */
function localTimeToUTC(dateStr: string, timeStr: string, tz: string): Date {
  const parts = timeStr.split(':').map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const s = parts[2] ?? 0;

  const pad = (n: number) => String(n).padStart(2, '0');
  const candidateISO = `${dateStr}T${pad(h)}:${pad(m)}:${pad(s)}Z`;
  const candidateUTC = new Date(candidateISO);

  if (isNaN(candidateUTC.getTime())) {
    throw new Error(`[slots] Invalid time value: ${dateStr} ${timeStr}`);
  }

  // What does the target timezone's clock show at this UTC moment?
  const fmt = new Intl.DateTimeFormat('en-CA', {   // en-CA → YYYY-MM-DD, HH:MM:SS
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });

  const p: Record<string, string> = {};
  fmt.formatToParts(candidateUTC).forEach(({ type, value }) => { p[type] = value; });

  const localH = parseInt(p.hour, 10) % 24;   // guard against rare hour=24 case
  const localM = parseInt(p.minute, 10);
  const localS = parseInt(p.second, 10);

  // Delta between desired local time and what tz shows
  const tzOffsetMs =
    (h * 3600 + m * 60 + s) * 1000 -
    (localH * 3600 + localM * 60 + localS) * 1000;

  return new Date(candidateUTC.getTime() + tzOffsetMs);
}

/** Return the later of two "HH:MM:SS" time strings (lexicographic safe for TIME). */
function maxTime(a: string, b: string): string {
  return a >= b ? a : b;
}

/** Return the earlier of two "HH:MM:SS" time strings. */
function minTime(a: string, b: string): string {
  return a <= b ? a : b;
}
