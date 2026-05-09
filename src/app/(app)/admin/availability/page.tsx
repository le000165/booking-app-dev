import { redirect } from 'next/navigation';

export default function AdminAvailabilityPage() {
  redirect('/admin?tab=availability');
}
