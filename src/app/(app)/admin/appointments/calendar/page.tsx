import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export const metadata: Metadata = {
  title: 'Appointment - Calendar',
};

export default function AdminAppointmentsCalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
        </div>
      }
    >
      <AdminDashboardClient />
    </Suspense>
  );
}
