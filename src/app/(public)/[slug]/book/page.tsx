import { notFound } from 'next/navigation';
import BookingFlow from '@/components/booking/BookingFlow';
import { getPublicBookingData } from '@/features/booking/queries';

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicBookingData(slug);

  if (!data) {
    notFound();
  }

  return (
    <BookingFlow
      business={data.business}
      initialServices={data.services}
    />
  );
}
