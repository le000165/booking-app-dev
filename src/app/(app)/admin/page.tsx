import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export const metadata: Metadata = {
  title: 'Appointment - Overview',
};

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function AdminFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
    </div>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = searchParams ? await searchParams : {};

  if (!params.tab && !params.view) {
    redirect('/admin/appointments');
  }

  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminDashboardClient />
    </Suspense>
  );
}
