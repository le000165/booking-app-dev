import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug        = searchParams.get('slug');
  const business_id = searchParams.get('business_id');
  const isAdmin     = searchParams.get('admin') === 'true';

  if (!slug && !business_id) {
    return NextResponse.json({ error: 'Missing slug or business_id' }, { status: 400 });
  }

  const supabase = await createClient();
  let resolvedBusinessId = business_id;

  if (slug && !business_id) {
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    resolvedBusinessId = business.id;
  }

  // If requesting admin view, verify user is a team member
  if (isAdmin) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', resolvedBusinessId!)
      .single();
    
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  let query = supabase
    .from('services')
    .select('id, name, duration_mins, price, is_active, description, emoji')
    .eq('business_id', resolvedBusinessId!)
    .order('created_at', { ascending: true });

  if (!isAdmin) {
    query = query.eq('is_active', true);
  }

  const { data: services, error } = await query;

  if (error) {
    console.error('[services GET]', error.message);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }

  return NextResponse.json({ services: services || [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { business_id, name, duration_mins, price, description, emoji } = body;

    if (!business_id || !name || !duration_mins || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is an admin/owner for this business
    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', business_id)
      .single();

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('services')
      .insert([{
        business_id,
        name:          name.trim(),
        duration_mins: Number(duration_mins),
        price:         Number(price),
        description:   description?.trim() || null,
        emoji:         emoji?.trim() || null,
        is_active:     true,
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ service: data }, { status: 201 });
  } catch (error: any) {
    console.error('[services POST]', error.message);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing service id' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the service first to get its business_id for authorization
    const { data: service } = await supabase
      .from('services')
      .select('business_id')
      .eq('id', id)
      .single();

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Verify user is an admin/owner for this business
    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', service.business_id)
      .single();

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowed = ['name', 'duration_mins', 'price', 'description', 'emoji', 'is_active'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (fields[key] !== undefined) updates[key] = fields[key];
    }

    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ service: data });
  } catch (error: any) {
    console.error('[services PUT]', error.message);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing service id' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the service first to get its business_id for authorization
    const { data: service } = await supabase
      .from('services')
      .select('business_id')
      .eq('id', id)
      .single();

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Verify user is an admin/owner for this business
    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', service.business_id)
      .single();

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[services DELETE]', error.message);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
