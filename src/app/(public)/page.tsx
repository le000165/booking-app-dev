import Link from 'next/link';
import { Calendar, ArrowRight, LogIn } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-[400px] bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] px-8 py-10 flex flex-col items-center text-center gap-6"
           style={{ boxShadow: 'var(--shadow-sm)' }}>

        {/* Logo mark */}
        <div className="w-12 h-12 rounded-xl bg-[var(--text-primary)] flex items-center justify-center">
          <Calendar size={22} className="text-white" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-[22px] font-semibold text-[var(--text-primary)] tracking-tight">
            BookEasy
          </h1>
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
            Simple appointment booking for your business.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/luxe-nails/book"
          className="btn-primary"
          style={{ textDecoration: 'none' }}
        >
          Book a demo appointment
          <ArrowRight size={16} />
        </Link>

        <p className="text-[12px] text-[var(--text-muted)]">
          Replace <code className="bg-[var(--bg-subtle)] px-1.5 py-0.5 rounded text-[12px]">/luxe-nails</code> with your business slug.
        </p>

        {/* Divider */}
        <div className="divider w-full" />

        {/* Staff login */}
        <Link
          href="/login"
          className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
          style={{ textDecoration: 'none' }}
        >
          <LogIn size={14} />
          Admin / Staff Login
        </Link>
      </div>
    </div>
  );
}
