'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  X, ChevronRight, ChevronLeft, Loader2, Check,
  User, Shield, Briefcase, Clock,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface DaySchedule {
  day_of_week: number; // 0=Sun … 6=Sat
  open:        boolean;
  open_time:   string; // "HH:MM"
  close_time:  string; // "HH:MM"
  label:       string;
}

interface StaffForm {
  // Step 1 – Profile
  first_name: string;
  last_name:  string;
  phone:      string;
  email:      string;
  // Step 2 – Role & Settings
  role:        'staff' | 'admin';
  is_bookable: boolean;
  invite:      boolean;
  // Step 3 – Services
  service_ids: string[];
  // Step 4 – Availability
  schedule:    DaySchedule[];
}

interface Service {
  id:           string;
  name:         string;
  duration_mins: number;
  price:        number;
  emoji:        string | null;
  is_active:    boolean;
}

// day_of_week: 0=Sun, 1=Mon … 6=Sat  (matches DB convention)
const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day_of_week: 1, label: 'Monday',    open: true,  open_time: '09:00', close_time: '17:00' },
  { day_of_week: 2, label: 'Tuesday',   open: true,  open_time: '09:00', close_time: '17:00' },
  { day_of_week: 3, label: 'Wednesday', open: true,  open_time: '09:00', close_time: '17:00' },
  { day_of_week: 4, label: 'Thursday',  open: true,  open_time: '09:00', close_time: '17:00' },
  { day_of_week: 5, label: 'Friday',    open: true,  open_time: '09:00', close_time: '17:00' },
  { day_of_week: 6, label: 'Saturday',  open: false, open_time: '09:00', close_time: '17:00' },
  { day_of_week: 0, label: 'Sunday',    open: false, open_time: '09:00', close_time: '17:00' },
];

const EMPTY_FORM: StaffForm = {
  first_name:  '',
  last_name:   '',
  phone:       '',
  email:       '',
  role:        'staff',
  is_bookable: true,
  invite:      false,
  service_ids: [],
  schedule:    DEFAULT_SCHEDULE,
};

// ─────────────────────────────────────────────────────────────────────────────
// Step config
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Profile',      icon: User      },
  { id: 2, label: 'Role',         icon: Shield    },
  { id: 3, label: 'Services',     icon: Briefcase },
  { id: 4, label: 'Availability', icon: Clock     },
] as const;

const TOTAL = STEPS.length;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}
function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function Label({ children, htmlFor, optional }: { children: React.ReactNode; htmlFor?: string; optional?: boolean }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[13px] font-medium text-gray-700 mb-1.5"
    >
      {children}
      {optional && <span className="ml-1.5 text-[12px] font-normal text-gray-400">Optional</span>}
    </label>
  );
}

