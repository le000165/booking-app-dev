import { Loader2 } from 'lucide-react';

export default function LoadingBookingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
    </div>
  );
}
