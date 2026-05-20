import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/marketing/SiteFooter';
import SiteNav from '@/components/marketing/SiteNav';

export const metadata: Metadata = {
  title: 'Terms of Service — Vero',
  description: 'Vero terms of service overview for website visitors and account users.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
          Legal
        </p>
        <h1 className="text-[42px] font-bold tracking-[-0.03em] text-gray-950">
          Terms of Service
        </h1>
        <p className="mt-4 text-[15px] text-gray-500">Last updated: May 12, 2026</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-gray-600">
          <section>
            <h2 className="mb-3 text-[20px] font-bold text-gray-950">Use of Vero</h2>
            <p>
              Vero provides appointment booking and scheduling tools for service
              businesses. Users are responsible for keeping account access secure and
              using the platform in a lawful and professional manner.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[20px] font-bold text-gray-950">Business and customer data</h2>
            <p>
              Businesses are responsible for the accuracy of services, pricing,
              availability, staff information, and customer communications configured
              in their accounts.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[20px] font-bold text-gray-950">Availability</h2>
            <p>
              We aim to provide a reliable booking experience, but service availability
              may vary due to maintenance, infrastructure issues, or factors outside
              our control.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[20px] font-bold text-gray-950">Related policy</h2>
            <p>
              Please review the{' '}
              <Link href="/privacy" className="font-semibold text-gray-950 hover:underline">
                Privacy Policy
              </Link>{' '}
              for information about how Vero handles data.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