function Input({ id, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div>
      <input
        id={id}
        {...props}
        className={`h-11 w-full rounded-xl border px-4 text-[14px] text-gray-900 placeholder-gray-400
          outline-none transition-all duration-150
          focus:ring-2 focus:ring-black/10 focus:border-gray-500
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'}
          ${props.className ?? ''}`}
      />
      {error && <p className="mt-1 text-[12px] text-red-500">{error}</p>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 – Profile
// ─────────────────────────────────────────────────────────────────────────────
function StepProfile({
  form, onChange, touched, setTouched,
}: {
  form: StaffForm;
  onChange: (patch: Partial<StaffForm>) => void;
  touched: Record<string, boolean>;
  setTouched: (k: string) => void;
}) {
  const firstErr = touched.first_name && !form.first_name.trim() ? 'Required' : '';

  return (
    <div className="space-y-5">
      <SectionLabel>Basic info</SectionLabel>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sf-first">Preferred name <span className="text-red-500">*</span></Label>
          <Input
            id="sf-first"
            placeholder="Jane"
            value={form.first_name}
            onChange={e => onChange({ first_name: e.target.value })}
            onBlur={() => setTouched('first_name')}
            error={firstErr}
            autoComplete="given-name"
            autoFocus
          />
        </div>
        <div>
          <Label htmlFor="sf-last" optional>Last name</Label>
          <Input
            id="sf-last"
            placeholder="Doe"
            value={form.last_name}
            onChange={e => onChange({ last_name: e.target.value })}
            autoComplete="family-name"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="sf-email" optional>Email</Label>
        <Input
          id="sf-email"
          type="email"
          placeholder="jane@example.com"
          value={form.email}
          onChange={e => onChange({ email: e.target.value })}
          autoComplete="email"
        />
        <p className="mt-1.5 text-[12px] text-gray-400">
          Required if you want to send a login invite.
        </p>
      </div>

      <div>
        <Label htmlFor="sf-phone" optional>Phone number</Label>
        <Input
          id="sf-phone"
          type="tel"
          placeholder="555-000-0000"
          value={form.phone}
          onChange={e => onChange({ phone: e.target.value })}
          autoComplete="tel"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 – Role & Settings
// ─────────────────────────────────────────────────────────────────────────────
function StepRole({ form, onChange }: { form: StaffForm; onChange: (patch: Partial<StaffForm>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <SectionLabel>Role</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {(['staff', 'admin'] as const).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => onChange({ role: r })}
              className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border text-left transition-all ${
                form.role === r
                  ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border-2 transition-colors ${
                  form.role === r ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                }`}>
                  {form.role === r && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
                <span className="text-[14px] font-semibold text-gray-900 capitalize">{r}</span>
              </span>
              <span className="text-[12px] text-gray-500 leading-snug pl-7">
                {r === 'admin' ? 'Can manage settings, staff, and services.' : 'Can be booked by customers via the booking page.'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <SectionLabel>Settings</SectionLabel>

        {/* Bookable toggle */}
        <div className="flex items-center justify-between py-3.5 px-4 rounded-xl border border-gray-200 bg-white">
          <div>
            <p className="text-[14px] font-medium text-gray-800">Bookable by customers</p>
            <p className="text-[12px] text-gray-400 mt-0.5">Show this person on the public booking page</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.is_bookable}
            onClick={() => onChange({ is_bookable: !form.is_bookable })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
              transition-colors duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2
              ${form.is_bookable ? 'bg-gray-900' : 'bg-gray-200'}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow
              transform transition duration-200 ease-in-out
              ${form.is_bookable ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>

        {/* Login invite — only visible when email is provided */}
        {form.email.trim() ? (
          <label className="flex items-start gap-3 py-3.5 px-4 rounded-xl border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={form.invite}
              onChange={e => onChange({ invite: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <div>
              <p className="text-[14px] font-medium text-gray-800">Send login invite</p>
              <p className="text-[12px] text-gray-400 mt-0.5">
                Staff receives an email to set their password and sign in at <code className="text-gray-500">/employee</code>
              </p>
            </div>
          </label>
        ) : (
          <div className="py-3.5 px-4 rounded-xl border border-dashed border-gray-200 bg-gray-50">
            <p className="text-[13px] text-gray-400">Add an email address in the previous step to send a login invite.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 – Services
// ─────────────────────────────────────────────────────────────────────────────
function StepServices({
  form, onChange, services, servicesLoading,
}: {
  form: StaffForm;
  onChange: (patch: Partial<StaffForm>) => void;
  services: Service[];
  servicesLoading: boolean;
}) {
  const allSelected = services.length > 0 && form.service_ids.length === services.length;

  function toggle(id: string) {
    onChange({
      service_ids: form.service_ids.includes(id)
        ? form.service_ids.filter(s => s !== id)
        : [...form.service_ids, id],
    });
  }

  function toggleAll() {
    onChange({ service_ids: allSelected ? [] : services.map(s => s.id) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionLabel>Assign services</SectionLabel>
        {services.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        )}
      </div>

      {servicesLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={22} className="animate-spin text-gray-400" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-gray-200 bg-gray-50">
          <Briefcase size={24} className="mx-auto text-gray-300 mb-3" />
          <p className="text-[14px] font-medium text-gray-600">No services yet</p>
          <p className="text-[13px] text-gray-400 mt-1">Create services first, then assign them to staff.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {services.map(svc => {
            const selected = form.service_ids.includes(svc.id);
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => toggle(svc.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                  selected
                    ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Checkbox visual */}
                <span className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${
                  selected ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-white'
                }`}>
                  {selected && <Check size={11} strokeWidth={3} className="text-white" />}
                </span>

                {/* Emoji */}
                {svc.emoji && <span className="text-xl leading-none">{svc.emoji}</span>}

                {/* Name + duration */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-gray-900 truncate">{svc.name}</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">{formatDuration(svc.duration_mins)}</p>
                </div>

                {/* Price */}
                <span className="text-[13px] font-medium text-gray-600 shrink-0">
                  ${svc.price.toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-[12px] text-gray-400">
        {form.service_ids.length === 0
          ? 'No services selected — this staff member will appear for all services.'
          : `${form.service_ids.length} service${form.service_ids.length !== 1 ? 's' : ''} selected.`}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 – Availability
// ─────────────────────────────────────────────────────────────────────────────
function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function scheduleErrors(schedule: DaySchedule[]): Record<number, string> {
  const errs: Record<number, string> = {};
  for (const day of schedule) {
    if (!day.open) continue;
    if (!day.open_time || !day.close_time) {
      errs[day.day_of_week] = 'Both times required';
    } else if (timeToMins(day.close_time) <= timeToMins(day.open_time)) {
      errs[day.day_of_week] = 'End time must be after start';
    }
  }
  return errs;
}

function StepAvailability({
  form, onChange,
}: {
  form: StaffForm;
  onChange: (patch: Partial<StaffForm>) => void;
}) {
  const errs = scheduleErrors(form.schedule);

  function patchDay(day_of_week: number, patch: Partial<DaySchedule>) {
    onChange({
      schedule: form.schedule.map(d =>
        d.day_of_week === day_of_week ? { ...d, ...patch } : d
      ),
    });
  }

  const workingCount = form.schedule.filter(d => d.open).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <SectionLabel>Weekly schedule</SectionLabel>
        <span className="text-[12px] text-gray-400">
          {workingCount} day{workingCount !== 1 ? 's' : ''} working
        </span>
      </div>

      {form.schedule.map(day => {
        const err = errs[day.day_of_week];
        return (
          <div
            key={day.day_of_week}
            className={`rounded-xl border transition-colors ${
              day.open ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
            }`}
          >
            {/* Day row */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={day.open}
                onClick={() => patchDay(day.day_of_week, { open: !day.open })}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                  transition-colors duration-200 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2
                  ${day.open ? 'bg-gray-900' : 'bg-gray-200'}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow
                  transform transition duration-200 ease-in-out
                  ${day.open ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>

              {/* Day label */}
              <span className={`w-24 text-[14px] font-medium shrink-0 ${
                day.open ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {day.label}
              </span>

              {/* Time inputs — only shown when working */}
              {day.open ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    type="time"
                    value={day.open_time}
                    onChange={e => patchDay(day.day_of_week, { open_time: e.target.value })}
                    className={`h-9 flex-1 min-w-0 rounded-lg border px-3 text-[13px] text-gray-900
                      outline-none transition-all
                      focus:ring-2 focus:ring-black/10 focus:border-gray-500
                      ${err ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  />
                  <span className="text-[12px] text-gray-400 shrink-0">to</span>
                  <input
                    type="time"
                    value={day.close_time}
                    onChange={e => patchDay(day.day_of_week, { close_time: e.target.value })}
                    className={`h-9 flex-1 min-w-0 rounded-lg border px-3 text-[13px] text-gray-900
                      outline-none transition-all
                      focus:ring-2 focus:ring-black/10 focus:border-gray-500
                      ${err ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  />
                </div>
              ) : (
                <span className="text-[13px] text-gray-400 italic">Day off</span>
              )}
            </div>

            {/* Inline validation error */}
            {err && (
              <p className="px-4 pb-2.5 text-[12px] text-red-500">{err}</p>
            )}
          </div>
        );
      })}

      <p className="pt-2 text-[12px] text-gray-400">
        You can adjust this schedule any time from the Staff tab.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function NewStaffPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [step, setStep]       = useState(1);
  const [form, setForm]       = useState<StaffForm>(EMPTY_FORM);
  const [touched, setTouchedMap] = useState<Record<string, boolean>>({});

  const [businessId, setBusinessId] = useState('');
  const [services, setServices]     = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone]               = useState(false);

  // ── Auth guard + resolve business_id ──────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id, role')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin'])
        .limit(1)
        .single();

      if (!membership) { router.replace('/admin'); return; }
      setBusinessId(membership.business_id);
    }
    init();
  }, [supabase, router]);

  // ── Load services when we hit step 3 ─────────────────────────────────────
  useEffect(() => {
    if (step !== 3 || !businessId || services.length > 0) return;
    setServicesLoading(true);
    fetch(`/api/services?business_id=${businessId}&admin=true`)
      .then(r => r.json())
      .then(d => setServices(d.services || []))
      .catch(console.error)
      .finally(() => setServicesLoading(false));
  }, [step, businessId, services.length]);

  // ── Prevent body scroll ───────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ── Form helpers ─────────────────────────────────────────────────────────
  const patchForm = useCallback((patch: Partial<StaffForm>) => {
    setForm(f => ({ ...f, ...patch }));
    setSubmitError(null);
  }, []);

  const touchField = useCallback((key: string) => {
    setTouchedMap(t => ({ ...t, [key]: true }));
  }, []);

  // ── Validation per step ───────────────────────────────────────────────────
  function isStepValid(s: number) {
    if (s === 1) return form.first_name.trim().length > 0;
    if (s === 4) return Object.keys(scheduleErrors(form.schedule)).length === 0;
    return true;
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  function handleBack() {
    if (step === 1) { router.push('/admin'); return; }
    setStep(s => s - 1);
  }

  function handleNext() {
    if (step === 1) {
      touchField('first_name');
      if (!isStepValid(1)) return;
    }
    if (step < TOTAL) { setStep(s => s + 1); return; }
    handleSubmit();
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // 1. Create the staff member
      const res = await fetch('/api/staff', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          first_name:  form.first_name.trim(),
          last_name:   form.last_name.trim(),
          email:       form.email.trim() || undefined,
          phone:       form.phone.trim() || undefined,
          role:        form.role,
          is_bookable: form.is_bookable,
          invite:      form.invite,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || 'Failed to add staff'); return; }

      const newMemberId = data.staff?.id;

      // 2. Assign services (if any selected)
      if (newMemberId && form.service_ids.length > 0 && businessId) {
        await fetch('/api/staff-services', {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            business_id:    businessId,
            team_member_id: newMemberId,
            service_ids:    form.service_ids,
          }),
        });
      }

      // 3. Save availability (working days only)
      // /api/staff-schedules PUT expects: { business_id, team_member_id, schedules: [{ day_of_week, open, open_time, close_time }] }
      if (newMemberId && businessId) {
        const workingDays = form.schedule.filter(d => d.open);
        if (workingDays.length > 0) {
          await fetch('/api/staff-schedules', {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              business_id:    businessId,
              team_member_id: newMemberId,
              schedules:      form.schedule, // route filters open:true internally
            }),
          });
        }
      }

      setDone(true);
      setTimeout(() => router.push('/admin'), 1800);
    } catch (err: any) {
      setSubmitError('Unexpected error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const progress = ((step - 1) / (TOTAL - 1)) * 100;
  const isLast   = step === TOTAL;
  const StepIcon = STEPS[step - 1].icon;

  // ─────────────────────────────────────────────────────────────────────────
  // Success screen
  // ─────────────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="fixed inset-0 bg-white z-[200] flex flex-col items-center justify-center gap-5">
        <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900">
          <Check size={32} strokeWidth={2.5} className="text-white" />
        </span>
        <div className="text-center">
          <p className="text-[20px] font-semibold text-gray-900">
            {form.first_name} added!
          </p>
          <p className="text-[14px] text-gray-500 mt-1">Returning to dashboard…</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col overflow-hidden">

      {/* ── Progress bar ── */}
      <div className="h-[3px] bg-gray-100 shrink-0">
        <div
          className="h-full bg-gray-900 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Top bar ── */}
      <header className="shrink-0 border-b border-gray-100 bg-white">
        <div className="max-w-2xl mx-auto w-full px-5 h-14 flex items-center justify-between gap-4">
          {/* Left: Back / Close */}
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
            aria-label={step === 1 ? 'Close' : 'Back'}
          >
            {step === 1 ? (
              <><X size={18} /> <span className="hidden sm:inline">Close</span></>
            ) : (
              <><ChevronLeft size={18} /> <span className="hidden sm:inline">Back</span></>
            )}
          </button>

          {/* Center: Step label */}
          <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-900">
            <StepIcon size={16} className="text-gray-400" />
            {STEPS[step - 1].label}
          </div>

          {/* Right: Next / Save */}
          <button
            type="button"
            id="staff-next-btn"
            onClick={handleNext}
            disabled={!isStepValid(step) || submitting}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-gray-900 text-white text-[13px] font-semibold
              hover:bg-gray-800 transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isLast ? (
              'Create team member'
            ) : (
              <><span>Next</span><ChevronRight size={15} /></>
            )}
          </button>
        </div>
      </header>

      {/* ── Step indicator dots ── */}
      <div className="shrink-0 flex items-center justify-center gap-2 pt-5 pb-1">
        {STEPS.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              // Only allow going to already-visited steps
              if (s.id < step) setStep(s.id);
            }}
            className={`transition-all duration-200 rounded-full ${
              s.id === step
                ? 'w-6 h-2 bg-gray-900'
                : s.id < step
                  ? 'w-2 h-2 bg-gray-400 hover:bg-gray-600 cursor-pointer'
                  : 'w-2 h-2 bg-gray-200 cursor-default'
            }`}
            aria-label={`Step ${s.id}: ${s.label}`}
            disabled={s.id >= step}
          />
        ))}
      </div>

      {/* ── Scrollable body ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-5 py-8 pb-24">

          {/* Step heading */}
          <div className="mb-8">
            <h1 className="text-[22px] font-semibold text-gray-900">
              {step === 1 && 'Tell us about this team member'}
              {step === 2 && 'Set their role and access'}
              {step === 3 && 'Which services can they perform?'}
              {step === 4 && 'When are they available?'}
            </h1>
            <p className="text-[14px] text-gray-500 mt-1.5 leading-relaxed">
              {step === 1 && 'You can always update this information later from the Staff tab.'}
              {step === 2 && "Choose how this person interacts with your booking system."}
              {step === 3 && 'Customers will only see this staff member for the services you select. Skip to allow all.'}
              {step === 4 && 'Set individual hours or skip to use your business hours.'}
            </p>
          </div>

          {/* Error banner */}
          {submitError && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl border border-red-100 bg-red-50">
              <X size={15} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-[13px] text-red-700">{submitError}</p>
            </div>
          )}

          {/* Step content */}
          <div key={step} className="fade-in">
            {step === 1 && (
              <StepProfile
                form={form}
                onChange={patchForm}
                touched={touched}
                setTouched={touchField}
              />
            )}
            {step === 2 && (
              <StepRole form={form} onChange={patchForm} />
            )}
            {step === 3 && (
              <StepServices
                form={form}
                onChange={patchForm}
                services={services}
                servicesLoading={servicesLoading}
              />
            )}
            {step === 4 && (
              <StepAvailability form={form} onChange={patchForm} />
            )}
          </div>

          {/* Step counter — bottom */}
          <p className="mt-10 text-center text-[12px] text-gray-400">
            Step {step} of {TOTAL}
          </p>

        </div>
      </main>

    </div>
  );
}
