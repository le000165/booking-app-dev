import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/onboarding/staff
// Updates the owner's own team_member profile name (they ARE the first staff)
export async function POST(request: Request) {
  console.log('[API][onboarding/staff] POST request initiated');
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[API][onboarding/staff] 401 Unauthorized:', authError?.message || 'No user found');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { first_name, last_name } = body;

  if (!first_name?.trim()) {
    return NextResponse.json({ error: 'First name is required' }, { status: 400 });
  }

  console.log('[API][onboarding/staff] Updating profile for user:', user.id);

  // Update the owner's own team_member row
  const { data: updatedStaff, error } = await supabase
    .from('team_members')
    .update({
      first_name: first_name.trim(),
      last_name: last_name?.trim() || '',
    })
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) {
    console.error('[API][onboarding/staff] update error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('[API][onboarding/staff] Successfully updated staff profile');

  return NextResponse.json({ 
    success: true,
    data: updatedStaff 
  });
}
