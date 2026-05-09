'use client';

import { useEffect, useMemo, useRef } from 'react';

interface Appointment {
  id: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  assigned_employee_id: string | null;
  start_time: string;
  end_time: string;
  staff: { id: string; first_name: string; last_name: string } | null;
  appointment_services: {
    service: { id: string; name: string; duration_mins: number; price: number };
  }[];
}

interface WeekCalendarProps {
  appointments: Appointment[];
  view: 'day' | 'fiveDay' | 'week' | 'month';
  anchorDate: Date;
  selectedDate?: Date;
  displayMode: 'combined' | 'onlyMe' | 'sideBySide';
  staffMembers: { id: string; first_name: string; last_name: string }[];
  onDateSelect?: (date: Date) => void;
  onAppointmentClick: (appt: Appointment) => void;
}

const START_HOUR  = 0;
const END_HOUR    = 24;
const HOUR_HEIGHT = 72;
const GRID_OFFSET = 8;
const TIME_COLUMN_WIDTH = 62;
const DEFAULT_SCROLL_HOUR = 6;
const GRID_BORDER = '#d8dde3';
const GRID_MINOR_BORDER = '#edf0f3';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STAFF_COLOR_PALETTE = [
  { bg: '#FBE4E6', border: '#E7A8AF', text: '#7A2E36', accent: '#C96573' },
  { bg: '#E4F1FB', border: '#A6CBE7', text: '#224F73', accent: '#5F9BCA' },
  { bg: '#E6F6EE', border: '#A8D7BE', text: '#24563C', accent: '#60A77D' },
  { bg: '#F8EEDC', border: '#E4CA96', text: '#755323', accent: '#C99D52' },
  { bg: '#EFE8FB', border: '#CBB7E8', text: '#563A7D', accent: '#8B69BE' },
  { bg: '#E7F4F4', border: '#A9D3D3', text: '#245C5C', accent: '#5EA0A0' },
  { bg: '#F8E5F0', border: '#E0B6CF', text: '#7A335E', accent: '#C16D9D' },
  { bg: '#EEEEDF', border: '#D3D3A0', text: '#5C5C28', accent: '#A6A652' },
] as const;

