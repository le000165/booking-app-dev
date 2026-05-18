'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Loader2,
  LogOut,
  Phone,
  RotateCcw,
  User,
  XCircle,
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  duration_mins: number;
  price: number | null;
  emoji: string | null;
}

interface Appointment {
  id: string;
  business_id: string;
  assigned_employee_id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  services: Service[];
  notes?: string | null;
}

interface EmployeeInfo {
  id: string;
  business_id: string;
  role: string;
  is_active: boolean;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface BusinessInfo {
  id: string;
  name: string;
  timezone: string;
  phone?: string | null;
  address?: string | null;
}

type ScheduleMode = 'day' | 'week';

const statusLabels: Record<Appointment['status'], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

const statusClasses: Record<Appointment['status'], string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  completed: 'border-gray-200 bg-gray-100 text-gray-700',
  cancelled: 'border-red-200 bg-red-50 text-red-700',
  no_show: 'border-red-200 bg-red-50 text-red-700',
};

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatToolbarDate(date: Date, mode: ScheduleMode) {
  if (mode === 'day') {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  const start = startOfWeek(date);
  const end = addDays(start, 6);
  const startLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(start);
  const endLabel = new Intl.DateTimeFormat('en-US', {
    month: start.getMonth() === end.getMonth() ? undefined : 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(end);

  return `${startLabel} - ${endLabel}`;
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateInputValue(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return startOfLocalDay(new Date(year, (month || 1) - 1, day || 1));
}

function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatRevenueContext(date: Date, mode: ScheduleMode) {
  const today = new Date();

  if (mode === 'week') return 'This Week';
  if (sameLocalDate(date, today)) return 'Today';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function startOfLocalDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, amount: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function startOfWeek(date: Date) {
  const d = startOfLocalDay(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function getScheduleRange(date: Date, mode: ScheduleMode) {
  if (mode === 'week') {
    const start = startOfWeek(date);
    return { start, end: addDays(start, 7) };
  }

  const start = startOfLocalDay(date);
  return { start, end: addDays(start, 1) };
}

function isSameLocalDate(iso: string, date: Date) {
  const d = new Date(iso);
  return sameLocalDate(d, date);
}

function sameLocalDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getEarningTitle(date: Date, mode: ScheduleMode) {
  const today = new Date();

  if (mode === 'week') return 'Weekly Earning';
  if (sameLocalDate(date, today)) return "Today's Earning";
  return 'Earning';
}

function getLocalDateKey(date: Date) {
  return formatDateInputValue(date);
}

function groupAppointmentsByDay(appointments: Appointment[]) {
  const groups = new Map<string, { date: Date; appointments: Appointment[] }>();

  appointments.forEach((appt) => {
    const date = startOfLocalDay(new Date(appt.start_time));
    const key = getLocalDateKey(date);
    const group = groups.get(key);

    if (group) {
      group.appointments.push(appt);
    } else {
      groups.set(key, { date, appointments: [appt] });
    }
  });

  return Array.from(groups.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

function getEmployeeName(employee: EmployeeInfo | null) {
  const name = [employee?.first_name, employee?.last_name].filter(Boolean).join(' ').trim();
  return name || employee?.email || 'Employee';
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'EP';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function formatRole(role?: string | null) {
  if (!role) return 'Staff';
  return role
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function getDuration(appt: Appointment) {
  const serviceDuration = appt.services.reduce((sum, service) => sum + (service.duration_mins || 0), 0);
  if (serviceDuration > 0) return serviceDuration;

  const start = new Date(appt.start_time).getTime();
  const end = new Date(appt.end_time).getTime();
  return Math.max(0, Math.round((end - start) / 60000));
}

function getServicePrice(service: Service) {
  const price = Number(service.price ?? 0);
  return Number.isFinite(price) ? price : 0;
}

function getAppointmentServiceTotal(appt: Appointment) {
  return appt.services.reduce((sum, service) => sum + getServicePrice(service), 0);
}

function getEstimatedRevenue(appointments: Appointment[]) {
  const serviceTotal = appointments.reduce((sum, appt) => {
    if (appt.status === 'cancelled') return sum;

    const appointmentTotal = appt.services.reduce((serviceSum, service) => {
      return serviceSum + getServicePrice(service);
    }, 0);

    return sum + appointmentTotal;
  }, 0);

  return serviceTotal / 2;
}

export default function EmployeePage() {
  const supabase = createClient();
  const router = useRouter();

  const [loadingUser, setLoadingUser] = useState(true);
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => startOfLocalDay(new Date()));
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('day');

  const loadAppointments = useCallback(async () => {
    setApptLoading(true);
    setError(null);

    try {
      const range = getScheduleRange(selectedDate, scheduleMode);
      const params = new URLSearchParams({
        from: range.start.toISOString(),
        to: range.end.toISOString(),
      });
      const res = await fetch(`/api/my-appointments?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          router.push('/login');
          return;
        }

        throw new Error(data.error || 'Failed to load your schedule');
      }

      setAppointments(data.appointments || []);
      setEmployeeInfo(data.employee || null);
      setBusinessInfo(data.business || null);
      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load your schedule';
      setError(message);
      console.error('[EMPLOYEE] Fetch error:', err);
    } finally {
      setApptLoading(false);
      setLoadingUser(false);
    }
  }, [router, scheduleMode, selectedDate]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const updateStatus = async (id: string, status: Appointment['status']) => {
    setUpdatingId(id);

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }

      await loadAppointments();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const scheduleRange = useMemo(() => getScheduleRange(selectedDate, scheduleMode), [selectedDate, scheduleMode]);
  const visibleAppointments = useMemo(
    () =>
      appointments.filter((appt) => {
        const apptTime = new Date(appt.start_time).getTime();
        return apptTime >= scheduleRange.start.getTime() && apptTime < scheduleRange.end.getTime();
      }),
    [appointments, scheduleRange]
  );
  const groupedAppointments = useMemo(() => groupAppointmentsByDay(visibleAppointments), [visibleAppointments]);

  const completedInView = visibleAppointments.filter((appt) => appt.status === 'completed').length;
  const remainingInView = visibleAppointments.filter(
    (appt) => !['completed', 'cancelled', 'no_show'].includes(appt.status)
  ).length;
  const estimatedRevenue = useMemo(() => getEstimatedRevenue(visibleAppointments), [visibleAppointments]);
  const revenueContext = formatRevenueContext(selectedDate, scheduleMode);
  const revenueTitle = getEarningTitle(selectedDate, scheduleMode);
  const nextAppointment = visibleAppointments.find((appt) => !['completed', 'cancelled', 'no_show'].includes(appt.status));
  const employeeName = getEmployeeName(employeeInfo);
  const selectedDateLabel = formatToolbarDate(selectedDate, scheduleMode);
  const selectedDateInput = formatDateInputValue(selectedDate);

  const goToday = () => {
    setSelectedDate(startOfLocalDay(new Date()));
    setScheduleMode('day');
  };

  const goThisWeek = () => {
    setSelectedDate(startOfLocalDay(new Date()));
    setScheduleMode('week');
  };

  const moveSchedule = (direction: -1 | 1) => {
    setSelectedDate((current) => addDays(current, direction * (scheduleMode === 'week' ? 7 : 1)));
  };

  const handleDateSelect = (value: string) => {
    if (!value) return;
    setSelectedDate(parseDateInputValue(value));
  };

  if (loadingUser) {
    return <EmployeeLoadingShell />;
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-gray-950">
      <header className="border-b border-gray-200/80 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-500">Staff schedule workspace</p>
            <h1 className="truncate text-xl font-semibold tracking-tight text-gray-950 sm:text-2xl">
              Employee Portal
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadAppointments}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={apptLoading}
            >
              <RotateCcw size={16} className={apptLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-950 text-sm font-semibold text-white">
                  {getInitials(employeeName)}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold tracking-tight text-gray-950">{employeeName}</h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1.5">
                      <User size={15} />
                      {formatRole(employeeInfo?.role)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 size={15} />
                      {businessInfo?.name || 'Business'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {lastUpdated && (
                  <span>Updated {formatTime(lastUpdated.toISOString())}</span>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label={scheduleMode === 'day' ? 'Assigned this day' : 'Assigned this week'}
              value={visibleAppointments.length}
              icon={<Calendar size={18} />}
            />
            <MetricCard label="Completed" value={completedInView} icon={<Check size={18} />} />
            <MetricCard label="Remaining" value={remainingInView} icon={<Clock size={18} />} />
            <RevenueMetricCard
              amount={estimatedRevenue}
              context={revenueContext}
              title={revenueTitle}
              loading={apptLoading}
            />
          </section>

          {error && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium">{error}</p>
                <button
                  type="button"
                  onClick={loadAppointments}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
                >
                  Try again
                </button>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <ScheduleToolbar
              mode={scheduleMode}
              selectedDateLabel={selectedDateLabel}
              selectedDateInput={selectedDateInput}
              loading={apptLoading}
              onToday={goToday}
              onThisWeek={goThisWeek}
              onPrevious={() => moveSchedule(-1)}
              onNext={() => moveSchedule(1)}
              onDateSelect={handleDateSelect}
            />

            <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="text-base font-semibold text-gray-950">
                  {scheduleMode === 'day' ? 'Schedule' : 'Week schedule'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {visibleAppointments.length
                    ? `${remainingInView} still need attention`
                    : scheduleMode === 'day'
                      ? 'No assigned appointments for this date'
                      : 'No assigned appointments for this week'}
                  {businessInfo?.timezone ? ` · Times shown in ${businessInfo.timezone}` : ''}
                </p>
              </div>
              {nextAppointment && (
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                  <Clock size={14} />
                  Next at {formatTime(nextAppointment.start_time)}
                </div>
              )}
            </div>

            {apptLoading ? (
              <ScheduleSkeleton rows={scheduleMode === 'day' ? 4 : 5} />
            ) : visibleAppointments.length === 0 ? (
              <EmptySchedule
                title={scheduleMode === 'day' ? 'No appointments on this date' : 'No appointments this week'}
                description="Use the schedule controls above to jump to another date."
              />
            ) : scheduleMode === 'day' ? (
              <div className="divide-y divide-gray-100">
                {visibleAppointments.map((appt) => (
                  <AppointmentRow
                    key={appt.id}
                    appt={appt}
                    updatingId={updatingId}
                    updateStatus={updateStatus}
                  />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {groupedAppointments.map((group) => (
                  <div key={getLocalDateKey(group.date)}>
                    <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-3 sm:px-6">
                      <p className="text-sm font-semibold text-gray-950">{formatLongDate(group.date)}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {group.appointments.length} appointment{group.appointments.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {group.appointments.map((appt) => (
                        <AppointmentRow
                          key={appt.id}
                          appt={appt}
                          updatingId={updatingId}
                          updateStatus={updateStatus}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function ScheduleToolbar({
  mode,
  selectedDateLabel,
  selectedDateInput,
  loading,
  onToday,
  onThisWeek,
  onPrevious,
  onNext,
  onDateSelect,
}: {
  mode: ScheduleMode;
  selectedDateLabel: string;
  selectedDateInput: string;
  loading: boolean;
  onToday: () => void;
  onThisWeek: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onDateSelect: (value: string) => void;
}) {
  const today = new Date();
  const selected = parseDateInputValue(selectedDateInput);
  const todayActive = mode === 'day' && sameLocalDate(selected, today);
  const weekActive = mode === 'week' && getLocalDateKey(startOfWeek(selected)) === getLocalDateKey(startOfWeek(today));

  const modeButtonClass =
    'inline-flex h-11 items-center justify-center rounded-full border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';
  const navButtonClass =
    'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <div className="border-b border-gray-200 px-4 py-4 sm:px-5 lg:px-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToday}
            disabled={loading}
            aria-pressed={todayActive}
            className={`${modeButtonClass} ${
              todayActive
                ? 'border-gray-300 bg-gray-100 text-gray-950'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={onThisWeek}
            disabled={loading}
            aria-pressed={weekActive}
            className={`${modeButtonClass} ${
              weekActive
                ? 'border-gray-300 bg-gray-100 text-gray-950'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            This Week
          </button>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <button type="button" onClick={onPrevious} disabled={loading} className={navButtonClass} aria-label="Previous schedule period">
            <ChevronLeft size={18} />
          </button>

          <label className="relative flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-950 shadow-sm transition-colors hover:bg-gray-50 focus-within:ring-2 focus-within:ring-gray-900/10 sm:min-w-[260px] sm:flex-none">
            <Calendar size={16} className="shrink-0 text-gray-500" />
            <span className="truncate">{selectedDateLabel}</span>
            <input
              type="date"
              value={selectedDateInput}
              onChange={(event) => onDateSelect(event.target.value)}
              disabled={loading}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Select schedule date"
            />
          </label>

          <button type="button" onClick={onNext} disabled={loading} className={navButtonClass} aria-label="Next schedule period">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-gray-950">{value}</p>
    </div>
  );
}

function RevenueMetricCard({
  amount,
  context,
  title,
  loading,
}: {
  amount: number;
  context: string;
  title: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-xs font-medium text-gray-400">{context}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700">
          <DollarSign size={18} />
        </span>
      </div>
      {loading ? (
        <div className="mt-4 h-9 w-28 animate-pulse rounded-full bg-gray-100" />
      ) : (
        <p className="mt-4 text-3xl font-semibold tracking-tight text-gray-950">{formatCurrency(amount)}</p>
      )}
      <p className="mt-2 text-xs text-gray-500">Based on assigned appointment services</p>
    </div>
  );
}

function AppointmentRow({
  appt,
  updatingId,
  updateStatus,
  showDate = false,
}: {
  appt: Appointment;
  updatingId: string | null;
  updateStatus: (id: string, status: Appointment['status']) => void;
  showDate?: boolean;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const totalDuration = getDuration(appt);
  const isClosed = appt.status === 'completed' || appt.status === 'no_show' || appt.status === 'cancelled';
  const serviceNames = appt.services.map((service) => service.name).join(', ') || 'Service';
  const isUpdating = updatingId === appt.id;
  const serviceTotal = getAppointmentServiceTotal(appt);
  const employeeEstimate = serviceTotal / 2;
  const hasServiceLines = appt.services.length > 0;

  return (
    <article className={`px-5 py-5 transition-colors sm:px-6 ${isClosed ? 'bg-gray-50/70' : 'bg-white hover:bg-gray-50/70'}`}>
      <div className="grid gap-4 lg:grid-cols-[128px_minmax(0,1fr)_190px] lg:items-start">
        <div className="flex items-center gap-3 lg:block">
          <p className="text-lg font-semibold tracking-tight text-gray-950">{formatTime(appt.start_time)}</p>
          {showDate && <p className="text-sm font-medium text-gray-500 lg:mt-1">{formatShortDate(appt.start_time)}</p>}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-gray-950">{appt.customer_name || 'Customer'}</h3>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[appt.status]}`}>
              {statusLabels[appt.status]}
            </span>
          </div>

          <div className="mt-2 grid gap-2 text-sm text-gray-600 md:grid-cols-2">
            <p className="inline-flex min-w-0 items-center gap-2">
              <Phone size={15} className="shrink-0 text-gray-400" />
              <span className="truncate">{appt.customer_phone || 'No phone on file'}</span>
            </p>
            <p className="inline-flex min-w-0 items-center gap-2">
              <Clock size={15} className="shrink-0 text-gray-400" />
              <span>{totalDuration} min</span>
            </p>
          </div>

          <p className="mt-2 text-sm font-medium text-gray-800">{serviceNames}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700">
              Service total: {formatCurrency(serviceTotal)}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-800">
              Your earning: {formatCurrency(employeeEstimate)}
            </span>
            <button
              type="button"
              onClick={() => setDetailsOpen((open) => !open)}
              aria-expanded={detailsOpen}
              className="rounded-full px-2 py-1.5 text-xs font-semibold text-gray-600 underline underline-offset-4 transition-colors hover:text-gray-950"
            >
              {detailsOpen ? 'Hide details' : 'View details'}
            </button>
          </div>

          {detailsOpen && (
            <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">Service pricing</p>
              {hasServiceLines ? (
                <div className="mt-2 space-y-2">
                  {appt.services.map((service, index) => {
                    const price = getServicePrice(service);

                    return (
                      <div
                        key={`${service.id}-${index}`}
                        className="flex flex-col gap-1 rounded-xl bg-white px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="font-medium text-gray-800">{service.name || 'Service'}</span>
                        <span className="text-gray-500">
                          {formatCurrency(price)} original · {formatCurrency(price / 2)} earning
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500">Price unavailable for this appointment.</p>
              )}
            </div>
          )}
          {appt.notes && <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">{appt.notes}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gray-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => updateStatus(appt.id, 'completed')}
            disabled={isClosed || isUpdating}
          >
            {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Done
          </button>

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => updateStatus(appt.id, 'no_show')}
            disabled={isClosed || isUpdating}
          >
            <XCircle size={16} />
            No Show
          </button>
        </div>
      </div>
    </article>
  );
}

function EmptySchedule({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-5 py-12 text-center sm:px-6">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <Calendar size={20} />
      </div>
      <p className="mt-4 text-sm font-semibold text-gray-950">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

function ScheduleSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[128px_minmax(0,1fr)_190px]">
          <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
          <div className="space-y-3">
            <div className="h-5 w-44 animate-pulse rounded-full bg-gray-100" />
            <div className="h-4 w-full max-w-md animate-pulse rounded-full bg-gray-100" />
            <div className="h-4 w-56 animate-pulse rounded-full bg-gray-100" />
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <div className="h-11 animate-pulse rounded-full bg-gray-100" />
            <div className="h-11 animate-pulse rounded-full bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmployeeLoadingShell() {
  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      <header className="border-b border-gray-200/80 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded-full bg-gray-100" />
            <div className="h-7 w-56 animate-pulse rounded-full bg-gray-100" />
          </div>
          <div className="h-11 w-28 animate-pulse rounded-full bg-gray-100" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div className="space-y-6">
          <div className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-white" />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white" />
            <div className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white" />
            <div className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white" />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white">
            <ScheduleSkeleton />
          </div>
        </div>
      </main>
    </div>
  );
}
