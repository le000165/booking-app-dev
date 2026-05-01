'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import StepIndicator from '@/components/StepIndicator';
import ServiceCard from '@/components/ServiceCard';
import TimeSlotGrid from '@/components/TimeSlotGrid';
import { ChevronLeft, ChevronRight, MapPin, Clock, CheckCircle, Loader2, AlertCircle, Check } from 'lucide-react';

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DATES_PER_PAGE = 7;
const MAX_BOOKING_DAYS = 183; // ~6 months

// Generate the full pool of bookable dates: today through 6 months out.
function getAllDateOptions(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < MAX_BOOKING_DAYS; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

const ALL_DATES = getAllDateOptions();

type Step = 1 | 2 | 3 | 4 | 5;

interface Business {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  timezone: string;
}

interface Service {
  id: string;
  name: string;
  duration_mins: number;
  price: number;
  emoji?: string;
}

function toLocalDateStr(date: Date): string {
  const y  = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d  = String(date.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

function formatSlotDisplay(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/* ── Sub-components ──────────────────────────────────────────────────── */

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-[22px] font-semibold text-[var(--text-primary)] tracking-tight">{title}</h2>
      {subtitle && <p className="text-[14px] text-[var(--text-secondary)] mt-1">{subtitle}</p>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[13px] text-[var(--text-secondary)] flex-shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-[var(--text-primary)] text-right">{value}</span>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────── */

export default function BookingPage() {
  const params = useParams();
  const slug = params.slug as string;

  // ── Data ──
  const [business, setBusiness]         = useState<Business | null>(null);
  const [services, setServices]         = useState<Service[]>([]);
  const [employees, setEmployees]       = useState<any[]>([]);
  const [slots, setSlots]               = useState<string[]>([]);
  const [pageLoading, setPageLoading]   = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [notFound, setNotFound]         = useState(false);

  // ── Booking state ──
  const [step, setStep]                       = useState<Step>(1);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('any');
  const [selectedDate, setSelectedDate]       = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot]       = useState<string | null>(null);
  const [form, setForm]                       = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [confirmationId, setConfirmationId]   = useState<string | null>(null);
  const [dateWindowStart, setDateWindowStart] = useState(0);

  // ── Derived values ──
  const selectedServices  = services.filter(s => selectedServiceIds.includes(s.id));
  const totalDurationMins = selectedServices.reduce((sum, s) => sum + s.duration_mins, 0);
  const totalPrice        = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
  const serviceIdsParam   = selectedServiceIds.join(',');

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
    // Reset downstream selections when services change
    setSelectedSlot(null);
    setSlots([]);
  };

  const visibleDates = ALL_DATES.slice(dateWindowStart, dateWindowStart + DATES_PER_PAGE);
  const canGoBack    = dateWindowStart > 0;
  const canGoForward = dateWindowStart + DATES_PER_PAGE < ALL_DATES.length;

  // ── Load business + services ──
  useEffect(() => {
    async function loadBusiness() {
      try {
        const [bizRes, svcRes] = await Promise.all([
          fetch(`/api/business?slug=${slug}`),
          fetch(`/api/services?slug=${slug}`),
        ]);
        if (!bizRes.ok) { setNotFound(true); return; }
        const bizData = await bizRes.json();
        const svcData = await svcRes.json();
        setBusiness(bizData.business);
        setServices(svcData.services || []);
      } catch {
        setNotFound(true);
      } finally {
        setPageLoading(false);
      }
    }
    loadBusiness();
  }, [slug]);

  // ── Load employees when services chosen ──
  useEffect(() => {
    if (!business || selectedServiceIds.length === 0) return;
    async function loadEmployees() {
      setEmployeesLoading(true);
      try {
        const res  = await fetch(`/api/employees?business_id=${business!.id}&service_ids=${serviceIdsParam}`);
        const data = await res.json();
        setEmployees(data.employees || []);
        setSelectedEmployeeId('any');
      } catch {
        setEmployees([]);
      } finally {
        setEmployeesLoading(false);
      }
    }
    loadEmployees();
  }, [business, serviceIdsParam]);

  // ── Load slots ──
  useEffect(() => {
    if (!selectedDate || selectedServiceIds.length === 0 || !business) return;
    async function loadSlots() {
      setSlotsLoading(true);
      try {
        const dateStr = toLocalDateStr(selectedDate!);
        const res  = await fetch(
          `/api/slots?business_id=${business!.id}&service_ids=${serviceIdsParam}&date=${dateStr}&employee_id=${selectedEmployeeId}`
        );
        const data = await res.json();
        setSlots(data.slots || []);
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    }
    loadSlots();
  }, [selectedDate, serviceIdsParam, business, selectedEmployeeId]);

  const goBack = () => setStep(prev => (prev > 1 ? (prev - 1) as Step : prev));

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSubmit = useCallback(async () => {
    if (selectedServiceIds.length === 0 || !selectedSlot || !form.name || !form.email || !business) return;
    setLoading(true);
    setError(null);

    try {
      const startTime = new Date(selectedSlot);
      const endTime   = new Date(startTime.getTime() + totalDurationMins * 60000);

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id:          business.id,
          service_id:           selectedServiceIds[0],   // primary (backward compat)
          service_ids:          selectedServiceIds,       // full list
          assigned_employee_id: selectedEmployeeId === 'any' ? null : selectedEmployeeId,
          customer_name:        form.name,
          customer_email:       form.email,
          customer_phone:       form.phone || null,
          start_time:           startTime.toISOString(),
          end_time:             endTime.toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'CONFLICT') {
          setError('This slot was just taken. Please pick another time.');
          setStep(3);
          setSelectedSlot(null);
          const dateStr  = toLocalDateStr(selectedDate!);
          const slotsRes = await fetch(
            `/api/slots?business_id=${business.id}&service_ids=${serviceIdsParam}&date=${dateStr}&employee_id=${selectedEmployeeId}`
          );
          const slotsData = await slotsRes.json();
          setSlots(slotsData.slots || []);
        } else {
          setError(data.error || 'Something went wrong.');
        }
        return;
      }

      setConfirmationId(data.appointment?.id?.slice(0, 8).toUpperCase() || 'CONFIRMED');
      setStep(5);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedServiceIds, totalDurationMins, selectedSlot, form, business, selectedDate, selectedEmployeeId, serviceIdsParam]);

  // ── Loading ──
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  // ── 404 ──
  if (notFound || !business) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex flex-col items-center justify-center px-5 text-center gap-4">
        <AlertCircle size={36} className="text-[var(--text-muted)]" />
        <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">Business not found</h1>
        <p className="text-[14px] text-[var(--text-secondary)] max-w-[280px]">
          The booking page for &quot;{slug}&quot; doesn&apos;t exist or is no longer active.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">

      {/* ── Header ── */}
      <header className="app-header">
        <div className="app-header-inner">
          {step > 1 && step < 5 && (
            <button
              className="btn-ghost"
              onClick={goBack}
              style={{ padding: '6px', marginLeft: '-6px', marginRight: '4px' }}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[15px] text-[var(--text-primary)] truncate">
              {step < 5 ? business.name : 'Booking confirmed'}
            </p>
            {step === 1 && business.address && (
              <p className="text-[12px] text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                <MapPin size={10} />
                {business.address}
              </p>
            )}
          </div>
          {step > 0 && step < 5 && (
            <StepIndicator current={step} total={4} />
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-container" style={{ paddingTop: 28, paddingBottom: 40 }}>

        {/* ── STEP 1: Choose Services ── */}
        {step === 1 && (
          <div className="slide-up">
            <SectionHeading title="What do you need?" subtitle="Select one or more services." />

            {services.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-[14px] text-[var(--text-secondary)]">No services available right now.</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {services.map(svc => {
                  const isSelected = selectedServiceIds.includes(svc.id);
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => toggleService(svc.id)}
                      className={`select-row w-full ${isSelected ? 'selected' : ''}`}
                    >
                      {svc.emoji && <span style={{ fontSize: 22, flexShrink: 0 }}>{svc.emoji}</span>}
                      <div className="flex-1 text-left">
                        <p className="font-medium text-[15px] text-[var(--text-primary)]">{svc.name}</p>
                        <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                          {svc.duration_mins} min &middot; ${Number(svc.price).toFixed(2)}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                        isSelected ? 'bg-[var(--brand)] border-[var(--brand)]' : 'border-[var(--border-default)]'
                      }`}>
                        {isSelected && <Check size={11} strokeWidth={3} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Running total */}
            {selectedServiceIds.length > 0 && (
              <div className="card mb-5" style={{ background: 'var(--bg-subtle)' }}>
                <div className="flex justify-between text-[13px] text-[var(--text-secondary)] mb-1">
                  <span>{selectedServiceIds.length} service{selectedServiceIds.length > 1 ? 's' : ''} selected</span>
                  <span>{totalDurationMins} min</span>
                </div>
                <div className="flex justify-between font-semibold text-[15px] text-[var(--text-primary)]">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:justify-end mt-6">
              <button
                className="btn-primary w-full md:w-auto"
                disabled={selectedServiceIds.length === 0}
                onClick={() => setStep(2)}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Choose Staff ── */}
        {step === 2 && (
          <div className="slide-up">
            <SectionHeading title="Who should see you?" subtitle="Select a team member or any available staff." />

            {employeesLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={22} className="animate-spin text-[var(--text-muted)]" />
              </div>
            ) : (
              <div className="space-y-2 mb-6">
                {/* Any staff option */}
                <button
                  type="button"
                  onClick={() => setSelectedEmployeeId('any')}
                  className={`select-row ${selectedEmployeeId === 'any' ? 'selected' : ''}`}
                >
                  <div className="avatar avatar-md bg-[var(--bg-subtle)] flex-shrink-0">
                    <span style={{ fontSize: 18 }}>✦</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-[15px] text-[var(--text-primary)]">Any available staff</p>
                    <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Best for immediate availability</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selectedEmployeeId === 'any'
                        ? 'bg-[var(--brand)] border-[var(--brand)]'
                        : 'border-[var(--border-default)]'
                    }`}
                  >
                    {selectedEmployeeId === 'any' && <Check size={10} strokeWidth={3} className="text-white" />}
                  </div>
                </button>

                {employees.map(emp => {
                  const isSelected = selectedEmployeeId === emp.id;
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setSelectedEmployeeId(emp.id)}
                      className={`select-row ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="avatar avatar-md flex-shrink-0">
                        <span className="font-semibold text-[14px]">
                          {emp.first_name?.[0]?.toUpperCase()}{emp.last_name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-[15px] text-[var(--text-primary)]">
                          {emp.first_name} {emp.last_name}
                        </p>
                        <p className="text-[12px] text-[var(--text-secondary)] uppercase tracking-wide mt-0.5">
                          {emp.role}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected
                            ? 'bg-[var(--brand)] border-[var(--brand)]'
                            : 'border-[var(--border-default)]'
                        }`}
                      >
                        {isSelected && <Check size={10} strokeWidth={3} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col md:flex-row md:justify-end mt-6">
              <button className="btn-primary w-full md:w-auto" onClick={() => setStep(3)}>
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Pick Date + Time ── */}
        {step === 3 && (
          <div className="slide-up">
            <SectionHeading
              title="When works for you?"
              subtitle={totalDurationMins > 0 ? `${totalDurationMins} min total` : undefined}
            />

            {/* Date picker with navigation */}
            <div className="card mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="section-label">
                  {MONTHS[visibleDates[0].getMonth()]} {visibleDates[0].getFullYear()}
                  {visibleDates[visibleDates.length - 1].getMonth() !== visibleDates[0].getMonth() &&
                    ` – ${MONTHS[visibleDates[visibleDates.length - 1].getMonth()]}`}
                </p>
                <div className="flex gap-1">
                  <button
                    className="btn-ghost"
                    style={{ padding: '4px', borderRadius: '6px', opacity: canGoBack ? 1 : 0.3 }}
                    onClick={() => setDateWindowStart(s => Math.max(0, s - DATES_PER_PAGE))}
                    disabled={!canGoBack}
                    aria-label="Previous dates"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    className="btn-ghost"
                    style={{ padding: '4px', borderRadius: '6px', opacity: canGoForward ? 1 : 0.3 }}
                    onClick={() => setDateWindowStart(s => Math.min(ALL_DATES.length - DATES_PER_PAGE, s + DATES_PER_PAGE))}
                    disabled={!canGoForward}
                    aria-label="Next dates"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {visibleDates.map((date, i) => {
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  return (
                    <button
                      key={i}
                      className={`date-btn ${isSelected ? 'selected' : ''}`}
                      style={{ flex: 1 }}
                      onClick={() => handleDateSelect(date)}
                    >
                      <span className="text-[11px] font-medium" style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                        {DAYS[date.getDay()]}
                      </span>
                      <span className="text-[17px] font-semibold leading-none">
                        {date.getDate()}
                      </span>
                      <span className="text-[10px]" style={{ color: isSelected ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>
                        {MONTHS[date.getMonth()]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="card slide-up mb-4">
                <p className="section-label mb-4">
                  {DAYS[selectedDate.getDay()]}, {MONTHS[selectedDate.getMonth()]} {selectedDate.getDate()}
                </p>
                {slotsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={22} className="animate-spin text-[var(--text-muted)]" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-6 px-4">
                    <p className="text-[14px] text-[var(--text-secondary)]">
                      No availability on this date &mdash; try another day or a different staff member.
                    </p>
                  </div>
                ) : (
                  <TimeSlotGrid slots={slots} selected={selectedSlot} onSelect={setSelectedSlot} />
                )}
              </div>
            )}

            {error && (
              <div className="mb-4 bg-[var(--error-light)] border border-[var(--error-border)] rounded-lg p-3 text-[13px] text-[var(--error)]">
                {error}
              </div>
            )}

            <div className="flex flex-col md:flex-row md:justify-end mt-6">
              <button
                className="btn-primary w-full md:w-auto"
                disabled={!selectedSlot}
                onClick={() => { setError(null); setStep(4); }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Customer Details ── */}
        {step === 4 && (
          <div className="slide-up">
            <SectionHeading title="Your details" subtitle="Just a few details to confirm your appointment." />

            {/* Booking summary */}
            <div className="card mb-5" style={{ background: 'var(--bg-subtle)' }}>
              <p className="section-label mb-3">Appointment summary</p>
              <div className="space-y-2.5">
                {/* List each selected service */}
                {selectedServices.map((svc, i) => (
                  <SummaryRow key={svc.id} label={i === 0 ? 'Services' : ''} value={`${svc.name} (${svc.duration_mins} min)`} />
                ))}
                <SummaryRow
                  label="Staff"
                  value={
                    selectedEmployeeId === 'any'
                      ? 'Any available'
                      : (() => {
                          const emp = employees.find(e => e.id === selectedEmployeeId);
                          return emp ? `${emp.first_name} ${emp.last_name}` : 'Selected provider';
                        })()
                  }
                />
                {selectedDate && selectedSlot && (
                  <SummaryRow
                    label="Date & time"
                    value={`${DAYS[selectedDate.getDay()]}, ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()} at ${formatSlotDisplay(selectedSlot)}`}
                  />
                )}
                <div className="divider" style={{ margin: '10px 0' }} />
                <SummaryRow label="Duration" value={`${totalDurationMins} min`} />
                <SummaryRow label="Total" value={`$${totalPrice.toFixed(2)}`} />
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="input-label">Full name *</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="input-label">Email address *</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="input-label">Phone number (optional)</label>
                <input
                  className="input-field"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  autoComplete="tel"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-[var(--error-light)] border border-[var(--error-border)] rounded-lg p-3 text-[13px] text-[var(--error)]">
                {error}
              </div>
            )}

            <div className="flex flex-col md:flex-row md:justify-end mt-6">
              <button
                className="btn-primary w-full md:w-auto"
                disabled={!form.name || !form.email || loading}
                onClick={handleSubmit}
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Booking...</>
                ) : (
                  'Book appointment'
                )}
              </button>
            </div>

            <p className="text-center text-[12px] text-[var(--text-muted)] mt-4">
              No payment required. Pay in person on the day.
            </p>
          </div>
        )}

        {/* ── STEP 5: Confirmation ── */}
        {step === 5 && (
          <div className="slide-up">
            {/* Success */}
            <div className="text-center py-8">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-[var(--success-light)] success-ring" />
                <div className="relative w-16 h-16 rounded-full bg-[var(--success-light)] flex items-center justify-center">
                  <CheckCircle size={32} className="text-[var(--success)]" />
                </div>
              </div>
              <h2 className="text-[24px] font-semibold text-[var(--text-primary)] tracking-tight">
                Thanks for booking!
              </h2>
              <p className="text-[14px] text-[var(--text-secondary)] mt-2">
                A confirmation will be sent to <strong>{form.email}</strong>
              </p>
            </div>

            {/* Summary card */}
            <div className="card mb-5">
              <p className="section-label mb-4">Booking summary</p>
              <div className="space-y-3">
                {selectedServices.map((svc, i) => (
                  <SummaryRow key={svc.id} label={i === 0 ? 'Services' : ''} value={`${svc.name} (${svc.duration_mins} min)`} />
                ))}
                <SummaryRow
                  label="Provider"
                  value={
                    selectedEmployeeId === 'any'
                      ? 'Any available'
                      : (() => {
                          const emp = employees.find(e => e.id === selectedEmployeeId);
                          return emp ? `${emp.first_name} ${emp.last_name}` : 'Selected provider';
                        })()
                  }
                />
                <SummaryRow
                  label="Date & time"
                  value={
                    selectedDate && selectedSlot
                      ? `${DAYS[selectedDate.getDay()]}, ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()} at ${formatSlotDisplay(selectedSlot)}`
                      : ''
                  }
                />
                <SummaryRow label="Total" value={`$${totalPrice.toFixed(2)} (pay in person)`} />
                {business.address && <SummaryRow label="Location" value={business.address} />}
              </div>
              <div className="divider mt-4 mb-4" />
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[var(--text-muted)]">Confirmation ID</span>
                <span className="badge badge-gray font-mono text-[12px] font-semibold">{confirmationId}</span>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={() => {
                setStep(1);
                setSelectedServiceIds([]);
                setSelectedEmployeeId('any');
                setSelectedDate(null);
                setSelectedSlot(null);
                setSlots([]);
                setForm({ name: '', email: '', phone: '' });
                setError(null);
              }}
            >
              Book another appointment
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
