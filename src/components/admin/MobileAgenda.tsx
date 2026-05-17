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

interface MobileAgendaProps {
  appointments: Appointment[];
  loading: boolean;
  onAppointmentClick: (appt: Appointment) => void;
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
  pending: 'Pending',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: '#DCFCE7', text: '#15803D' },
  completed: { bg: '#F3F4F6', text: '#6B7280' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626' },
  no_show: { bg: '#FEE2E2', text: '#DC2626' },
  pending: { bg: '#FEF9C3', text: '#92400E' },
};

const STAFF_PALETTE = [
  { accent: '#C96573' },
  { accent: '#5F9BCA' },
  { accent: '#60A77D' },
  { accent: '#C99D52' },
  { accent: '#8B69BE' },
  { accent: '#5EA0A0' },
  { accent: '#C16D9D' },
  { accent: '#A6A652' },
] as const;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function hashId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function staffAccent(staffId: string | null | undefined): string {
  if (!staffId) return '#9CA3AF';
  return STAFF_PALETTE[hashId(staffId) % STAFF_PALETTE.length].accent;
}

function localDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function sectionLabel(key: string, todayKey: string, tomorrowKey: string) {
  if (key === todayKey) return 'Today';
  if (key === tomorrowKey) return 'Tomorrow';
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export default function MobileAgenda({ appointments, loading, onAppointmentClick }: MobileAgendaProps) {
  const todayKey = useMemo(() => localDateKey(new Date()), []);
  const tomorrowKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return localDateKey(d);
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const appt of appointments) {
      const key = localDateKey(new Date(appt.start_time));
      const arr = map.get(key) ?? [];
      arr.push(appt);
      map.set(key, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    }
    return [...map.keys()].sort().map(key => ({ key, appts: map.get(key)! }));
  }, [appointments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#E7E5E4] border-t-[#374151]" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <p className="text-[15px] font-semibold text-[#111827]">No appointments</p>
        <p className="text-[13px] text-[#6B7280]">No appointments found for this period.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#F0EFED]">
      {groups.map(({ key, appts }) => {
        const isToday = key === todayKey;
        const label = sectionLabel(key, todayKey, tomorrowKey);

        return (
          <section key={key}>
            <div className={`flex items-center justify-between px-4 py-2.5 ${isToday ? 'bg-[#EFF6FF]/40' : 'bg-[#FAFAFA]'}`}>
              <p className={`text-[12px] font-semibold uppercase tracking-wide ${isToday ? 'text-[#2563EB]' : 'text-[#6B7280]'}`}>
                {label}
              </p>
              <span className="rounded-full bg-[#F5F5F3] px-2 py-0.5 text-[11px] font-medium text-[#6B7280] ring-1 ring-[#E7E5E4]">
                {appts.length}
              </span>
            </div>

            <div className="divide-y divide-[#F5F5F3] bg-white">
              {appts.map(appt => {
                const services = appt.appointment_services.map(s => s.service.name).join(', ');
                const staffName = appt.staff
                  ? `${appt.staff.first_name} ${appt.staff.last_name}`.trim()
                  : 'Unassigned';
                const accent = staffAccent(appt.staff?.id ?? appt.assigned_employee_id);
                const timeStart = new Date(appt.start_time).toLocaleTimeString('en-US', {
                  hour: 'numeric', minute: '2-digit', hour12: true,
                });
                const timeEnd = new Date(appt.end_time).toLocaleTimeString('en-US', {
                  hour: 'numeric', minute: '2-digit', hour12: true,
                });
                const statusStyle = STATUS_COLORS[appt.status] ?? { bg: '#F3F4F6', text: '#6B7280' };
                const dimmed = appt.status === 'cancelled' || appt.status === 'no_show';

                return (
                  <button
                    key={appt.id}
                    type="button"
                    onClick={() => onAppointmentClick(appt)}
                    className={`flex w-full min-h-[56px] items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F9F9F8] active:bg-[#F5F5F3] ${dimmed ? 'opacity-60' : ''}`}
                    style={{ borderLeft: `3px solid ${accent}` }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <p className="text-[14px] font-semibold text-[#111827] truncate">{appt.customer_name}</p>
                        <p className="shrink-0 text-[12px] text-[#6B7280]">{timeStart} – {timeEnd}</p>
                      </div>
                      {services && (
                        <p className="mt-0.5 truncate text-[12px] text-[#374151]">{services}</p>
                      )}
                      <p className="mt-0.5 text-[12px] text-[#9CA3AF]">{staffName}</p>
                    </div>
                    <span
                      className="shrink-0 self-start rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-tight mt-0.5"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                    >
                      {STATUS_LABELS[appt.status] ?? appt.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
