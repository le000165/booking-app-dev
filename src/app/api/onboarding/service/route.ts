import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/onboarding/service
// Creates the first service for the authenticated owner's business
export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, duration_mins, price } = body;

  if (!name?.trim() || !duration_mins || price === undefined) {
    return NextResponse.json({ error: 'Name, duration, and price are required' }, { status: 400 });
  }

  // Resolve business_id from session
  const { data: membership, error: memberError } = await supabase
    .from('business_members')
    .select('business_id, role')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .limit(1)
    .single();

  if (memberError || !membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase
    .from('services')
    .insert({
      business_id: membership.business_id,
      name: name.trim(),
      duration_mins: Number(duration_mins),
      price: Number(price),
      is_active: true,
    });

  if (error) {
    console.error('[onboarding/service] insert error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
