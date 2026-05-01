import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/employees?business_id=xyz
 * Returns active team members for a business.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const business_id = searchParams.get('business_id');
  // Accept comma-separated service_ids (new) or single service_id (backward compat)
  const raw = searchParams.get('service_ids') || searchParams.get('service_id') || '';
  const service_ids = raw.split(',').map(s => s.trim()).filter(Boolean);

  if (!business_id) {
    return NextResponse.json({ error: 'Missing business_id' }, { status: 400 });
  }

  let query = supabase
    .from('team_members')
    .select('id, user_id, role, first_name, last_name')
    .eq('business_id', business_id)
    .eq('is_active', true);

  // If services are specified, only return staff eligible for ALL of them
  if (service_ids.length > 0) {
    // Fetch mappings for all service_ids
    const { data: mappings, error: mappingError } = await supabase
      .from('service_team_members')
      .select('team_member_id, service_id')
      .in('service_id', service_ids);

    if (mappingError) {
      console.error('[employees] service_team_members query error:', mappingError.message);
    } else {
      // Build a map: team_member_id → count of matched services
      const countMap: Record<string, number> = {};
      for (const m of (mappings || [])) {
        countMap[m.team_member_id] = (countMap[m.team_member_id] || 0) + 1;
      }
      // Only staff who match ALL requested services
      const validIds = Object.entries(countMap)
        .filter(([, count]) => count >= service_ids.length)
        .map(([id]) => id);
      console.log(`[employees] staff eligible for all ${service_ids.length} service(s):`, validIds);
      if (validIds.length > 0) {
        query = query.in('id', validIds);
      } else {
        return NextResponse.json({ employees: [] });
      }
    }
  }

  const { data, error } = await query;
  console.log('[employees] team_members result:', data?.length ?? 0, 'rows, error:', error?.message);

  if (error) {
    console.error('Failed to fetch staff:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }

  return NextResponse.json({ employees: data || [] });
}
