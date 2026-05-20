import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import StaffNewClient from '@/components/admin/StaffNewClient';

export const metadata: Metadata = {
  title: 'Staff - New',
};

function StaffNewFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
    </div>
  );
}

export default function NewStaffPage() {
  return (
    <Suspense fallback={<StaffNewFallback />}>
      <StaffNewClient />
    </Suspense>
  );
}
