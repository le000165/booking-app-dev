'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, ChevronRight, ChevronLeft, Building2, Scissors, User, Clock } from 'lucide-react';
import SquareSelect from '@/components/ui/square-select';

// ── Types ────────────────────────────────────────────────────────────────────

interface DayHours {
  day_of_week: number;
  label: string;
  open: boolean;
  open_time: string;
  close_time: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_HOURS: DayHours[] = [
  { day_of_week: 0, label: 'Sun', open: false, open_time: '09:00', close_time: '17:00' },
  { day_of_week: 1, label: 'Mon', open: true, open_time: '09:00', close_time: '18:00' },
  { day_of_week: 2, label: 'Tue', open: true, open_time: '09:00', close_time: '18:00' },
  { day_of_week: 3, label: 'Wed', open: true, open_time: '09:00', close_time: '18:00' },
  { day_of_week: 4, label: 'Thu', open: true, open_time: '09:00', close_time: '18:00' },
  { day_of_week: 5, label: 'Fri', open: true, open_time: '09:00', close_time: '18:00' },
  { day_of_week: 6, label: 'Sat', open: true, open_time: '10:00', close_time: '16:00' },
];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const STEPS = [
  { id: 1, label: 'Business', icon: Building2 },
  { id: 2, label: 'Service', icon: Scissors },
  { id: 3, label: 'Profile', icon: User },
  { id: 4, label: 'Hours', icon: Clock },
];

// ── Main Component ─────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — Business Info
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');

  // Step 2 — First Service
  const [serviceName, setServiceName] = useState('');
  const [duration, setDuration] = useState('60');
  const [price, setPrice] = useState('');

  // Step 3 — Staff Name
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Step 4 — Availability
  const [hours, setHours] = useState<DayHours[]>(DEFAULT_HOURS);

  // ── Step handlers ────────────────────────────────────────────────────────

