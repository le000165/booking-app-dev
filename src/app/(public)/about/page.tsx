import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calendar, CheckCircle, Users } from 'lucide-react';
import SiteFooter from '@/components/marketing/SiteFooter';
import SiteNav from '@/components/marketing/SiteNav';

export const metadata: Metadata = {
  title: 'About — Vero',
  description:
    'Learn about Vero, appointment booking software built for service businesses that need simple scheduling and professional operations.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <main>
        <section className="bg-gray-50 py-20 lg:py-28">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
              About Vero
            </p>
            <h1 className="text-[42px] font-bold tracking-[-0.03em] text-gray-950 sm:text-[56px]">
              Helping service businesses spend less time coordinating and more time serving
            </h1>
            <p className="mt-5 text-[17px] leading-relaxed text-gray-600">
              Vero is built for businesses where every appointment matters: salons,
              spas, clinics, consultants, wellness teams, and local service providers.
              Our mission is to make professional booking software feel clear, fast,
              and approachable from the first day.
            </p>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            {[
              {
                icon: Calendar,
                title: 'Our mission',
                text: 'Make scheduling simpler for businesses and customers, without adding operational clutter.',
              },
              {
                icon: Users,
                title: 'Who it is for',
                text: 'Appointment-based businesses with services, staff, and customers who expect a polished booking experience.',
              },
              {
                icon: CheckCircle,
                title: 'How we build',
                text: 'We prioritize reliable workflows, clear interfaces, and practical tools that help teams run the day.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Icon size={22} />
                </div>
                <h2 className="text-[21px] font-bold text-gray-950">{title}</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-600">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-gray-950 py-16 text-white lg:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-[34px] font-bold tracking-[-0.025em] sm:text-[44px]">
              Build a booking experience your customers trust
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-gray-300">
              Start with a clean booking page, then grow into staff scheduling,
              reminders, and appointment operations as your business needs more.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-white px-6 text-[15px] font-semibold text-gray-950 transition-colors hover:bg-gray-100"
            >
              Start for free
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