function formatHour(h: number) {
  const hour = h % 24;
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

/** Local-date key for equality comparison — never uses UTC/toISOString. */
function formatLocalDateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
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

function startOfMonth(date: Date) {
  const d = startOfLocalDay(date);
  d.setDate(1);
  return d;
}

function endOfMonth(date: Date) {
  const d = startOfLocalDay(date);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

function endOfWeek(date: Date) {
  return addDays(startOfWeek(date), 6);
}

function hashStaffId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getStaffTone(staffId: string | null | undefined) {
  if (!staffId) {
    return { bg: '#F3F4F6', border: '#D1D5DB', text: '#4B5563', accent: '#9CA3AF' };
  }
  return STAFF_COLOR_PALETTE[hashStaffId(staffId) % STAFF_COLOR_PALETTE.length];
}

function formatStaffName(staff: Appointment['staff']) {
  return staff ? `${staff.first_name} ${staff.last_name}`.trim() : 'Unassigned';
}

function formatStaffInitials(staff: Appointment['staff']) {
  if (!staff) return 'UN';
  const first = staff.first_name?.[0] ?? '';
  const last = staff.last_name?.[0] ?? '';
  return `${first}${last}`.trim() || first || 'UN';
}

function renderTimedAppointmentCard(
  appt: Appointment,
  top: number,
  height: number,
  onAppointmentClick: (appt: Appointment) => void
) {
  const services = appt.appointment_services.map(s => s.service.name).join(', ');
  const startLabel = new Date(appt.start_time).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
  const endLabel = new Date(appt.end_time).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
  const tone = getStaffTone(appt.staff?.id ?? appt.assigned_employee_id);
  const tooltip = `${appt.customer_name} • ${services || 'No services'} • ${startLabel} - ${endLabel}`;
  const statusTone = appt.status === 'cancelled' || appt.status === 'no_show' ? 'opacity-65' : '';

  return (
    <button
      key={appt.id}
      onClick={() => onAppointmentClick(appt)}
      title={tooltip}
      className={`absolute left-2 right-2 overflow-hidden rounded-lg border px-2 py-1.5 text-left shadow-sm transition-transform hover:-translate-y-px ${statusTone}`}
      style={{
        top,
        height,
        minHeight: 40,
        backgroundColor: tone.bg,
        borderColor: tone.border,
        color: tone.text,
        boxShadow: `inset 3px 0 0 ${tone.accent}`,
      }}
    >
      <div className="flex h-full min-h-0 flex-col justify-center gap-0.5 overflow-hidden">
        <p className="truncate whitespace-nowrap text-[13px] font-semibold leading-tight">
          {appt.customer_name}
        </p>
        <p className="truncate whitespace-nowrap text-[12px] font-medium leading-tight opacity-95">
          {startLabel} – {endLabel}
        </p>
        {services && (
          <p className="truncate whitespace-nowrap text-[11px] leading-tight opacity-85">
            {services}
          </p>
        )}
        </div>
    </button>
  );
}

export default function WeekCalendar({
  appointments,
  view,
  anchorDate,
  selectedDate,
  displayMode,
  staffMembers,
  onDateSelect,
  onAppointmentClick,
}: WeekCalendarProps) {
  const sideBySideScrollRef = useRef<HTMLDivElement | null>(null);
  const scheduleScrollRef = useRef<HTMLDivElement | null>(null);
  const todayKey = useMemo(() => formatLocalDateKey(new Date()), []);
  const selectedDayKey = formatLocalDateKey(selectedDate ?? anchorDate);

  const visibleDays = useMemo(() => {
    const anchor = startOfLocalDay(anchorDate);

    if (view === 'day') return [anchor];
    if (view === 'fiveDay') return Array.from({ length: 5 }, (_, i) => addDays(anchor, i));
    if (view === 'week') {
      const start = startOfWeek(anchor);
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }

    return [];
  }, [anchorDate, view]);

  const visibleDayKeys = useMemo(
    () => visibleDays.map(formatLocalDateKey),
    [visibleDays]
  );
  const visibleRangeKey = visibleDayKeys.join('|');

  useEffect(() => {
    if (view === 'month') return;

    const scrollContainer =
      displayMode === 'sideBySide'
        ? sideBySideScrollRef.current
        : scheduleScrollRef.current;

    if (!scrollContainer) return;

    scrollContainer.scrollTop = Math.max(
      0,
      (DEFAULT_SCROLL_HOUR - START_HOUR) * HOUR_HEIGHT
    );
  }, [displayMode, view, visibleRangeKey]);

  const dayStripDates = useMemo(() => {
    if (view !== 'day') return [];

    const start = startOfWeek(selectedDate ?? anchorDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [anchorDate, selectedDate, view]);

  const hours = useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i),
    []
  );
  const halfHours = useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i + 0.5),
    []
  );

  const apptsByDay = useMemo(() => {
    const map: Record<number, Appointment[]> = {};
    visibleDays.forEach((_, i) => { map[i] = []; });

    appointments.forEach(appt => {
      const colIdx = visibleDayKeys.indexOf(formatLocalDateKey(new Date(appt.start_time)));
      if (colIdx >= 0) map[colIdx].push(appt);
    });

    return map;
  }, [appointments, visibleDayKeys, visibleDays]);

  const monthDays = useMemo(() => {
    if (view !== 'month') return [];

    const monthStart = startOfMonth(anchorDate);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(endOfMonth(anchorDate));
    const days: Date[] = [];

    for (let d = new Date(gridStart); d <= gridEnd; d = addDays(d, 1)) {
      days.push(new Date(d));
    }

    return days;
  }, [anchorDate, view]);

  const monthAppointmentsByDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    if (view !== 'month') return map;

    appointments.forEach(appt => {
      const key = formatLocalDateKey(new Date(appt.start_time));
      if (!map[key]) map[key] = [];
      map[key].push(appt);
    });

    return map;
  }, [appointments, view]);

  const sideBySideStaff = useMemo(() => {
    if (displayMode !== 'sideBySide') return [];

    const map = new Map<string, { id: string; first_name: string; last_name: string }>();
    staffMembers.forEach(staff => {
      if (!map.has(staff.id)) map.set(staff.id, staff);
    });

    appointments.forEach(appt => {
      if (appt.staff && !map.has(appt.staff.id)) {
        map.set(appt.staff.id, appt.staff);
      }
    });

    return Array.from(map.values());
  }, [appointments, displayMode, staffMembers]);

  const hasUnassigned = useMemo(
    () => displayMode === 'sideBySide' && appointments.some(appt => !appt.assigned_employee_id),
    [appointments, displayMode]
  );

  function apptTop(appt: Appointment): number {
    const d = new Date(appt.start_time);
    return Math.max(0, (d.getHours() - START_HOUR) * 60 + d.getMinutes()) * (HOUR_HEIGHT / 60) + GRID_OFFSET;
  }

  function apptHeight(appt: Appointment): number {
    const start = new Date(appt.start_time).getTime();
    const end   = appt.end_time
      ? new Date(appt.end_time).getTime()
      : start + 60 * 60 * 1000;
    return Math.max(15, (end - start) / 60000) * (HOUR_HEIGHT / 60);
  }

  const gridHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT + GRID_OFFSET + 40;
  const gridMinWidth = Math.max(640, TIME_COLUMN_WIDTH + visibleDays.length * 180);
  const sideBySideLanes = [...sideBySideStaff, ...(hasUnassigned ? [{ id: '__unassigned__', first_name: 'Unassigned', last_name: '' }] : [])];
  const sideBySideMinWidth = Math.max(780, TIME_COLUMN_WIDTH + visibleDays.length * Math.max(220, sideBySideLanes.length * 120));
  const isMonthView = view === 'month';
  const monthMonth = startOfMonth(anchorDate);
  const showDayStrip = view === 'day' && displayMode !== 'sideBySide';
  const dayStrip = dayStripDates.length > 0 ? (
    <div className="shrink-0 overflow-x-auto border-b border-[#d8dde3] bg-white">
      <div className="flex min-w-max gap-1 px-3 py-1 sm:px-4">
        {dayStripDates.map(date => {
          const dateKey = formatLocalDateKey(date);
          const isSelected = dateKey === selectedDayKey;
          const isToday = dateKey === todayKey;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onDateSelect?.(startOfLocalDay(date))}
              className={`flex min-w-[64px] flex-col items-center rounded-md border px-3 py-1 text-center transition-colors ${
                isSelected
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-[#d8dde3] bg-white text-slate-700 hover:bg-gray-50'
              }`}
              aria-pressed={isSelected}
            >
              <span className={`text-[11px] font-medium uppercase tracking-[0.08em] ${isSelected ? 'text-white/70' : 'text-slate-600'}`}>
                {DAY_NAMES[date.getDay()]}
              </span>
              <span className="mt-0.5 text-[17px] font-semibold leading-none">
                {date.getDate()}
              </span>
              {isToday && (
                <span className={`mt-1 h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-gray-900'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      {!isMonthView && (
        <>
          {showDayStrip ? dayStrip : null}

          <div className="divide-y divide-gray-100 overflow-y-auto sm:hidden">
            {visibleDays.map((day, dayIdx) => {
              const dayAppts = apptsByDay[dayIdx] || [];
              const isToday = visibleDayKeys[dayIdx] === todayKey;

              return (
                <section key={dayIdx} className={isToday ? 'bg-blue-50/50' : undefined}>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className={`text-[12px] font-semibold uppercase tracking-wide ${isToday ? 'text-blue-600' : 'text-slate-600'}`}>
                        {DAY_NAMES[day.getDay()]}
                      </p>
                      <p className="text-[16px] font-semibold text-gray-900">
                        {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-gray-200">
                      {dayAppts.length} {dayAppts.length === 1 ? 'booking' : 'bookings'}
                    </span>
                  </div>

                  <div className="space-y-2 px-4 pb-4">
                    {dayAppts.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-4 text-center text-[13px] text-slate-500">
                        No appointments
                      </p>
                    ) : dayAppts.map(appt => {
                      const services = appt.appointment_services.map(s => s.service.name).join(', ');
                      const staff = formatStaffName(appt.staff);
                      const tone = getStaffTone(appt.staff?.id ?? appt.assigned_employee_id);
                      const timeRange = `${new Date(appt.start_time).toLocaleTimeString('en-US', {
                        hour: 'numeric', minute: '2-digit', hour12: true,
                      })} - ${new Date(appt.end_time).toLocaleTimeString('en-US', {
                        hour: 'numeric', minute: '2-digit', hour12: true,
                      })}`;

                      return (
                        <button
                          key={appt.id}
                          type="button"
                          onClick={() => onAppointmentClick(appt)}
                          className="w-full rounded-xl border p-3.5 text-left transition-colors hover:brightness-[0.98]"
                          style={{
                            backgroundColor: tone.bg,
                            borderColor: tone.border,
                            color: tone.text,
                            boxShadow: `inset 3px 0 0 ${tone.accent}`,
                          }}
                          title={`${appt.customer_name} • ${services || 'No services'} • ${staff} • ${timeRange}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[15px] font-semibold">{appt.customer_name}</p>
                              <p className="mt-1 text-[12px] font-medium opacity-80">{timeRange}</p>
                            </div>
                            <span
                              className="rounded-full px-2 py-1 text-[11px] font-medium"
                              style={{ backgroundColor: tone.accent, color: '#fff' }}
                            >
                              {formatStaffInitials(appt.staff)}
                            </span>
                          </div>
                          {services && <p className="mt-2 truncate text-[13px] opacity-85">{services}</p>}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {displayMode === 'sideBySide' ? (
            <div className="hidden min-h-0 flex-1 overflow-x-auto overflow-y-hidden bg-white sm:block">
              {sideBySideLanes.length === 0 ? (
                <div className="flex h-full items-center justify-center px-6 py-20 text-center">
                  <div className="max-w-sm">
                    <p className="text-[16px] font-semibold text-gray-900">No staff members found</p>
                    <p className="mt-1 text-[13px] text-slate-600">Add staff members to use the side-by-side schedule view.</p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-0 flex-col" style={{ minWidth: sideBySideMinWidth }}>
                  {view !== 'day' && (
                    <div className="z-20 flex shrink-0 border-b border-[#d8dde3] bg-white">
                      <div className="sticky left-0 z-30 shrink-0 bg-white" style={{ width: TIME_COLUMN_WIDTH }} />
                      {visibleDays.map((day, i) => {
                        const isToday = visibleDayKeys[i] === todayKey;
                        return (
                          <div
                            key={i}
                            className="flex-1 min-w-0 border-l border-[#d8dde3] px-2 py-1.5 text-center bg-white"
                          >
                            <p className={`text-[14px] font-semibold leading-none ${isToday ? 'text-gray-900' : 'text-slate-600'}`}>
                              {DAY_NAMES[day.getDay()]} {String(day.getMonth() + 1).padStart(2, '0')}/{String(day.getDate()).padStart(2, '0')}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="z-20 flex shrink-0 border-b border-[#d8dde3] bg-white">
                    <div className="sticky left-0 z-30 shrink-0 bg-white" style={{ width: TIME_COLUMN_WIDTH }} />
                    {visibleDays.map((day, dayIdx) => {
                      const isToday = visibleDayKeys[dayIdx] === todayKey;
                      return (
                        <div
                          key={dayIdx}
                          className="min-w-0 flex-1 border-l bg-white"
                          style={{ borderColor: GRID_BORDER }}
                        >
                          <div
                            className="grid text-center"
                            style={{ gridTemplateColumns: `repeat(${sideBySideLanes.length}, minmax(0, 1fr))` }}
                          >
                            {sideBySideLanes.map(lane => (
                                <div key={lane.id} className="min-w-0 border-l px-3 py-2 text-[14px] font-semibold text-[#313842] first:border-l-0" style={{ borderColor: GRID_BORDER }}>
                                  <p className="truncate whitespace-nowrap">
                                    {lane.id === '__unassigned__' ? 'Unassigned' : `${lane.first_name} ${lane.last_name}`}
                                  </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div ref={sideBySideScrollRef} className="min-h-0 flex-1 overflow-y-auto pb-8">
                    <div className="flex">
                      <div className="sticky left-0 z-10 shrink-0 bg-white" style={{ width: TIME_COLUMN_WIDTH, height: gridHeight }}>
                        {hours.map(h => (
                          <div
                            key={h}
                            className="absolute left-0 right-0 flex items-start justify-end border-t pr-2.5"
                            style={{ top: (h - START_HOUR) * HOUR_HEIGHT + GRID_OFFSET, height: HOUR_HEIGHT, borderColor: GRID_BORDER }}
                          >
                            <span className="translate-y-[6px]">
                              <span className="inline-block bg-white px-1 text-[13px] font-medium leading-none text-[#5f6b7a]">
                                {formatHour(h)}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>

                      {visibleDays.map((day, dayIdx) => {
                        const isToday = visibleDayKeys[dayIdx] === todayKey;
                        const dayAppts = apptsByDay[dayIdx] || [];

                        return (
                          <div
                            key={dayIdx}
                            className={`relative flex-1 min-w-0 border-l ${isToday ? 'bg-sky-50/40' : 'bg-white'}`}
                            style={{ height: gridHeight, borderColor: GRID_BORDER }}
                          >
                            <div className="flex h-full">
                              {sideBySideLanes.map((lane, laneIdx) => {
                                const laneAppointments = dayAppts.filter(appt => {
                                  if (lane.id === '__unassigned__') return !appt.assigned_employee_id;
                                  return appt.assigned_employee_id === lane.id;
                                });

                                return (
                                  <div
                                    key={lane.id}
                                    className="relative min-w-0 flex-1 border-l first:border-l-0"
                                    style={{ borderColor: GRID_BORDER }}
                                  >
                                    {halfHours.map(h => (
                                      <div
                                        key={h}
                                        className="absolute left-0 right-0 border-t"
                                        style={{ top: (h - START_HOUR) * HOUR_HEIGHT + GRID_OFFSET, borderColor: GRID_MINOR_BORDER }}
                                      />
                                    ))}
                                    {hours.map(h => (
                                      <div
                                        key={h}
                                        className="absolute left-0 right-0 border-t"
                                        style={{ top: (h - START_HOUR) * HOUR_HEIGHT + GRID_OFFSET, borderColor: GRID_BORDER }}
                                      />
                                    ))}

                                    {laneAppointments.map(appt => {
                                      const top = apptTop(appt);
                                      const height = Math.max(apptHeight(appt), 34);
                                      return renderTimedAppointmentCard(appt, top, height, onAppointmentClick);
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
          <div className="hidden min-h-0 flex-1 overflow-x-auto overflow-y-hidden bg-white sm:block">
              <div className="flex h-full min-h-0 flex-col" style={{ minWidth: gridMinWidth }}>
                {view !== 'day' && (
                  <div className="sticky top-0 z-20 flex border-b border-[#d8dde3] bg-white">
                    <div className="sticky left-0 z-30 shrink-0 bg-white" style={{ width: TIME_COLUMN_WIDTH }} />
                    {visibleDays.map((day, i) => {
                      const isToday = visibleDayKeys[i] === todayKey;
                      return (
                        <div
                          key={i}
                          className="flex-1 min-w-0 border-l border-[#d8dde3] px-2 py-1.5 text-center bg-white"
                        >
                          <p className={`text-[14px] font-semibold leading-none ${isToday ? 'text-gray-900' : 'text-slate-600'}`}>
                            {DAY_NAMES[day.getDay()]} {String(day.getMonth() + 1).padStart(2, '0')}/{String(day.getDate()).padStart(2, '0')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div ref={scheduleScrollRef} className="min-h-0 flex-1 overflow-y-auto pb-8">
                  <div className="flex">
                    <div className="sticky left-0 z-10 shrink-0 bg-white" style={{ width: TIME_COLUMN_WIDTH, height: gridHeight }}>
                      {hours.map(h => (
                        <div
                          key={h}
                          className="absolute left-0 right-0 flex items-start justify-end border-t pr-2.5"
                          style={{ top: (h - START_HOUR) * HOUR_HEIGHT + GRID_OFFSET, height: HOUR_HEIGHT, borderColor: GRID_BORDER }}
                        >
                          <span className="translate-y-[6px]">
                            <span className="inline-block bg-white px-1 text-[13px] font-medium leading-none text-[#5f6b7a]">
                              {formatHour(h)}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>

                    {visibleDays.map((_, dayIdx) => {
                      const isToday  = visibleDayKeys[dayIdx] === todayKey;
                      const dayAppts = apptsByDay[dayIdx] || [];

                      return (
                        <div
                          key={dayIdx}
                          className={`relative flex-1 min-w-0 border-l ${isToday ? 'bg-sky-50/40' : 'bg-white'}`}
                          style={{ height: gridHeight, borderColor: GRID_BORDER }}
                        >
                          {halfHours.map(h => (
                            <div
                              key={h}
                              className="absolute left-0 right-0 border-t"
                              style={{ top: (h - START_HOUR) * HOUR_HEIGHT + GRID_OFFSET, borderColor: GRID_MINOR_BORDER }}
                            />
                          ))}
                          {hours.map(h => (
                            <div
                              key={h}
                              className="absolute left-0 right-0 border-t"
                              style={{ top: (h - START_HOUR) * HOUR_HEIGHT + GRID_OFFSET, borderColor: GRID_BORDER }}
                            />
                          ))}

                          {dayAppts.map(appt => {
                            const top        = apptTop(appt);
                            const height     = Math.max(apptHeight(appt), 34);
                            return renderTimedAppointmentCard(appt, top, height, onAppointmentClick);
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {isMonthView && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="sticky top-0 z-20 grid grid-cols-7 border-b border-gray-200 bg-white">
            {DAY_NAMES.map(day => (
              <div key={day} className="px-2 py-2 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-slate-600">
                {day}
              </div>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <div className="grid grid-cols-7 auto-rows-[minmax(82px,1fr)] sm:auto-rows-[minmax(104px,1fr)]">
              {monthDays.map(day => {
                const dayKey = formatLocalDateKey(day);
                const inMonth = day.getMonth() === monthMonth.getMonth();
                const dayAppts = monthAppointmentsByDay[dayKey] || [];
                const isToday = dayKey === todayKey;

                return (
                  <div
                    key={dayKey}
                    className={`border-l border-b border-gray-200 p-1.5 ${inMonth ? 'bg-white' : 'bg-gray-50 text-slate-500'}`}
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <span className={`text-[12px] font-semibold ${isToday ? 'text-gray-900' : inMonth ? 'text-gray-900' : 'text-slate-500'}`}>
                        {day.getDate()}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {dayAppts.length ? `${dayAppts.length}` : ''}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {dayAppts.slice(0, 2).map(appt => {
                        const staff = formatStaffName(appt.staff);
                        const time = new Date(appt.start_time).toLocaleTimeString('en-US', {
                          hour: 'numeric', minute: '2-digit', hour12: true,
                        });
                        const tone = getStaffTone(appt.staff?.id ?? appt.assigned_employee_id);

                        return (
                          <button
                            key={appt.id}
                            type="button"
                            onClick={() => onAppointmentClick(appt)}
                            title={`${appt.customer_name} • ${staff} • ${time}`}
                            className="w-full rounded-md border px-2 py-1 text-left text-[11px] font-medium leading-tight shadow-sm transition-colors hover:brightness-[0.98]"
                            style={{
                              backgroundColor: tone.bg,
                              borderColor: tone.border,
                              color: tone.text,
                              boxShadow: `inset 3px 0 0 ${tone.accent}`,
                            }}
                          >
                            <p className="truncate whitespace-nowrap">{time}</p>
                            <p className="truncate whitespace-nowrap">{appt.customer_name}</p>
                          </button>
                        );
                      })}

                      {dayAppts.length > 2 && (
                        <p className="px-1 text-[11px] font-medium text-slate-600">
                          +{dayAppts.length - 2} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
