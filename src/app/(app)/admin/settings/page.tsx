import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function AdminSettingsPage() {
  redirect('/admin?tab=staff');
}
