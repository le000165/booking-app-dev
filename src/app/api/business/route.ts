import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/business?slug=luxe-nails
 * Public endpoint to resolve a business by slug.
 * Used by the booking page to load business info.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
  }

  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, name, slug, email, phone, address, timezone, is_active')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  return NextResponse.json({ business });
}
