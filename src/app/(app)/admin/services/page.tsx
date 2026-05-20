import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Services',
};

export default function AdminServicesPage() {
  redirect('/admin?tab=services');
}
