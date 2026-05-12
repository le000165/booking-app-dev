import Link from 'next/link';
import type { ReactNode } from 'react';
import { Calendar } from 'lucide-react';

const productLinks = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Solutions', href: '/solutions' },
];

const companyLinks = [{ label: 'About', href: '/about' }];

const legalLinks = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[14px] text-gray-500 transition-colors hover:text-gray-900"
    >
      {children}
    </Link>
  );
}

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-100 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-950">
                <Calendar size={15} className="text-white" />
              </div>
              <span className="text-[17px] font-bold tracking-tight text-gray-900">
                BookEasy
              </span>
            </div>
            <p className="max-w-[220px] text-[13px] leading-relaxed text-gray-500">
              Modern appointment booking for service businesses of all sizes.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Product
            </h4>
            <ul className="space-y-2.5">
              {productLinks.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Company
            </h4>
            <ul className="space-y-2.5">
              {companyLinks.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Legal
            </h4>
            <ul className="space-y-2.5">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-6 sm:flex-row">
          <p className="text-[13px] text-gray-400">
            © {year} BookEasy. All rights reserved.
          </p>
          <Link
            href="/login"
            className="text-[13px] text-gray-500 transition-colors hover:text-gray-900"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
