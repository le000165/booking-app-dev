'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut, Loader2, Calendar, User, Clock, RotateCcw, Check, XCircle } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  duration_mins: number;
  price: number;
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
  customer_phone: string;
  services: Service[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'badge-green',
  completed: 'badge-gray',
  cancelled: 'badge-red',
  no_show: 'badge-red',
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${DAYS_SHORT[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
}

export default function EmployeePage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loadingUser, setLoadingUser] = useState(true);
  const [employeeInfo, setEmployeeInfo] = useState<any>(null);
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    setApptLoading(true);
    try {
      const res = await fetch('/api/my-appointments');
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          router.push('/login');
          return;
        }
        throw new Error(data.error);
      }
      
      setAppointments(data.appointments || []);
      setEmployeeInfo(data.employee);
    } catch (err) {
      console.error(`[EMPLOYEE] Fetch error:`, err);
    } finally {
      setApptLoading(false);
      setLoadingUser(false);
    }
  }, [router]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const updateStatus = async (id: string, status: string) => {
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
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSignOut = async () => { 
    await supabase.auth.signOut(); 
    router.push('/login'); 
  };

  if (loadingUser) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]"><Loader2 className="animate-spin text-[var(--text-muted)]" /></div>;
  }

  // Group appointments
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.start_time.startsWith(todayStr));
  const upcomingAppts = appointments.filter(a => !a.start_time.startsWith(todayStr));

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {/* Header */}
      <header className="app-header">
        <div className="app-header-inner max-w-3xl mx-auto px-4 w-full flex justify-between items-center">
          <p className="font-semibold text-base md:text-lg text-[var(--text-primary)]">Employee Portal</p>
          <button onClick={handleSignOut} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors font-medium">
            <LogOut size={16} /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 md:py-8 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">My Schedule</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your assigned appointments</p>
          </div>
          <div className="flex justify-end">
            <button className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1" onClick={loadAppointments}>
              <RotateCcw size={14} className={apptLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Today's Schedule */}
          <section>
            <p className="text-sm font-semibold text-gray-900 mb-4">
              Today · {MONTHS[new Date().getMonth()]} {new Date().getDate()}
            </p>
            {todayAppts.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                <p className="text-sm font-medium text-gray-900">No appointments today</p>
                <p className="mt-1 text-sm text-gray-500">You're all caught up.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayAppts.map((appt) => (
                  <AppointmentRow key={appt.id} appt={appt} updatingId={updatingId} updateStatus={updateStatus} />
                ))}
              </div>
            )}
          </section>

          {/* Upcoming this week */}
          <section>
            <p className="text-sm font-semibold text-gray-900 mb-4">
              Upcoming this week
            </p>
            {upcomingAppts.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                <p className="text-sm font-medium text-gray-900">No upcoming appointments this week</p>
                <p className="mt-1 text-sm text-gray-500">You're all caught up.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppts.map((appt) => (
                  <AppointmentRow key={appt.id} appt={appt} updatingId={updatingId} updateStatus={updateStatus} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function AppointmentRow({ 
  appt, 
  updatingId, 
  updateStatus 
}: { 
  appt: Appointment, 
  updatingId: string | null, 
  updateStatus: (id: string, status: string) => void 
}) {
  const d = new Date(appt.start_time);
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  let totalDuration = 0;
  appt.services.forEach(s => { totalDuration += s.duration_mins; });

  const isCompletedOrNoShow = appt.status === 'completed' || appt.status === 'no_show' || appt.status === 'cancelled';
  
  const badgeClasses: Record<string, string> = {
    confirmed: 'bg-blue-50 text-blue-700',
    pending: 'bg-orange-50 text-orange-700',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-50 text-red-700',
    no_show: 'bg-red-50 text-red-700',
  };

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3 ${isCompletedOrNoShow ? 'opacity-60 bg-gray-50' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-gray-900">{timeStr}</p>
          <p className="truncate text-sm font-medium text-gray-900 mt-1">
            {appt.customer_name} {appt.customer_phone ? `· ${appt.customer_phone}` : ''}
          </p>
          <p className="truncate text-xs text-gray-500 mt-0.5">
            {appt.services.map(s => s.name).join(', ')} · {totalDuration} mins
          </p>
        </div>
        <span className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-md shrink-0 ${badgeClasses[appt.status] || 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABELS[appt.status] || appt.status}
        </span>
      </div>

      {!isCompletedOrNoShow && (
        <div className="grid grid-cols-2 gap-2 pt-3 mt-1 border-t border-gray-100">
          <button 
            className="h-10 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            onClick={() => updateStatus(appt.id, 'completed')}
            disabled={updatingId === appt.id}
          >
            {updatingId === appt.id ? <Loader2 size={16} className="animate-spin" /> : 'Done'}
          </button>

          <button 
            className="h-10 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            onClick={() => updateStatus(appt.id, 'no_show')}
            disabled={updatingId === appt.id}
          >
            No Show
          </button>
        </div>
      )}
    </div>
  );
}
