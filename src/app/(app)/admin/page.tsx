import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

function AdminFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminDashboardClient />
    </Suspense>
  );
}
