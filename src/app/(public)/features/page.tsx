import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  Clock,
  Contact,
  Globe,
  Layers,
  Users,
} from 'lucide-react';
import SiteFooter from '@/components/marketing/SiteFooter';
import SiteNav from '@/components/marketing/SiteNav';

export const metadata: Metadata = {
  title: 'Features — BookEasy',
  description:
    'Explore BookEasy features for online booking, staff scheduling, calendar management, customer management, reminders, and multi-service teams.',
};

const features = [
  {
    icon: Globe,
    title: 'Online booking',
    body: 'Give customers a clear booking page that works on every device. They choose a service, pick an available time, and submit their details without calling or messaging your team.',
    bullets: ['Mobile-friendly booking flow', 'Service duration and price display', 'Clean customer confirmation experience'],
  },
  {
    icon: Users,
    title: 'Staff scheduling',
    body: 'Model how your team really works. Set staff-level availability, keep schedules organized, and make sure customers only see times that can actually be booked.',
    bullets: ['Individual staff availability', 'Bookable staff controls', 'Assigned service support'],
  },
  {
    icon: CalendarDays,
    title: 'Calendar management',
    body: 'Run the day from one organized calendar. Review appointments, filter what matters, and keep the front desk and service providers aligned.',
    bullets: ['Day and week views', 'Appointment status actions', 'Staff and service filters'],
  },
  {
    icon: Contact,
    title: 'Customer management',
    body: 'Capture the details your business needs for every appointment. Keep customer names, contact details, services, and appointment history connected.',
    bullets: ['Customer contact details', 'Appointment notes and context', 'Easy rescheduling workflows'],
  },
  {
    icon: Bell,
    title: 'Reminders',
    body: 'Reduce no-shows with timely reminders. Keep customers informed before appointments and give staff more confidence in the schedule.',
    bullets: ['Email reminder workflow', 'SMS-ready reminder actions', 'Clear appointment communications'],
  },
  {
    icon: Layers,
    title: 'Multi-staff and multi-service support',
    body: 'Support businesses with more than one service provider or service category. BookEasy keeps capacity, service fit, and staff assignments together.',
    bullets: ['Multiple services per business', 'Staff-to-service assignment', 'Operational dashboard for growing teams'],
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <main>
        <section className="bg-gray-50 py-20 lg:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                Features
              </p>
              <h1 className="text-[42px] font-bold tracking-[-0.03em] text-gray-950 sm:text-[56px]">
                Everything your service business needs to take bookings seriously
              </h1>
              <p className="mt-5 text-[17px] leading-relaxed text-gray-600">
                BookEasy brings online booking, staff schedules, appointment operations,
                and reminder workflows into one professional workspace.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-gray-950 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  Start for free
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex min-h-[46px] items-center rounded-xl border border-gray-200 bg-white px-6 text-[15px] font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                >
                  Get started free
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-5 lg:grid-cols-2">
              {features.map(({ icon: Icon, title, body, bullets }) => (
                <article
                  key={title}
                  className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm"
                >
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon size={22} />
                  </div>
                  <h2 className="text-[22px] font-bold text-gray-950">{title}</h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-gray-600">{body}</p>
                  <ul className="mt-5 space-y-2.5">
                    {bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2 text-[14px] text-gray-600">
                        <Check size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-950 py-16 text-white lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-300">
                Operational clarity
              </p>
              <h2 className="text-[34px] font-bold tracking-[-0.025em] sm:text-[44px]">
                Less back-and-forth, more booked time
              </h2>
              <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-gray-300">
                BookEasy is built to reduce the daily admin that slows service businesses
                down: calls, schedule checks, missed reminders, and scattered appointment details.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              {[
                { label: 'Faster booking', icon: Clock },
                { label: 'Cleaner calendars', icon: CalendarDays },
                { label: 'Better customer communication', icon: Bell },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3 border-b border-white/10 py-4 last:border-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-blue-300">
                    <Icon size={18} />
                  </div>
                  <span className="text-[15px] font-semibold">{label}</span>
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
