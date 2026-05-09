import { redirect } from 'next/navigation';

export default function AdminServicesPage() {
  redirect('/admin?tab=services');
}
