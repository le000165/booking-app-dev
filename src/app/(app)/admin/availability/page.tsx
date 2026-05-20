import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Availability',
};

export default function AdminAvailabilityPage() {
  redirect('/admin?tab=availability');
}