  const handleStep1 = async () => {
    if (!businessName.trim()) { setError('Please enter your business name.'); return; }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/onboarding/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: businessName, phone, timezone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save business info');
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStep2 = async () => {
    if (!serviceName.trim()) { setError('Please enter a service name.'); return; }
    if (!duration || Number(duration) <= 0) { setError('Please enter a valid duration.'); return; }
    if (price === '' || Number(price) < 0) { setError('Please enter a valid price.'); return; }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/onboarding/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: serviceName, duration_mins: Number(duration), price: Number(price) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save service');
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStep3 = async () => {
    if (!firstName.trim()) { setError('Please enter your first name.'); return; }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/onboarding/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save name');
      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStep4 = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/onboarding/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save availability');
      router.push('/admin');
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const toggleDay = (dow: number) => {
    setHours(prev => prev.map(h => h.day_of_week === dow ? { ...h, open: !h.open } : h));
  };

  const setHourField = (dow: number, field: 'open_time' | 'close_time', value: string) => {
    setHours(prev => prev.map(h => h.day_of_week === dow ? { ...h, [field]: value } : h));
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex flex-col items-center justify-start px-5 py-12">
      <div className="w-full max-w-[480px] space-y-8">

        <div className="text-center">
          <Image
            src="/brand/logo-mark.svg"
            alt="Vero"
            width={40}
            height={40}
            priority
            className="mx-auto mb-4 h-10 w-10"
          />
          <h1 className="text-[22px] font-semibold text-[var(--text-primary)] tracking-tight">
            Set up your business
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">
            This takes about 2 minutes.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-0">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    done
                      ? 'bg-black'
                      : active
                        ? 'bg-black'
                        : 'bg-gray-100'
                  }`}>
                    {done
                      ? <CheckCircle size={17} className="text-white" />
                      : <Icon size={16} className={active ? 'text-white' : 'text-gray-400'} />
                    }
                  </div>
                  <span className={`text-[10px] font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-10 mx-1 mb-4 ${step > s.id ? 'bg-black' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 px-7 py-8 space-y-5 shadow-sm">

          {/* ── STEP 1: Business Info ── */}
          {step === 1 && (
            <>
              <div>
                <h2 className="text-[17px] font-semibold text-gray-900">Business info</h2>
                <p className="text-[13px] text-gray-500 mt-0.5">Tell us about your business.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Business name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Pojo Nails Studio"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Phone number</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="(555) 000-0000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Timezone</label>
                  <SquareSelect
                    label="Timezone"
                    value={timezone}
                    onChange={setTimezone}
                    options={TIMEZONES.map(tz => ({ value: tz, label: tz.replaceAll('_', ' ') }))}
                    className="w-full"
                  />
                </div>
              </div>
            </>
          )}

          {/* ── STEP 2: First Service ── */}
          {step === 2 && (
            <>
              <div>
                <h2 className="text-[17px] font-semibold text-gray-900">Add your first service</h2>
                <p className="text-[13px] text-gray-500 mt-0.5">You can add more services later from your dashboard.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Service name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Classic Manicure"
                    value={serviceName}
                    onChange={e => setServiceName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Duration (minutes) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      className="input-field"
                      placeholder="60"
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Price ($) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input-field"
                      placeholder="35.00"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 3: Staff Name ── */}
          {step === 3 && (
            <>
              <div>
                <h2 className="text-[17px] font-semibold text-gray-900">Your name</h2>
                <p className="text-[13px] text-gray-500 mt-0.5">This will appear on your bookings calendar.</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-1.5">First name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Jane"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Last name</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Doe"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 4: Availability ── */}
          {step === 4 && (
            <>
              <div>
                <h2 className="text-[17px] font-semibold text-gray-900">Set your hours</h2>
                <p className="text-[13px] text-gray-500 mt-0.5">When are you open for bookings?</p>
              </div>
              <div className="space-y-2">
                {hours.map(h => (
                  <div
                    key={h.day_of_week}
                    className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-colors ${
                      h.open ? 'border-gray-200 bg-white' : 'border-transparent bg-gray-50'
                    }`}
                  >
                    {/* Toggle */}
                    <label className="toggle shrink-0">
                      <input type="checkbox" checked={h.open} onChange={() => toggleDay(h.day_of_week)} />
                      <span className="toggle-slider" />
                    </label>

                    {/* Day label */}
                    <span className={`w-7 shrink-0 text-[13px] font-medium ${h.open ? 'text-gray-900' : 'text-gray-400'}`}>
                      {h.label}
                    </span>

                    {h.open ? (
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <input
                          type="time"
                          value={h.open_time}
                          onChange={e => setHourField(h.day_of_week, 'open_time', e.target.value)}
                          className="flex-1 min-w-0 h-8 rounded-lg border border-gray-200 px-2 text-[13px] text-gray-700 focus:outline-none focus:border-gray-400"
                        />
                        <span className="text-[12px] text-gray-400 shrink-0">–</span>
                        <input
                          type="time"
                          value={h.close_time}
                          onChange={e => setHourField(h.day_of_week, 'close_time', e.target.value)}
                          className="flex-1 min-w-0 h-8 rounded-lg border border-gray-200 px-2 text-[13px] text-gray-700 focus:outline-none focus:border-gray-400"
                        />
                      </div>
                    ) : (
                      <span className="text-[13px] text-gray-400 flex-1">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            {step > 1 && (
              <button
                type="button"
                onClick={() => { setError(null); setStep(s => s - 1); }}
                disabled={saving}
                className="h-11 px-4 rounded-xl border border-gray-200 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={() => {
                if (step === 1) handleStep1();
                else if (step === 2) handleStep2();
                else if (step === 3) handleStep3();
                else handleStep4();
              }}
              className="flex-1 h-11 rounded-xl bg-black text-white text-[14px] font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : step === 4 ? (
                'Finish setup'
              ) : (
                <>Continue <ChevronRight size={16} /></>
              )}
            </button>
          </div>

          {/* Skip step 2 and 3 */}
          {(step === 2 || step === 3) && (
            <button
              type="button"
              className="w-full text-center text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => { setError(null); setStep(s => s + 1); }}
            >
              Skip for now
            </button>
          )}
        </div>

        <p className="text-center text-[12px] text-gray-400">
          You can change all of this later in your dashboard.
        </p>
      </div>
    </div>
  );
}
