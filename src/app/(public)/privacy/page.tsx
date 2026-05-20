import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/marketing/SiteFooter';
import SiteNav from '@/components/marketing/SiteNav';

export const metadata: Metadata = {
  title: 'Privacy Policy — Vero',
  description: 'Vero privacy policy overview for website visitors and account users.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
          Legal
        </p>
        <h1 className="text-[42px] font-bold tracking-[-0.03em] text-gray-950">
          Privacy Policy
        </h1>
        <p className="mt-4 text-[15px] text-gray-500">Last updated: May 12, 2026</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-gray-600">
          <section>
            <h2 className="mb-3 text-[20px] font-bold text-gray-950">Overview</h2>
            <p>
              Vero collects the information needed to provide appointment booking,
              account access, customer communication, and business management features.
              This page summarizes the intended privacy posture for the production route.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[20px] font-bold text-gray-950">Information we handle</h2>
            <p>
              Account users may provide email addresses, passwords, business details,
              staff information, services, availability, customer contact details, and
              appointment records. Customers may provide contact details when making a booking.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[20px] font-bold text-gray-950">How information is used</h2>
            <p>
              Information is used to authenticate users, operate booking workflows,
              display schedules, send appointment communications, and maintain service
              quality and security.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[20px] font-bold text-gray-950">Contact</h2>
            <p>
              For privacy questions, contact the Vero team through your account
              administrator or return to the{' '}
              <Link href="/" className="font-semibold text-gray-950 hover:underline">
                homepage
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
