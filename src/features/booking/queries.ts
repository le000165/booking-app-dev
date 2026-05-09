import { createClient } from '@/lib/supabase/server';

export interface PublicBookingBusiness {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  timezone: string;
}

export interface PublicBookingService {
  id: string;
  name: string;
  duration_mins: number;
  price: number;
  emoji?: string;
}

export async function getPublicBookingData(slug: string) {
  const supabase = await createClient();

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, name, slug, address, timezone')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (businessError || !business) {
    return null;
  }

  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, name, duration_mins, price, emoji')
    .eq('business_id', business.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (servicesError) {
    return null;
  }

  return {
    business: business as PublicBookingBusiness,
    services: (services || []) as PublicBookingService[],
  };
}
