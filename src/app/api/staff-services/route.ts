import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const business_id = searchParams.get('business_id');
  const team_member_id = searchParams.get('team_member_id');

  if (!business_id || !team_member_id) {
    return NextResponse.json({ error: 'Missing business_id or team_member_id' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: member } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('business_id', business_id)
    .single();

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: services, error } = await supabase
    .from('service_team_members')
    .select('service_id')
    .eq('business_id', business_id)
    .eq('team_member_id', team_member_id);

  if (error) {
    console.error('[staff-services GET]', error.message);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }

  return NextResponse.json({ service_ids: services.map(s => s.service_id) || [] });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { business_id, team_member_id, service_ids } = body;

    if (!business_id || !team_member_id || !Array.isArray(service_ids)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', business_id)
      .single();

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify team member belongs to this business
    const { data: targetMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('id', team_member_id)
      .eq('business_id', business_id)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: 'Team member not found in this business' }, { status: 404 });
    }

    // Verify all services belong to this business
    if (service_ids.length > 0) {
      const { data: validServices } = await supabase
        .from('services')
        .select('id')
        .eq('business_id', business_id)
        .in('id', service_ids);
        
      if (!validServices || validServices.length !== service_ids.length) {
          return NextResponse.json({ error: 'Invalid service IDs provided' }, { status: 400 });
      }
    }

    // Delete existing mappings for this member
    const { error: deleteError } = await supabase
      .from('service_team_members')
      .delete()
      .eq('business_id', business_id)
      .eq('team_member_id', team_member_id);

    if (deleteError) {
      console.error('[staff-services PUT] Delete error:', deleteError.message);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Insert new mappings
    if (service_ids.length > 0) {
      const toInsert = service_ids.map(service_id => ({
        business_id,
        team_member_id,
        service_id
      }));

      const { error: insertError } = await supabase
        .from('service_team_members')
        .insert(toInsert);

      if (insertError) {
        console.error('[staff-services PUT] Insert error:', insertError.message);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[staff-services PUT]', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
