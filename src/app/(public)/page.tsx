import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Calendar,
  Users,
  Bell,
  BarChart3,
  Globe,
  Check,
  ArrowRight,
  Shield,
  Zap,
  Star,
} from 'lucide-react';
import SiteFooter from '@/components/marketing/SiteFooter';
import SiteNav from '@/components/marketing/SiteNav';

export const metadata: Metadata = {
  title: 'Vero — Appointment Booking Software for Service Businesses',
  description:
    'Online booking, staff scheduling, and automated reminders for salons, spas, clinics, and consultants. Set up in 5 minutes. Free to start.',
};

// ─── Dashboard Mockup ─────────────────────────────────────────────────────────
function DashboardMockup() {
  const appts = [
    { name: 'Sarah M.',  service: 'Haircut & Style',      time: '9:00 AM',  dur: '60 min', c: 'blue'   },
    { name: 'Kate L.',   service: 'Gel Manicure',          time: '10:30 AM', dur: '45 min', c: 'purple' },
    { name: 'James R.',  service: 'Deep Tissue Massage',   time: '11:30 AM', dur: '90 min', c: 'emerald'},
    { name: 'Mia T.',    service: 'Hydrating Facial',      time: '1:00 PM',  dur: '60 min', c: 'pink'   },
    { name: 'Alex P.',   service: 'Gel Nail Art',          time: '2:30 PM',  dur: '75 min', c: 'amber'  },
  ];

  const pill: Record<string, string> = {
    blue:    'border-blue-300   bg-blue-50   text-blue-800',
    purple:  'border-purple-300 bg-purple-50 text-purple-800',
    emerald: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    pink:    'border-pink-300   bg-pink-50   text-pink-800',
    amber:   'border-amber-300  bg-amber-50  text-amber-800',
  };
  const dot: Record<string, string> = {
    blue: 'bg-blue-400', purple: 'bg-purple-400', emerald: 'bg-emerald-400',
    pink: 'bg-pink-400', amber: 'bg-amber-400',
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl text-[10px]">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-100 px-3 py-2.5">
        <div className="flex gap-1.5 shrink-0">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-2">
          <div className="h-5 rounded-md border border-gray-200 bg-white flex items-center px-2">
            <span className="font-mono text-[9px] text-gray-400 select-none">app.vero.so/admin</span>
          </div>
        </div>
      </div>

      {/* App shell */}
      <div className="flex h-[340px]">
        {/* Sidebar */}
        <div className="flex w-[118px] shrink-0 flex-col bg-gray-950 p-3 gap-0.5">
          <div className="mb-3 flex items-center gap-2 px-1">
            <div className="h-5 w-5 rounded bg-white/10 flex items-center justify-center shrink-0">
              <div className="h-2.5 w-2.5 rounded-sm bg-white/70" />
            </div>
            <span className="truncate text-[9px] font-semibold text-white/80">Luxe Studio</span>
          </div>
          {[
            ['Calendar', true ],
            ['Appointments', false],
            ['Staff',   false],
            ['Services',false],
            ['Analytics',false],
            ['Settings', false],
          ].map(([lbl, active]) => (
            <div
              key={String(lbl)}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                active ? 'bg-white/15 text-white' : 'text-white/40'
              }`}
            >
              <div className={`h-1.5 w-1.5 rounded-sm shrink-0 ${active ? 'bg-white' : 'bg-white/30'}`} />
              <span className="text-[9px]">{String(lbl)}</span>
            </div>
          ))}
        </div>

        {/* Main area */}
        <div className="flex flex-1 min-w-0 flex-col bg-gray-50">
          {/* Top bar */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-3 py-2">
            <div>
              <p className="text-[11px] font-semibold text-gray-900">Today — May 11, 2026</p>
              <p className="text-[9px] text-gray-400 mt-0.5">5 appointments · Monday</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-5 rounded-md bg-gray-950 px-2 flex items-center">
                <span className="text-[8px] font-semibold text-white">+ New</span>
              </div>
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">JD</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex shrink-0 gap-2 px-3 py-2">
            {[
              { label: "Today's Bookings", value: '5',    sub: '↑ 2 vs avg',  sub_c: 'text-emerald-600' },
              { label: 'Revenue Today',    value: '$680', sub: '↑ 12%',       sub_c: 'text-emerald-600' },
              { label: 'Next Appt',        value: '9:00', sub: 'Sarah M.',    sub_c: 'text-gray-500'    },
            ].map((s) => (
              <div key={s.label} className="flex-1 rounded-lg border border-gray-100 bg-white px-2 py-1.5">
                <p className="text-[8px] uppercase tracking-wide text-gray-400">{s.label}</p>
                <p className="mt-0.5 text-[12px] font-bold text-gray-900">{s.value}</p>
                <p className={`text-[8px] mt-0.5 ${s.sub_c}`}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Appointments */}
          <div className="flex-1 overflow-y-auto space-y-1.5 px-3 pb-3">
            {appts.map((a) => (
              <div
                key={a.name}
                className={`flex items-center gap-2 rounded-lg border-l-[3px] bg-white px-2 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ${pill[a.c]}`}
              >
                <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot[a.c]}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">{a.name}</p>
                  <p className="truncate text-gray-500">{a.service}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-medium text-gray-700">{a.time}</p>
                  <p className="text-gray-400">{a.dur}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pb-24 pt-16 lg:pb-32 lg:pt-20">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="hp-blob absolute -right-20 -top-40 h-[560px] w-[560px] rounded-full bg-blue-100/70 blur-[110px]"
        />
        <div
          className="hp-blob absolute -bottom-24 -left-20 h-[400px] w-[400px] rounded-full bg-violet-100/60 blur-[90px]"
          style={{ animationDelay: '5s' }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">

          {/* ── Left: copy ── */}
          <div className="max-w-[560px]">
            {/* Eyebrow */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 shadow-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[12px] font-medium text-gray-600">
                Built for modern service businesses
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[44px] font-bold leading-[1.08] tracking-[-0.03em] text-gray-950 sm:text-[52px] lg:text-[60px]">
              Bookings that{' '}
              <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-blue-600 bg-clip-text text-transparent">
                work while
              </span>
              <br />
              you sleep
            </h1>

            {/* Sub */}
            <p className="mt-6 text-[18px] leading-[1.65] text-gray-600">
              The professional scheduling platform for salons, spas, clinics, and service businesses.
              Online booking, staff management, and automated reminders — all in one place.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-gray-900/20 transition-all hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-900/25"
              >
                Start for free
                <ArrowRight size={16} />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-[15px] font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
              >
                See how it works
              </a>
            </div>

            {/* Trust microcopy */}
            <div className="mt-7 flex flex-wrap items-center gap-5">
              {[
                'No credit card required',
                'Setup in 5 minutes',
                'Free forever plan',
              ].map((label) => (
                <span key={label} className="flex items-center gap-1.5 text-[13px] text-gray-500">
                  <Check size={13} className="text-emerald-500 shrink-0" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right: 3D mockup ── */}
          <div className="relative hidden lg:block">
            {/* Floating annotation badges */}
            <div className="absolute -left-8 -top-5 z-10 flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <Bell size={13} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-900">Reminder sent</p>
                <p className="text-[9px] text-gray-500">Sarah M. · 1 hr before</p>
              </div>
            </div>

            <div className="absolute -bottom-5 -right-6 z-10 flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <BarChart3 size={13} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-900">Revenue today</p>
                <p className="text-[9px] font-semibold text-emerald-600">$680 ↑ 12%</p>
              </div>
            </div>

            <div className="absolute -right-8 top-1/2 z-10 -translate-y-1/2 flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100">
                <Star size={13} className="text-purple-600" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-900">New booking</p>
                <p className="text-[9px] text-gray-500">Kate L. just booked</p>
              </div>
            </div>

            {/* Mockup with 3D tilt + float */}
            <div style={{ perspective: '1100px' }}>
              <div
                className="hp-float"
                style={{
                  transform: 'rotateX(3deg) rotateY(-9deg)',
                  boxShadow:
                    '28px 28px 72px rgba(0,0,0,0.13), 0 8px 32px rgba(0,0,0,0.07)',
                  borderRadius: '12px',
                  willChange: 'transform',
                }}
              >
                <DashboardMockup />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Trust bar ────────────────────────────────────────────────────────────────
function TrustBar() {
  const items = [
    'Hair Salons', 'Nail Studios', 'Day Spas', 'Barbershops',
    'Medical Clinics', 'Physiotherapists', 'Personal Trainers', 'Yoga Studios',
    'Massage Therapists', 'Dental Practices', 'Consultants', 'Life Coaches',
    /* duplicate for seamless loop */
    'Hair Salons', 'Nail Studios', 'Day Spas', 'Barbershops',
    'Medical Clinics', 'Physiotherapists', 'Personal Trainers', 'Yoga Studios',
    'Massage Therapists', 'Dental Practices', 'Consultants', 'Life Coaches',
  ];

  return (
    <section className="overflow-hidden border-y border-gray-100 bg-gray-50 py-10">
      <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
        Trusted by service professionals
      </p>
      <div className="relative">
        <div className="hp-marquee flex whitespace-nowrap" aria-hidden="true">
          {items.map((t, i) => (
            <span
              key={i}
              className="mx-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-[13px] font-medium text-gray-600 shadow-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
function FeaturesSection() {
  const features = [
    {
      icon: Globe,
      title: 'Online Booking',
      desc: 'Customers book 24/7 from any device via a clean, shareable link. No app download, no friction.',
      accent: 'text-blue-600 bg-blue-50',
    },
    {
      icon: Users,
      title: 'Staff Scheduling',
      desc: 'Set individual availability for every team member. Customers only see open slots when staff are available.',
      accent: 'text-purple-600 bg-purple-50',
    },
    {
      icon: Calendar,
      title: 'Smart Calendar',
      desc: 'Day, week, and side-by-side staff views. Filter by person, status, or service in one click.',
      accent: 'text-emerald-600 bg-emerald-50',
    },
    {
      icon: Bell,
      title: 'Automated Reminders',
      desc: 'Cut no-shows by up to 60% with automatic email and SMS reminders before every appointment.',
      accent: 'text-amber-600 bg-amber-50',
    },
    {
      icon: BarChart3,
      title: 'Business Analytics',
      desc: 'Track revenue, booking trends, and staff performance without digging through spreadsheets.',
      accent: 'text-pink-600 bg-pink-50',
    },
    {
      icon: Shield,
      title: 'Multi-Staff Ready',
      desc: 'Manage your whole team from one dashboard. Assign services, set hours, and track everything.',
      accent: 'text-gray-700 bg-gray-100',
    },
  ];

  return (
    <section id="features" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
            Platform features
          </p>
          <h2 className="text-[36px] font-bold tracking-[-0.025em] text-gray-950 sm:text-[44px]">
            Everything you need to grow
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[17px] leading-relaxed text-gray-500">
            From your first booking to your hundredth client — Vero handles operations
            so you can focus on delivering exceptional service.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc, accent }) => (
            <div
              key={title}
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md"
            >
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
                <Icon size={20} />
              </div>
              <h3 className="mb-2 text-[16px] font-semibold text-gray-900">{title}</h3>
              <p className="text-[14px] leading-relaxed text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Dashboard preview (full-width) ──────────────────────────────────────────
function DashboardPreviewSection() {
  return (
    <section className="bg-gray-50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
            The dashboard
          </p>
          <h2 className="text-[36px] font-bold tracking-[-0.025em] text-gray-950 sm:text-[44px]">
            Your business at a glance
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[17px] text-gray-500">
            A clean, fast dashboard designed for real work — not demos.
          </p>
        </div>

        {/* Centered mockup at full scale */}
        <div className="mx-auto max-w-4xl">
          <div
            className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-gray-200"
            style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.06)' }}
          >
            <DashboardMockup />
          </div>
        </div>

        {/* Callout chips below mockup */}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {[
            { icon: <Zap size={14} className="text-amber-500" />, label: 'Real-time updates' },
            { icon: <Bell size={14} className="text-blue-500" />, label: 'Reminder automation' },
            { icon: <BarChart3 size={14} className="text-emerald-500" />, label: 'Revenue tracking' },
            { icon: <Users size={14} className="text-purple-500" />, label: 'Staff management' },
            { icon: <Calendar size={14} className="text-pink-500" />, label: 'Multi-view calendar' },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 shadow-sm"
            >
              {icon}
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    {
      n: '01',
      title: 'Create your business',
      desc: 'Sign up and set up your profile in minutes. Add your name, timezone, and contact details.',
    },
    {
      n: '02',
      title: 'Add services and staff',
      desc: 'Build your service menu with pricing and duration. Assign services to the right team members.',
    },
    {
      n: '03',
      title: 'Share your booking link',
      desc: 'Get a clean, branded link. Add it to your website, Instagram bio, or Google Business profile.',
    },
    {
      n: '04',
      title: 'Manage from one place',
      desc: 'View appointments, track revenue, send reminders, and run your whole operation from the dashboard.',
    },
  ];

  return (
    <section id="how-it-works" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
            How it works
          </p>
          <h2 className="text-[36px] font-bold tracking-[-0.025em] text-gray-950 sm:text-[44px]">
            Up and running in minutes
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[17px] text-gray-500">
            No technical setup. No long onboarding. Just sign up and start accepting bookings.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.n} className="relative">
              {/* Connector line (lg only) */}
              {i < steps.length - 1 && (
                <div className="absolute left-[calc(50%+28px)] top-8 hidden h-px w-[calc(100%-56px)] bg-gradient-to-r from-gray-200 to-transparent lg:block" />
              )}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 inline-flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-gray-950">
                  <span className="text-[13px] font-bold text-white">{step.n}</span>
                </div>
                <h3 className="mb-2 text-[16px] font-semibold text-gray-900">{step.title}</h3>
                <p className="text-[14px] leading-relaxed text-gray-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Industries ───────────────────────────────────────────────────────────────
function IndustriesSection() {
  const list = [
    { e: '✂️', name: 'Hair Salons',       desc: 'Cuts, color, styling & treatments' },
    { e: '💅', name: 'Nail Studios',      desc: 'Manicure, pedicure & nail art'     },
    { e: '🧖', name: 'Spas & Wellness',   desc: 'Massages, facials & body care'     },
    { e: '🪒', name: 'Barbershops',       desc: 'Cuts, shaves & beard grooming'     },
    { e: '🩺', name: 'Clinics',           desc: 'Medical, dental & physio'          },
    { e: '💼', name: 'Consultants',       desc: 'Coaches, advisors & freelancers'   },
    { e: '🏋️', name: 'Fitness & Yoga',   desc: 'Training, sessions & classes'      },
    { e: '🐾', name: 'Pet Services',      desc: 'Grooming, vet visits & daycare'    },
  ];

  return (
    <section id="industries" className="bg-gray-50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
            Industries
          </p>
          <h2 className="text-[36px] font-bold tracking-[-0.025em] text-gray-950 sm:text-[44px]">
            Built for every service business
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[17px] text-gray-500">
            Whether you have one chair or twenty staff members — Vero adapts to your workflow.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((ind) => (
            <div
              key={ind.name}
              className="flex cursor-default flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
            >
              <span className="text-3xl leading-none">{ind.e}</span>
              <div>
                <p className="text-[15px] font-semibold text-gray-900">{ind.name}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-gray-500">{ind.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Benefits (dark) ──────────────────────────────────────────────────────────
function BenefitsSection() {
  const benefits = [
    {
      title: 'Accept bookings 24/7',
      desc: 'Your booking page never closes. Customers book at midnight, on weekends, whenever they\'re ready.',
    },
    {
      title: 'Reduce no-shows by 60%',
      desc: 'Automated SMS and email reminders keep clients informed and engaged before every appointment.',
    },
    {
      title: 'Save 10+ hours per week',
      desc: 'Stop chasing bookings by phone. Let customers self-schedule while you focus on your craft.',
    },
    {
      title: 'Know your numbers instantly',
      desc: 'Built-in analytics show your best services, busiest hours, and top-performing staff at a glance.',
    },
    {
      title: 'Professional customer experience',
      desc: 'Give clients a seamless booking experience that matches the quality of your service.',
    },
    {
      title: 'Scale without the complexity',
      desc: 'Add staff, services, and locations as you grow. Vero scales alongside your business.',
    },
  ];

  return (
    <section className="bg-gray-950 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          {/* Left copy */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-400">
              Why Vero
            </p>
            <h2 className="text-[36px] font-bold tracking-[-0.025em] text-white sm:text-[44px]">
              Your business runs better when bookings manage themselves
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-gray-400">
              Most booking tools are built as an afterthought. Vero is built from the ground up for service
              professionals who need reliability, clarity, and control.
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-[15px] font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-100"
              >
                Get started free
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Right benefit cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
              >
                <div className="mb-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/25">
                  <Check size={12} className="text-blue-400" />
                </div>
                <h3 className="mb-1.5 text-[14px] font-semibold text-white">{b.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-400">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section id="pricing" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="rounded-3xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white px-8 py-16 shadow-sm">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-950">
            <Calendar size={26} className="text-white" />
          </div>
          <h2 className="text-[36px] font-bold tracking-[-0.025em] text-gray-950 sm:text-[46px]">
            Ready to fill your calendar?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-gray-500">
            Join thousands of service professionals who have replaced manual booking with Vero.
            Setup is free and takes less than 5 minutes.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-8 py-4 text-[16px] font-semibold text-white shadow-lg shadow-gray-900/20 transition-all hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-xl"
            >
              Start for free
              <ArrowRight size={17} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-4 text-[16px] font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Sign in to dashboard
            </Link>
          </div>

          <p className="mt-5 text-[13px] text-gray-400">
            No credit card · No setup fee · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <SiteNav />
      <HeroSection />
      <TrustBar />
      <FeaturesSection />
      <DashboardPreviewSection />
      <HowItWorksSection />
      <IndustriesSection />
      <BenefitsSection />
      <CTASection />
      <SiteFooter />
    </div>
  );
}
