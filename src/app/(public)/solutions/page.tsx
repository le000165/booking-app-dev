import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, HeartPulse, Scissors, Sparkles, Stethoscope, Users } from 'lucide-react';
import SiteFooter from '@/components/marketing/SiteFooter';
import SiteNav from '@/components/marketing/SiteNav';

export const metadata: Metadata = {
  title: 'Solutions — Vero',
  description:
    'Booking software for salons, spas, barbers, clinics, consultants, fitness and wellness teams, and pet service businesses.',
};

const solutions = [
  {
    name: 'Salons',
    icon: Scissors,
    description: 'Manage cuts, color, treatments, stylists, and appointment changes from one schedule.',
    points: ['Staff-specific services', 'Color and treatment durations', 'Easy customer booking'],
  },
  {
    name: 'Spas',
    icon: Sparkles,
    description: 'Coordinate massage, facial, wellness, and package-style services with clear availability.',
    points: ['Long-duration service support', 'Reminder workflows', 'Premium customer experience'],
  },
  {
    name: 'Barbers',
    icon: Scissors,
    description: 'Keep chairs full with quick booking, clean schedules, and fast appointment status updates.',
    points: ['Short service slots', 'Repeat customer flow', 'Mobile-friendly booking'],
  },
  {
    name: 'Clinics',
    icon: Stethoscope,
    description: 'Organize appointments for providers, consultations, follow-ups, and front-desk workflows.',
    points: ['Provider availability', 'Customer contact details', 'Calendar filters'],
  },
  {
    name: 'Consultants',
    icon: Users,
    description: 'Let clients book discovery calls, advisory sessions, coaching appointments, and follow-ups.',
    points: ['Simple service menu', 'Professional booking link', 'Central appointment view'],
  },
  {
    name: 'Fitness and wellness',
    icon: HeartPulse,
    description: 'Schedule training sessions, wellness appointments, private classes, and practitioner bookings.',
    points: ['Trainer availability', 'Session reminders', 'Multi-service support'],
  },
  {
    name: 'Pet services',
    icon: HeartPulse,
    description: 'Manage grooming, care appointments, consultations, and recurring service visits.',
    points: ['Service duration control', 'Customer contact records', 'Staff assignment'],
  },
];

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <main>
        <section className="bg-gray-50 py-20 lg:py-28">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
              Solutions
            </p>
            <h1 className="text-[42px] font-bold tracking-[-0.03em] text-gray-950 sm:text-[56px]">
              Booking workflows for the way service businesses actually operate
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-gray-600">
              Whether you run a solo practice or a multi-staff studio, Vero gives
              your customers a simple booking path and your team a clearer schedule.
            </p>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
            {solutions.map(({ name, icon: Icon, description, points }) => (
              <article key={name} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-950 text-white">
                  <Icon size={21} />
                </div>
                <h2 className="text-[21px] font-bold text-gray-950">{name}</h2>
                <p className="mt-3 text-[14px] leading-relaxed text-gray-600">{description}</p>
                <ul className="mt-5 space-y-2.5">
                  {points.map((point) => (
                    <li key={point} className="flex gap-2 text-[14px] text-gray-600">
                      <Check size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-gray-950 py-16 text-white lg:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-300">
              Built to adapt
            </p>
            <h2 className="text-[34px] font-bold tracking-[-0.025em] sm:text-[44px]">
              One platform for many appointment-based businesses
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-gray-300">
              Start with your service menu, add your staff, set availability, and share
              a booking link that makes your business easier to choose.
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
