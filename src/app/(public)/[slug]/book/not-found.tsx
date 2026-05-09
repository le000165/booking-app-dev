import { AlertCircle } from 'lucide-react';

export default function BookingNotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex flex-col items-center justify-center px-5 text-center gap-4">
      <AlertCircle size={36} className="text-[var(--text-muted)]" />
      <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">Business not found</h1>
      <p className="text-[14px] text-[var(--text-secondary)] max-w-[280px]">
        This booking page does not exist or is no longer active.
      </p>
    </div>
  );
}
