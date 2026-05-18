'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
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
type PortalTab = 'appointments' | 'earnings' | 'profile';

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

function formatEarningContext(date: Date, mode: ScheduleMode) {
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

function getAppointmentsInRange(appointments: Appointment[], start: Date, end: Date) {
  return appointments.filter((appt) => {
    const apptTime = new Date(appt.start_time).getTime();
    return apptTime >= start.getTime() && apptTime < end.getTime();
  });
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

function EmployeeSummaryCard({
  employeeName,
  role,
  businessName,
  selectedDateLabel,
  context,
  lastUpdated,
}: {
  employeeName: string;
  role: string;
  businessName: string;
  selectedDateLabel: string;
  context: string;
  lastUpdated: Date | null;
}) {
  return (
    <section className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-8 lg:rounded-2xl lg:px-7 lg:py-6 lg:shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3 lg:justify-start">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-950 text-sm font-semibold text-white lg:h-12 lg:w-12">
            {getInitials(employeeName)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight text-gray-950 lg:text-2xl">{employeeName}</h2>
            <p className="mt-0.5 truncate text-sm text-gray-500 lg:text-base">{role} · {businessName}</p>
          </div>
        </div>

        <div className="shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 lg:hidden">
          {context}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-1 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between lg:mt-0 lg:min-w-[320px] lg:items-end lg:border-t-0 lg:pt-0 lg:text-right">
        <div>
          <p className="hidden text-xs font-semibold uppercase tracking-[0.08em] text-gray-400 lg:block">{context}</p>
          <p className="text-sm font-medium text-gray-700 lg:mt-1 lg:text-base lg:font-semibold lg:text-gray-950">{selectedDateLabel}</p>
        </div>
        {lastUpdated && <p className="text-xs text-gray-400 lg:mt-2">Updated {formatTime(lastUpdated.toISOString())}</p>}
      </div>
    </section>
  );
}

function PortalNavigation({ activeTab, onChange }: { activeTab: PortalTab; onChange: (tab: PortalTab) => void }) {
  const tabs: Array<{ id: PortalTab; label: string; icon: React.ReactNode }> = [
    { id: 'appointments', label: 'Appointments', icon: <Calendar size={16} /> },
    { id: 'earnings', label: 'Earnings', icon: <DollarSign size={16} /> },
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
  ];

  return (
    <nav className="hidden rounded-full border border-gray-200 bg-white p-1 shadow-sm md:inline-flex lg:shadow-[0_1px_2px_rgba(15,23,42,0.04)]" aria-label="Employee portal sections">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors lg:px-6 ${
            activeTab === tab.id ? 'bg-gray-100 text-gray-950' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function MobileBottomNav({ activeTab, onChange }: { activeTab: PortalTab; onChange: (tab: PortalTab) => void }) {
  const tabs: Array<{ id: PortalTab; label: string; icon: React.ReactNode }> = [
    { id: 'appointments', label: 'Appointments', icon: <Calendar size={18} /> },
    { id: 'earnings', label: 'Earnings', icon: <DollarSign size={18} /> },
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden" aria-label="Employee portal sections">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition-colors ${
              activeTab === tab.id ? 'bg-gray-100 text-gray-950' : 'text-gray-500 active:bg-gray-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function AppointmentsPanel({
  scheduleMode,
  selectedDateLabel,
  selectedDateInput,
  loading,
  visibleAppointments,
  groupedAppointments,
  remainingInView,
  nextAppointment,
  timezone,
  employeeName,
  updatingId,
  onToday,
  onThisWeek,
  onPrevious,
  onNext,
  onDateSelect,
  updateStatus,
}: {
  scheduleMode: ScheduleMode;
  selectedDateLabel: string;
  selectedDateInput: string;
  loading: boolean;
  visibleAppointments: Appointment[];
  groupedAppointments: { date: Date; appointments: Appointment[] }[];
  remainingInView: number;
  nextAppointment: Appointment | undefined;
  timezone?: string;
  employeeName: string;
  updatingId: string | null;
  onToday: () => void;
  onThisWeek: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onDateSelect: (value: string) => void;
  updateStatus: (id: string, status: Appointment['status']) => void;
}) {
  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start lg:gap-8 lg:space-y-0 xl:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="space-y-4 lg:sticky lg:top-28">
        <ScheduleToolbar
          mode={scheduleMode}
          selectedDateLabel={selectedDateLabel}
          selectedDateInput={selectedDateInput}
          loading={loading}
          onToday={onToday}
          onThisWeek={onThisWeek}
          onPrevious={onPrevious}
          onNext={onNext}
          onDateSelect={onDateSelect}
        />
        <div className="hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:block">
          <p className="text-sm font-semibold text-gray-950">Next appointment</p>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            {nextAppointment ? `${formatTime(nextAppointment.start_time)} · ${nextAppointment.customer_name || 'Customer'}` : 'Nothing else needs attention right now.'}
          </p>
        </div>
      </aside>

      <section className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm lg:rounded-2xl lg:shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6 lg:py-5">
          <div>
            <h2 className="text-base font-semibold text-gray-950 lg:text-lg">Appointments</h2>
            <p className="mt-1 text-sm text-gray-500">
              {visibleAppointments.length
                ? `${remainingInView} still need attention`
                : scheduleMode === 'day'
                  ? 'No assigned appointments for this date'
                  : 'No assigned appointments for this week'}
              {timezone ? ` · Times shown in ${timezone}` : ''}
            </p>
          </div>
          {nextAppointment && (
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
              <Clock size={14} />
              Next at {formatTime(nextAppointment.start_time)}
            </div>
          )}
        </div>

        {loading ? (
          <ScheduleSkeleton rows={scheduleMode === 'day' ? 4 : 5} />
        ) : visibleAppointments.length === 0 ? (
          <EmptySchedule
            title={scheduleMode === 'day' ? 'No appointments on this date' : 'No appointments this week'}
            description="Use the schedule controls above to jump to another date."
          />
        ) : scheduleMode === 'day' ? (
          <div className="divide-y divide-gray-100">
            <AppointmentListHeader />
            {visibleAppointments.map((appt) => (
              <AppointmentRow
                key={appt.id}
                appt={appt}
                employeeName={employeeName}
                updatingId={updatingId}
                updateStatus={updateStatus}
              />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {groupedAppointments.map((group) => (
              <div key={getLocalDateKey(group.date)}>
                <div className="border-b border-gray-100 bg-gray-50/70 px-4 py-3 sm:px-6">
                  <p className="text-sm font-semibold text-gray-950">{formatLongDate(group.date)}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {group.appointments.length} appointment{group.appointments.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  <AppointmentListHeader />
                  {group.appointments.map((appt) => (
                    <AppointmentRow
                      key={appt.id}
                      appt={appt}
                      employeeName={employeeName}
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
  );
}

function AppointmentListHeader() {
  return (
    <div className="hidden grid-cols-[96px_minmax(0,1fr)_110px_104px_120px] gap-5 border-b border-gray-100 bg-gray-50/70 px-6 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-gray-400 lg:grid">
      <span>Time</span>
      <span>Customer</span>
      <span>Status</span>
      <span>Duration</span>
      <span>Earning</span>
    </div>
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

function getOriginalServiceTotal(appointments: Appointment[]) {
  return appointments.reduce((sum, appt) => {
    if (appt.status === 'cancelled') return sum;
    return sum + getAppointmentServiceTotal(appt);
  }, 0);
}

function getEstimatedEarning(appointments: Appointment[]) {
  return getOriginalServiceTotal(appointments) / 2;
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
  const [activeTab, setActiveTab] = useState<PortalTab>('appointments');

  const loadAppointments = useCallback(async () => {
    setApptLoading(true);
    setError(null);

    try {
      const todayWeek = getScheduleRange(new Date(), 'week');
      const selectedWeek = getScheduleRange(selectedDate, 'week');
      const ranges = sameLocalDate(todayWeek.start, selectedWeek.start) ? [selectedWeek] : [todayWeek, selectedWeek];

      const responses = await Promise.all(ranges.map(async (range) => {
        const params = new URLSearchParams({
          from: range.start.toISOString(),
          to: range.end.toISOString(),
        });
        const res = await fetch(`/api/my-appointments?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401 || res.status === 403 || res.status === 404) {
            router.push('/login');
            return null;
          }

          throw new Error(data.error || 'Failed to load your schedule');
        }

        return data;
      }));

      if (responses.some((data) => data === null)) {
        return;
      }

      const firstData = responses.find(Boolean);
      const appointmentMap = new Map<string, Appointment>();
      responses.forEach((data) => {
        data?.appointments?.forEach((appt: Appointment) => appointmentMap.set(appt.id, appt));
      });

      setAppointments(Array.from(appointmentMap.values()).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
      setEmployeeInfo(firstData?.employee || null);
      setBusinessInfo(firstData?.business || null);
      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load your schedule';
      setError(message);
      console.error('[EMPLOYEE] Fetch error:', err);
    } finally {
      setApptLoading(false);
      setLoadingUser(false);
    }
  }, [router, selectedDate]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        loadAppointments();
      }
    };

    window.addEventListener('focus', loadAppointments);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.removeEventListener('focus', loadAppointments);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
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
    () => getAppointmentsInRange(appointments, scheduleRange.start, scheduleRange.end),
    [appointments, scheduleRange]
  );
  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const todayRange = useMemo(() => getScheduleRange(today, 'day'), [today]);
  const selectedDayRange = useMemo(() => getScheduleRange(selectedDate, 'day'), [selectedDate]);
  const selectedWeekRange = useMemo(() => getScheduleRange(selectedDate, 'week'), [selectedDate]);
  const todayAppointments = useMemo(
    () => getAppointmentsInRange(appointments, todayRange.start, todayRange.end),
    [appointments, todayRange]
  );
  const selectedDayAppointments = useMemo(
    () => getAppointmentsInRange(appointments, selectedDayRange.start, selectedDayRange.end),
    [appointments, selectedDayRange]
  );
  const selectedWeekAppointments = useMemo(
    () => getAppointmentsInRange(appointments, selectedWeekRange.start, selectedWeekRange.end),
    [appointments, selectedWeekRange]
  );
  const groupedAppointments = useMemo(() => groupAppointmentsByDay(visibleAppointments), [visibleAppointments]);

  const completedInView = visibleAppointments.filter((appt) => appt.status === 'completed').length;
  const remainingInView = visibleAppointments.filter(
    (appt) => !['completed', 'cancelled', 'no_show'].includes(appt.status)
  ).length;
  const originalServiceTotal = useMemo(() => getOriginalServiceTotal(visibleAppointments), [visibleAppointments]);
  const estimatedEarning = useMemo(() => getEstimatedEarning(visibleAppointments), [visibleAppointments]);
  const todayOriginalTotal = useMemo(() => getOriginalServiceTotal(todayAppointments), [todayAppointments]);
  const todayEarning = useMemo(() => getEstimatedEarning(todayAppointments), [todayAppointments]);
  const selectedDayOriginalTotal = useMemo(() => getOriginalServiceTotal(selectedDayAppointments), [selectedDayAppointments]);
  const selectedDayEarning = useMemo(() => getEstimatedEarning(selectedDayAppointments), [selectedDayAppointments]);
  const selectedWeekOriginalTotal = useMemo(() => getOriginalServiceTotal(selectedWeekAppointments), [selectedWeekAppointments]);
  const selectedWeekEarning = useMemo(() => getEstimatedEarning(selectedWeekAppointments), [selectedWeekAppointments]);
  const earningContext = formatEarningContext(selectedDate, scheduleMode);
  const earningTitle = getEarningTitle(selectedDate, scheduleMode);
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
    <div className="min-h-dvh bg-[#f6f7f8] text-gray-950">
      <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:max-w-7xl lg:px-10 xl:px-12">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">Employee Portal</p>
            <h1 className="truncate text-lg font-semibold tracking-tight text-gray-950">Today&apos;s work</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadAppointments}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-4"
              disabled={apptLoading}
              aria-label="Refresh schedule"
            >
              <RotateCcw size={16} className={apptLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100 sm:w-auto sm:px-4"
              aria-label="Sign out"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-4 pb-24 sm:px-6 lg:max-w-7xl lg:px-10 lg:py-8 lg:pb-10 xl:px-12">
        <div className="min-w-0 space-y-5 lg:space-y-7">
          <EmployeeSummaryCard
            employeeName={employeeName}
            role={formatRole(employeeInfo?.role)}
            businessName={businessInfo?.name || 'Business'}
            selectedDateLabel={selectedDateLabel}
            context={formatEarningContext(selectedDate, scheduleMode)}
            lastUpdated={lastUpdated}
          />

          <PortalNavigation activeTab={activeTab} onChange={setActiveTab} />

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

          {activeTab === 'appointments' && (
            <AppointmentsPanel
              scheduleMode={scheduleMode}
              selectedDateLabel={selectedDateLabel}
              selectedDateInput={selectedDateInput}
              loading={apptLoading}
              visibleAppointments={visibleAppointments}
              groupedAppointments={groupedAppointments}
              remainingInView={remainingInView}
              nextAppointment={nextAppointment}
              timezone={businessInfo?.timezone}
              employeeName={employeeName}
              updatingId={updatingId}
              onToday={goToday}
              onThisWeek={goThisWeek}
              onPrevious={() => moveSchedule(-1)}
              onNext={() => moveSchedule(1)}
              onDateSelect={handleDateSelect}
              updateStatus={updateStatus}
            />
          )}

          {activeTab === 'earnings' && (
            <EarningsPanel
              selectedDate={selectedDate}
              selectedDateLabel={selectedDateLabel}
              scheduleMode={scheduleMode}
              loading={apptLoading}
              visibleAppointments={visibleAppointments}
              originalServiceTotal={originalServiceTotal}
              estimatedEarning={estimatedEarning}
              todayAppointments={todayAppointments}
              todayOriginalTotal={todayOriginalTotal}
              todayEarning={todayEarning}
              selectedDayAppointments={selectedDayAppointments}
              selectedDayOriginalTotal={selectedDayOriginalTotal}
              selectedDayEarning={selectedDayEarning}
              selectedWeekAppointments={selectedWeekAppointments}
              selectedWeekOriginalTotal={selectedWeekOriginalTotal}
              selectedWeekEarning={selectedWeekEarning}
            />
          )}

          {activeTab === 'profile' && (
            <ProfilePanel
              employeeName={employeeName}
              role={formatRole(employeeInfo?.role)}
              business={businessInfo}
              employee={employeeInfo}
            />
          )}
        </div>
      </main>

      <MobileBottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}

function EarningsPanel({
  selectedDate,
  selectedDateLabel,
  scheduleMode,
  loading,
  visibleAppointments,
  originalServiceTotal,
  estimatedEarning,
  todayAppointments,
  todayOriginalTotal,
  todayEarning,
  selectedDayAppointments,
  selectedDayOriginalTotal,
  selectedDayEarning,
  selectedWeekAppointments,
  selectedWeekOriginalTotal,
  selectedWeekEarning,
}: {
  selectedDate: Date;
  selectedDateLabel: string;
  scheduleMode: ScheduleMode;
  loading: boolean;
  visibleAppointments: Appointment[];
  originalServiceTotal: number;
  estimatedEarning: number;
  todayAppointments: Appointment[];
  todayOriginalTotal: number;
  todayEarning: number;
  selectedDayAppointments: Appointment[];
  selectedDayOriginalTotal: number;
  selectedDayEarning: number;
  selectedWeekAppointments: Appointment[];
  selectedWeekOriginalTotal: number;
  selectedWeekEarning: number;
}) {
  const isTodaySelected = sameLocalDate(selectedDate, new Date());

  return (
    <div className="space-y-4 lg:space-y-7">
      <section className="grid gap-3 md:grid-cols-2 lg:gap-4 xl:grid-cols-4">
        <EarningSummaryCard
          title="Today's Earning"
          context="Today"
          amount={todayEarning}
          originalTotal={todayOriginalTotal}
          appointmentsCount={todayAppointments.length}
          loading={loading}
          featured={isTodaySelected}
        />
        <EarningSummaryCard
          title="Weekly Earning"
          context="Selected week"
          amount={selectedWeekEarning}
          originalTotal={selectedWeekOriginalTotal}
          appointmentsCount={selectedWeekAppointments.length}
          loading={loading}
        />
        <EarningSummaryCard
          title="Selected Date"
          context={selectedDateLabel}
          amount={selectedDayEarning}
          originalTotal={selectedDayOriginalTotal}
          appointmentsCount={selectedDayAppointments.length}
          loading={loading}
        />
        <EarningSummaryCard
          title={getEarningTitle(selectedDate, scheduleMode)}
          context={formatEarningContext(selectedDate, scheduleMode)}
          amount={estimatedEarning}
          originalTotal={originalServiceTotal}
          appointmentsCount={visibleAppointments.length}
          loading={loading}
        />
      </section>

      <section className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm lg:rounded-2xl lg:p-7 lg:shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-950 lg:text-lg">Earning summary</h2>
            <p className="mt-1 text-sm text-gray-500">Employee earning is calculated as 50% of assigned service total.</p>
          </div>
          <p className="text-sm font-medium text-gray-500">{visibleAppointments.length} appointment{visibleAppointments.length === 1 ? '' : 's'} in current view</p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3 lg:gap-4">
          <div className="rounded-2xl bg-gray-50 p-4 lg:p-5">
            <p className="text-sm font-medium text-gray-500">Current view earning</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">{formatCurrency(estimatedEarning)}</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4 lg:p-5">
            <p className="text-sm font-medium text-gray-500">Original service total</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">{formatCurrency(originalServiceTotal)}</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4 lg:p-5">
            <p className="text-sm font-medium text-gray-500">Completed</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">
              {visibleAppointments.filter((appt) => appt.status === 'completed').length}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfilePanel({
  employeeName,
  role,
  business,
  employee,
}: {
  employeeName: string;
  role: string;
  business: BusinessInfo | null;
  employee: EmployeeInfo | null;
}) {
  return (
    <section className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm lg:max-w-3xl lg:rounded-2xl lg:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-950 text-sm font-semibold text-white">
          {getInitials(employeeName)}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-gray-950">{employeeName}</h2>
          <p className="text-sm text-gray-500">{role}</p>
        </div>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <ProfileInfo label="Business" value={business?.name || 'Business'} />
        <ProfileInfo label="Timezone" value={business?.timezone || 'Unavailable'} />
        {employee?.email && <ProfileInfo label="Email" value={employee.email} />}
        {employee?.phone && <ProfileInfo label="Phone" value={employee.phone} />}
        {business?.phone && <ProfileInfo label="Business phone" value={business.phone} />}
        {business?.address && <ProfileInfo label="Address" value={business.address} />}
      </dl>
    </section>
  );
}

function ProfileInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-gray-800">{value}</dd>
    </div>
  );
}

function EarningSummaryCard({
  title,
  context,
  amount,
  originalTotal,
  appointmentsCount,
  loading,
  featured = false,
}: {
  title: string;
  context: string;
  amount: number;
  originalTotal: number;
  appointmentsCount: number;
  loading: boolean;
  featured?: boolean;
}) {
  return (
    <div className={`rounded-[24px] border p-4 shadow-sm lg:rounded-2xl lg:p-5 lg:shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${featured ? 'border-gray-300 bg-gray-100' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-950">{title}</p>
          <p className="mt-1 text-xs font-medium text-gray-500">{context}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700">
          <DollarSign size={18} />
        </span>
      </div>
      {loading ? (
        <div className="mt-4 h-8 w-24 animate-pulse rounded-full bg-gray-200/80" />
      ) : (
        <p className="mt-4 text-3xl font-semibold tracking-tight text-gray-950 lg:text-[1.85rem]">{formatCurrency(amount)}</p>
      )}
      <div className="mt-3 space-y-1 text-xs text-gray-500">
        <p>Service total {formatCurrency(originalTotal)}</p>
        <p>{appointmentsCount} appointment{appointmentsCount === 1 ? '' : 's'}</p>
      </div>
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
    'inline-flex h-11 flex-1 items-center justify-center rounded-full border px-3 text-sm font-semibold transition-colors active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 lg:h-10 lg:flex-none lg:px-5';
  const navButtonClass =
    'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 lg:h-10 lg:w-10 lg:shadow-none';

  return (
    <section className="rounded-[24px] border border-gray-200 bg-white p-3 shadow-sm lg:rounded-2xl lg:p-4 lg:shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="space-y-3 lg:space-y-4">
        <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center">
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

        <div className="flex min-w-0 items-center gap-2 lg:gap-2.5">
          <button type="button" onClick={onPrevious} disabled={loading} className={navButtonClass} aria-label="Previous schedule period">
            <ChevronLeft size={18} />
          </button>

          <label className="relative flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-950 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100 focus-within:ring-2 focus-within:ring-gray-900/10 lg:h-10 lg:px-4 lg:shadow-none">
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
    </section>
  );
}

function AppointmentRow({
  appt,
  employeeName,
  updatingId,
  updateStatus,
  showDate = false,
}: {
  appt: Appointment;
  employeeName: string;
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
    <article className={`px-4 py-4 transition-colors lg:px-6 lg:py-4 ${isClosed ? 'bg-gray-50/70' : 'bg-white lg:hover:bg-gray-50/60'}`}>
      <button
        type="button"
        onClick={() => setDetailsOpen((open) => !open)}
        aria-expanded={detailsOpen}
        className="block w-full rounded-2xl text-left transition-colors active:bg-gray-50"
      >
        <div className="flex items-start gap-3 lg:grid lg:grid-cols-[96px_minmax(0,1fr)_110px_104px_120px] lg:items-center lg:gap-5">
          <div className="w-16 shrink-0 lg:w-auto">
            <p className="text-lg font-semibold tracking-tight text-gray-950">{formatTime(appt.start_time)}</p>
            {showDate && <p className="mt-0.5 text-xs font-medium text-gray-500">{formatShortDate(appt.start_time)}</p>}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2 lg:block">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-gray-950">{appt.customer_name || 'Customer'}</h3>
                <p className="mt-1 truncate text-sm font-medium text-gray-700">{serviceNames}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold lg:hidden ${statusClasses[appt.status]}`}>
                {statusLabels[appt.status]}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} className="shrink-0 text-gray-400" />
                {totalDuration} min
              </span>
              <span className="truncate">Assigned to {employeeName}</span>
            </div>
          </div>

          <span className={`hidden w-fit shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold lg:inline-flex ${statusClasses[appt.status]}`}>
            {statusLabels[appt.status]}
          </span>
          <span className="hidden text-sm font-medium text-gray-600 lg:inline-flex">{totalDuration} min</span>
          <span className="hidden text-sm font-semibold text-gray-950 lg:inline-flex">{formatCurrency(employeeEstimate)}</span>
        </div>
      </button>

      {detailsOpen && (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-3 lg:ml-[116px] lg:p-4">
          <div className="grid grid-cols-2 gap-2 lg:max-w-lg">
            <div className="rounded-2xl bg-white px-3 py-2">
              <p className="text-xs font-medium text-gray-500">Service total</p>
              <p className="mt-1 text-base font-semibold text-gray-950">{formatCurrency(serviceTotal)}</p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-2">
              <p className="text-xs font-medium text-gray-500">Your earning</p>
              <p className="mt-1 text-base font-semibold text-gray-950">{formatCurrency(employeeEstimate)}</p>
            </div>
          </div>

          <div className="mt-3 space-y-2 lg:max-w-2xl">
            {hasServiceLines ? (
              appt.services.map((service, index) => {
                const price = getServicePrice(service);

                return (
                  <div
                    key={`${service.id}-${index}`}
                    className="rounded-2xl bg-white px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-gray-900">{service.name || 'Service'}</p>
                    <p className="mt-0.5 text-gray-500">
                      {formatCurrency(price)} original · {formatCurrency(price / 2)} earning
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="rounded-2xl bg-white px-3 py-2 text-sm text-gray-500">Price unavailable for this appointment.</p>
            )}
          </div>

          <div className="mt-3 space-y-2 text-sm text-gray-600">
            <p className="inline-flex min-w-0 items-center gap-2">
              <Phone size={15} className="shrink-0 text-gray-400" />
              <span className="truncate">{appt.customer_phone || 'No phone on file'}</span>
            </p>
            {appt.customer_email && <p className="truncate">{appt.customer_email}</p>}
          </div>

          {appt.notes && <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">{appt.notes}</p>}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 lg:ml-[116px] lg:max-w-xs">
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
    <div className="min-h-dvh bg-[#f6f7f8]">
      <header className="border-b border-gray-200/80 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:max-w-7xl lg:px-10 xl:px-12">
          <div className="space-y-2">
            <div className="h-3 w-28 animate-pulse rounded-full bg-gray-100" />
            <div className="h-6 w-36 animate-pulse rounded-full bg-gray-100" />
          </div>
          <div className="h-11 w-24 animate-pulse rounded-full bg-gray-100" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:max-w-7xl lg:px-10 xl:px-12">
        <div className="space-y-4 lg:space-y-7">
          <div className="h-28 animate-pulse rounded-[24px] border border-gray-200 bg-white lg:h-32 lg:rounded-2xl" />
          <div className="h-32 animate-pulse rounded-[24px] border border-gray-200 bg-white lg:h-12 lg:w-96 lg:rounded-full" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <div className="h-40 animate-pulse rounded-[24px] border border-gray-200 bg-white" />
            <div className="h-40 animate-pulse rounded-[24px] border border-gray-200 bg-white" />
            <div className="hidden h-40 animate-pulse rounded-2xl border border-gray-200 bg-white lg:block" />
            <div className="hidden h-40 animate-pulse rounded-2xl border border-gray-200 bg-white lg:block" />
          </div>
          <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-white lg:rounded-2xl">
            <ScheduleSkeleton />
          </div>
        </div>
      </main>
    </div>
  );
}
