import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Staff',
};

export default function AdminStaffPage() {
  redirect('/admin?tab=staff');
}
