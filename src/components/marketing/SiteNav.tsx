'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Solutions', href: '/solutions' },
];

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E7E5E4] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/brand/logo.svg"
            alt="Vero"
            width={112}
            height={32}
            priority
            className="h-8 w-auto"
          />
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
