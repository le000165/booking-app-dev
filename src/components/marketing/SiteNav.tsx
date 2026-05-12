'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Calendar } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Solutions', href: '/solutions' },
];

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-950">
            <Calendar size={15} className="text-white" />
          </div>
          <span className="text-[17px] font-bold tracking-tight text-gray-900">
            BookEasy
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
                    ? 'bg-gray-100 text-gray-950'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
            className="hidden rounded-lg px-4 py-2 text-[14px] font-medium text-gray-700 transition-colors hover:bg-gray-100 sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-950 px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Start free
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}
