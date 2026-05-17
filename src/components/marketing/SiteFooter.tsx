import Link from 'next/link';
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

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#E7E5E4] bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <div className="mb-3 flex items-center gap-2.5">
              <FrontBeachMark size={28} />
              <span className="text-[17px] font-semibold tracking-tight text-[#111827]">
                FrontBeach
              </span>
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
            © {year} FrontBeach. All rights reserved.
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
