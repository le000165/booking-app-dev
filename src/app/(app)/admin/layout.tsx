import { Suspense } from 'react';
import AdminShell from '@/components/layouts/AdminShell';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <AdminShell>
        {children}
      </AdminShell>
    </Suspense>
  );
}
