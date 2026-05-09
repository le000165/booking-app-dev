import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import StaffNewClient from '@/components/admin/StaffNewClient';

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
