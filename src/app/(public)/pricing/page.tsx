import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, HelpCircle, Sparkles } from 'lucide-react';
import SiteFooter from '@/components/marketing/SiteFooter';
import SiteNav from '@/components/marketing/SiteNav';

export const metadata: Metadata = {
  title: 'Pricing — BookEasy',
  description:
    'Simple pricing for service businesses. Choose Starter, Professional, or Business and start accepting bookings online.',
};

const tiers = [
  {
    name: 'Starter',
    price: '$0',
    cadence: 'to start',
    description: 'For solo providers setting up online booking for the first time.',
    features: [
      'Public booking page',
      'Service menu with pricing',
      'Basic appointment dashboard',
      'Email confirmations',
      'One staff member',
    ],
  },
  {
    name: 'Professional',
    price: '$29',
    cadence: 'per month',
    description: 'For growing teams that need staff schedules and reminder workflows.',
    popular: true,
    features: [
      'Everything in Starter',
      'Up to 10 staff members',
      'Automated email and SMS reminders',
      'Calendar and appointment filters',
      'Staff service assignments',
      'Revenue and booking insights',
    ],
  },
  {
    name: 'Business',
    price: '$79',
    cadence: 'per month',
    description: 'For busy service businesses with larger teams and operational needs.',
    features: [
      'Everything in Professional',
      'Unlimited staff members',
      'Advanced availability controls',
      'Priority support',
      'Multi-service booking support',
      'Team performance reporting',
    ],
  },
];

const faqs = [
  {
    q: 'Do I need a credit card to start?',
    a: 'No. You can create an account, set up your services, and explore the booking workflow before adding any billing details.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Yes. The product is designed for businesses that grow from solo operators to larger teams, so plan changes should be straightforward when billing is added.',
  },
  {
    q: 'Is Stripe or payment collection included yet?',
    a: 'Not yet. This pricing page is informational only; no Stripe or billing logic has been added.',
  },
  {
    q: 'Does BookEasy work for multi-staff businesses?',
    a: 'Yes. Staff scheduling, assigned services, and multi-staff calendar views are core parts of the platform.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <main>
        <section className="bg-gray-50 py-20 lg:py-28">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
              Pricing
            </p>
            <h1 className="text-[42px] font-bold tracking-[-0.03em] text-gray-950 sm:text-[56px]">
              Simple plans for modern service teams
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-gray-600">
              Start with the essentials, then add staff scheduling, reminders, and
              reporting as your booking volume grows.
            </p>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-3xl border bg-white p-7 shadow-sm ${
                  tier.popular
                    ? 'border-gray-950 shadow-xl shadow-gray-900/10'
                    : 'border-gray-200'
                }`}
              >
                {tier.popular && (
                  <div className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-gray-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    <Sparkles size={12} />
                    Most Popular
                  </div>
                )}
                <div>
                  <h2 className="text-[22px] font-bold text-gray-950">{tier.name}</h2>
                  <p className="mt-3 min-h-[52px] text-[14px] leading-relaxed text-gray-500">
                    {tier.description}
                  </p>
                  <div className="mt-6 flex items-end gap-2">
                    <span className="text-[44px] font-bold tracking-[-0.04em] text-gray-950">
                      {tier.price}
                    </span>
                    <span className="pb-2 text-[14px] text-gray-500">{tier.cadence}</span>
                  </div>
                </div>

                <Link
                  href="/signup"
                  className={`mt-7 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition-colors ${
                    tier.popular
                      ? 'bg-gray-950 text-white hover:bg-gray-800'
                      : 'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Start for free
                  <ArrowRight size={16} />
                </Link>

                <ul className="mt-7 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-[14px] text-gray-600">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-gray-100 bg-gray-50 py-16 lg:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                FAQ
              </p>
              <h2 className="text-[34px] font-bold tracking-[-0.025em] text-gray-950">
                Pricing questions
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {faqs.map((faq) => (
                <div key={faq.q} className="rounded-2xl border border-gray-200 bg-white p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <HelpCircle size={17} className="text-blue-600" />
                    <h3 className="text-[15px] font-semibold text-gray-950">{faq.q}</h3>
                  </div>
                  <p className="text-[14px] leading-relaxed text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
