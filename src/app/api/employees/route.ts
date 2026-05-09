import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * Admin (service-role) client — bypasses RLS so the public booking page
 * can read team_members and service_team_members without requiring a session.
 * This route must NEVER expose private fields like user_id, email, or phone.
 */
/**
 * GET /api/employees?business_id=xyz&service_ids=a,b
 *
 * Returns active team members for a business, optionally filtered
 * by service eligibility via service_team_members mappings.
 *
 * Fallback behaviour:
 *   If NO rows exist in service_team_members for the requested service(s),
 *   we treat it as "no filter" and return ALL active staff for the business.
 *   This ensures new businesses (with no service-staff mappings yet) still
 *   show staff on the public booking page.
 *
 * Privacy:
 *   Only safe public fields are returned: id, first_name, last_name, role.
 *   user_id, email, phone are never included.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const business_id = searchParams.get('business_id');
  // Accept comma-separated service_ids (new) or single service_id (backward compat)
  const raw = searchParams.get('service_ids') || searchParams.get('service_id') || '';
  const service_ids = raw.split(',').map(s => s.trim()).filter(Boolean);

  console.log('[employees] GET called — business_id:', business_id, '| service_ids:', service_ids);

  if (!business_id) {
    return NextResponse.json({ error: 'Missing business_id' }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  // ── 1. Resolve service-staff filter (only when service_ids provided) ────────
  let eligibleIds: string[] | null = null; // null = "no filter, return all"

  if (service_ids.length > 0) {
    const { data: mappings, error: mappingError } = await admin
      .from('service_team_members')
      .select('team_member_id, service_id')
      .eq('business_id', business_id)
      .in('service_id', service_ids);

    if (mappingError) {
      console.error('[employees] service_team_members query error:', mappingError.message);
      // On error, fall through and return all active staff rather than failing silently.
    } else {
      console.log('[employees] service_team_members rows found:', mappings?.length ?? 0,
        '| for services:', service_ids);

      if (!mappings || mappings.length === 0) {
        // ── KEY FIX ──────────────────────────────────────────────────────────
        // No service-staff mappings exist yet (typical for a new business).
        // Do NOT return empty — fall back to all active staff so the booking
        // page shows staff options. Admin can assign services to staff later.
        console.log('[employees] No service_team_members mappings found — falling back to all active staff');
        eligibleIds = null; // "no filter"
      } else {
        // Build a map: team_member_id → count of matched services
        const countMap: Record<string, number> = {};
        for (const m of mappings) {
          countMap[m.team_member_id] = (countMap[m.team_member_id] || 0) + 1;
        }
        // Only staff who can perform ALL requested services
        const validIds = Object.entries(countMap)
          .filter(([, count]) => count >= service_ids.length)
          .map(([id]) => id);

        console.log('[employees] staff eligible for all', service_ids.length, 'service(s):', validIds);
        eligibleIds = validIds; // may be empty — handled below
      }
    }
  }

  // ── 2. Query team_members ────────────────────────────────────────────────────
  let query = admin
    .from('team_members')
    .select('id, first_name, last_name, role') // ← NO user_id, email, phone
    .eq('business_id', business_id)
    .eq('is_active', true);

  if (eligibleIds !== null) {
    if (eligibleIds.length === 0) {
      // Mappings existed but no staff match all services — return empty
      console.log('[employees] Mappings exist but no staff qualifies for all requested services → []');
      return NextResponse.json({ employees: [] });
    }
    query = query.in('id', eligibleIds);
  }

  const { data, error } = await query;

  console.log('[employees] team_members result:', data?.length ?? 0, 'rows | error:', error?.message ?? 'none');

  if (error) {
    console.error('[employees] Failed to fetch staff:', error.message);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }

  return NextResponse.json({ employees: data || [] });
}
