import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';

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
      className="text-[14px] text-[#6B7280] transition-colors hover:text-[#111827]"
    >
      {children}
    </Link>
  );
}

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#E7E5E4] bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <div className="mb-3 flex items-center">
              <Image
                src="/brand/logo.svg"
                alt="Vero"
                width={112}
                height={32}
                className="h-8 w-auto"
              />
            </div>
            <p className="max-w-[220px] text-[13px] leading-relaxed text-[#6B7280]">
              Modern appointment booking for service businesses of all sizes.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
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
            <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
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
            <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
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

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#E7E5E4] pt-6 sm:flex-row">
          <p className="text-[13px] text-[#9CA3AF]">
            © {year} Vero. All rights reserved.
          </p>
          <Link
            href="/login"
            className="text-[13px] text-[#6B7280] transition-colors hover:text-[#111827]"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
