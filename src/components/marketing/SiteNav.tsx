'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Solutions', href: '/solutions' },
];

function FrontBeachMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="8" fill="#111827" />
      <rect x="10" y="10" width="5" height="20" rx="1.5" fill="#FFFFFF" />
      <rect x="10" y="18" width="14" height="4" rx="1" fill="#FFFFFF" />
      <rect x="10" y="10" width="20" height="5" rx="1.5" fill="#2563EB" />
    </svg>
  );
}

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E7E5E4] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <FrontBeachMark size={28} />
          <span className="text-[17px] font-semibold tracking-tight text-[#111827]">
            FrontBeach
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {navLinks.map(({ label, href }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-lg px-3.5 py-2 text-[14px] font-medium transition-colors ${
                  active
                    ? 'bg-[#F0EFED] text-[#111827]'
                    : 'text-[#6B7280] hover:bg-[#F0EFED] hover:text-[#111827]'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-lg px-4 py-2 text-[14px] font-medium text-[#6B7280] transition-colors hover:bg-[#F0EFED] hover:text-[#111827] sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
          >
            Start free
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}
