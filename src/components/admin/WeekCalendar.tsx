'use client';

import { useMemo } from 'react';

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
  weekStart: Date;
  onAppointmentClick: (appt: Appointment) => void;
}

const START_HOUR  = 6;
const END_HOUR    = 21;
const HOUR_HEIGHT = 64;
const GRID_OFFSET = 16;

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-500 hover:bg-blue-600 text-white',
  completed: 'bg-gray-400 hover:bg-gray-500 text-white',
  cancelled: 'bg-red-400 hover:bg-red-500 text-white',
  no_show:   'bg-orange-400 hover:bg-orange-500 text-white',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatHour(h: number) {
  if (h === 0)  return '12 AM';
  if (h < 12)   return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

/** Local-date key for equality comparison — never uses UTC/toISOString. */
function formatLocalDateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function WeekCalendar({
  appointments,
  weekStart,
  onAppointmentClick,
}: WeekCalendarProps) {

  const todayKey = useMemo(() => formatLocalDateKey(new Date()), []);

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      }),
    [weekStart]
  );

  const weekDayKeys = useMemo(
    () => weekDays.map(formatLocalDateKey),
    [weekDays]
  );

  const hours = useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i),
    []
  );

  const apptsByDay = useMemo(() => {
    const map: Record<number, Appointment[]> = {};
    for (let i = 0; i < 7; i++) map[i] = [];

    appointments.forEach(appt => {
      const colIdx = weekDayKeys.indexOf(formatLocalDateKey(new Date(appt.start_time)));
      if (colIdx >= 0) map[colIdx].push(appt);
    });

    return map;
  }, [appointments, weekDayKeys]);

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

  const gridHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT + GRID_OFFSET + 20;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">

      {/* Day header row */}
      <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        <div className="w-14 shrink-0" />
        {weekDays.map((day, i) => {
          const isToday = weekDayKeys[i] === todayKey;
          return (
            <div
              key={i}
              className={`flex-1 min-w-0 text-center py-2 border-l border-gray-200 ${isToday ? 'bg-blue-50' : ''}`}
            >
              <p className={`text-[11px] font-medium uppercase tracking-wide ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                {DAY_NAMES[day.getDay()]}
              </p>
              <p className={`text-[15px] font-semibold mt-0.5 leading-none ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                {day.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Scrollable grid */}
      <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
        <div className="flex">

          {/* Time gutter */}
          <div className="w-14 shrink-0 relative" style={{ height: gridHeight }}>
            {hours.map(h => (
              <div
                key={h}
                className="absolute left-0 right-0 flex items-start justify-end pr-2"
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT + GRID_OFFSET - 8, height: HOUR_HEIGHT }}
              >
                <span className="text-[11px] text-gray-400 font-medium leading-none">
                  {formatHour(h)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((_, dayIdx) => {
            const isToday  = weekDayKeys[dayIdx] === todayKey;
            const dayAppts = apptsByDay[dayIdx] || [];

            return (
              <div
                key={dayIdx}
                className={`flex-1 min-w-0 relative border-l border-gray-200 ${isToday ? 'bg-blue-50/30' : ''}`}
                style={{ height: gridHeight }}
              >
                {hours.map(h => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-gray-100"
                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT + GRID_OFFSET }}
                  />
                ))}

                {dayAppts.map(appt => {
                  const top        = apptTop(appt);
                  const height     = Math.max(apptHeight(appt), 22);
                  const colorClass = STATUS_COLORS[appt.status] || 'bg-blue-500 text-white';
                  const services   = appt.appointment_services.map(s => s.service.name).join(', ');
                  const staff      = appt.staff
                    ? `${appt.staff.first_name} ${appt.staff.last_name}`
                    : null;
                  const startLabel = new Date(appt.start_time).toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit', hour12: true,
                  });

                  return (
                    <button
                      key={appt.id}
                      onClick={() => onAppointmentClick(appt)}
                      className={`absolute left-1 right-1 rounded-md px-1.5 py-1 text-left overflow-hidden ${colorClass} shadow-sm hover:opacity-90 transition-opacity`}
                      style={{ top, height }}
                    >
                      <p className="text-[11px] font-semibold leading-tight truncate">
                        {startLabel}
                      </p>
                      <p className="text-[11px] leading-tight truncate mt-0.5 font-medium">
                        {appt.customer_name}
                      </p>
                      {height >= 48 && services && (
                        <p className="text-[10px] leading-tight truncate opacity-80 mt-0.5">
                          {services}
                        </p>
                      )}
                      {height >= 64 && staff && (
                        <p className="text-[10px] leading-tight truncate opacity-70 mt-0.5">
                          {staff}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
