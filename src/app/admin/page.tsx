'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock, CheckCircle, XCircle, ChevronRight, Settings, Calendar,
  Loader2, MoreHorizontal, Plus, Pencil, Trash2, X, Check, ChevronDown,
  LogOut, User, Search, Filter, RotateCcw, UserMinus, Mail, MessageSquare
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface DayHours {
  day_of_week: number;
  open: boolean;
  open_time: string;
  close_time: string;
}

interface Appointment {
  id: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  start_time: string;
  end_time: string;
  assigned_employee_id: string | null;
  staff: { id: string; first_name: string; last_name: string } | null;
  appointment_services: {
    service: { id: string; name: string; duration_mins: number; price: number }
  }[];
}

interface Service {
  id: string;
  name: string;
  duration_mins: number;
  price: number;
  is_active: boolean;
  description: string | null;
  emoji: string | null;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

const DEFAULT_HOURS: DayHours[] = Array.from({ length: 7 }, (_, i) => ({
  day_of_week: i,
  open: i !== 0,
  open_time: i === 6 ? '10:00' : '09:00',
  close_time: i === 6 ? '16:00' : '18:00',
}));

type Tab = 'appointments' | 'availability' | 'services' | 'staff';

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

const EMPTY_FORM = { name: '', duration: '', price: '', emoji: '', description: '' };

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${DAYS_SHORT[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
}

export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();
  const [businessId, setBusinessId] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);
  const [tab, setTab] = useState<Tab>('appointments');

  // ── Appointments ──
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reminderState, setReminderState] = useState<{ id: string; channel: string } | null>(null);
  const [reminderMessage, setReminderMessage] = useState<{ id: string; type: 'success' | 'error'; text: string } | null>(null);

  // ── Filters ──
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0], // Default: Today
    to: new Date().toISOString().split('T')[0]
  });
  const [filterStaff, setFilterStaff] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // Default: All Statuses
  const [searchTerm, setSearchTerm] = useState('');

  // ── Appointment Edit ──
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);
  const [apptForm, setApptForm] = useState({
    staff_id: '',
    date: '',
    time: '',
    service_ids: [] as string[],
    customer_name: '',
    customer_email: '',
    customer_phone: ''
  });

  // ── Availability ──
  const [hours, setHours] = useState<DayHours[]>(DEFAULT_HOURS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Services ──
  const [services, setServices] = useState<Service[]>([]);
  const [svcLoading, setSvcLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [openServiceMenuId, setOpenServiceMenuId] = useState<string | null>(null);

  // ── Staff Management ──
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [staffHours, setStaffHours] = useState<DayHours[]>(DEFAULT_HOURS);
  const [staffServices, setStaffServices] = useState<string[]>([]);
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffSaved, setStaffSaved] = useState(false);

  // ── Stats ──
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Date Helpers ──
  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateRange({ from: today, to: today });
  };
  const setThisWeek = () => {
    const now = new Date();
    const first = now.getDate() - now.getDay();
    const last = first + 6;
    setDateRange({
      from: new Date(now.setDate(first)).toISOString().split('T')[0],
      to: new Date(now.setDate(last)).toISOString().split('T')[0]
    });
  };
  const resetFilters = () => {
    setToday();
    setFilterStaff('');
    setFilterStatus('all');
    setSearchTerm('');
  };

  // ── Loaders ──
  const loadAppointments = useCallback(async () => {
    if (!businessId) return;
    setApptLoading(true);
    try {
      let statusParam = filterStatus;

      const params = new URLSearchParams({
        business_id: businessId,
        from: dateRange.from ? `${dateRange.from}T00:00:00.000Z` : '',
        to: dateRange.to ? `${dateRange.to}T23:59:59.999Z` : '',
        staff_id: filterStaff,
        status: statusParam === 'all' ? '' : statusParam,
        search: searchTerm
      });
      const res = await fetch(`/api/appointments?${params.toString()}`);
      const data = await res.json();
      
      const appts = data.appointments || [];
      
      setAppointments(appts);
    } catch (err) {
      console.error(`[ADMIN][APPTS] Fetch error:`, err);
    } finally {
      setApptLoading(false);
    }
  }, [businessId, dateRange, filterStaff, filterStatus, searchTerm]);

  const loadServices = useCallback(async () => {
    if (!businessId) return;
    setSvcLoading(true);
    try {
      const res = await fetch(`/api/services?business_id=${businessId}&admin=true`);
      const data = await res.json();
      setServices(data.services || []);
    } catch (err) {
      console.error(`[ADMIN][SERVICES] Fetch error:`, err);
    } finally {
      setSvcLoading(false);
    }
  }, [businessId]);

  const loadAvailability = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(`/api/availability?business_id=${businessId}`);
      const data = await res.json();
      const rows = data.availability || [];
      const merged = DEFAULT_HOURS.map(def => {
        const db = rows.find((r: any) => r.day_of_week === def.day_of_week);
        return db ? { ...def, open: true, open_time: db.open_time, close_time: db.close_time } : { ...def, open: false };
      });
      setHours(merged);
    } catch (err) {
      console.error(`[ADMIN][AVAIL] Fetch error:`, err);
    }
  }, [businessId]);

  const loadEmployees = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(`/api/employees?business_id=${businessId}`);
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (err) {
      console.error('[ADMIN][STAFF] Fetch error:', err);
    }
  }, [businessId]);

  const loadAllStaff = useCallback(async () => {
    if (!businessId) return;
    setStaffLoading(true);
    try {
      const res = await fetch(`/api/staff?business_id=${businessId}`);
      const data = await res.json();
      setAllStaff(data.staff || []);
    } catch (err) {
      console.error('[ADMIN][ALL_STAFF] Fetch error:', err);
    } finally {
      setStaffLoading(false);
    }
  }, [businessId]);

  const loadStaffDetails = useCallback(async (staffId: string) => {
    if (!businessId || !staffId) return;
    try {
      const [schedRes, servRes] = await Promise.all([
        fetch(`/api/staff-schedules?business_id=${businessId}&team_member_id=${staffId}`),
        fetch(`/api/staff-services?business_id=${businessId}&team_member_id=${staffId}`)
      ]);
      const schedData = await schedRes.json();
      const servData = await servRes.json();

      const rows = schedData.schedules || [];
      const merged = DEFAULT_HOURS.map(def => {
        const db = rows.find((r: any) => r.day_of_week === def.day_of_week);
        return db ? { ...def, open: true, open_time: db.start_time, close_time: db.end_time } : { ...def, open: false };
      });
      
      setStaffHours(merged);
      setStaffServices(servData.service_ids || []);
      setStaffSaved(false);
    } catch (err) {
      console.error('[ADMIN][STAFF_DETAILS] Fetch error:', err);
    }
  }, [businessId]);

  const loadStats = useCallback(async () => {
    if (!businessId) return;
    setStatsLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      
      const res = await fetch(`/api/admin/stats?business_id=${businessId}&today_start=${todayStart.toISOString()}&today_end=${todayEnd.toISOString()}&now=${now.toISOString()}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('[ADMIN][STATS] Fetch error:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [businessId]);

  // ── Auth ──
  useEffect(() => {
    async function resolveAuth() {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { router.push('/login'); return; }

      const { data: member, error: memberError } = await supabase
        .from('team_members')
        .select('business_id, role')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      const memberData = member as any;
      if (memberError || !memberData || !['owner', 'admin'].includes(memberData.role)) {
        router.push('/'); return;
      }

      setBusinessId(memberData.business_id);
      setLoadingUser(false);
    }
    resolveAuth();
  }, [supabase, router]);

  useEffect(() => {
    if (!businessId) return;
    loadAppointments();
    loadServices();
    loadAvailability();
    loadEmployees();
    loadAllStaff();
    loadStats();
  }, [businessId, loadAppointments, loadServices, loadAvailability, loadEmployees, loadAllStaff, loadStats]);

  // ── Appointment Actions ──
  const updateStatus = async (id: string, status: string) => {
    if (status === 'no_show' && !window.confirm("Mark this appointment as No Show?")) return;
    setUpdatingId(id);
    try {
      await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      setExpandedId(null);
    } finally {
      setUpdatingId(null);
    }
  };

  const sendReminder = async (e: React.MouseEvent, id: string, channel: 'email' | 'sms') => {
    e.preventDefault();
    setReminderState({ id, channel });
    setReminderMessage(null);
    
    // console.log(`[admin reminder] ${channel} reminder clicked`, id);
    // console.log("[admin reminder] request url:", `/api/appointments/${id}/reminder`);
    // console.log("[admin reminder] payload:", { channel });
    
    try {
      const res = await fetch(`/api/appointments/${id}/reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      });
      
      const data = await res.json();
      // console.log("[admin reminder] response status:", res.status);
      // console.log("[admin reminder] response json:", data);
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to send ${channel.toUpperCase()}`);
      }
      setReminderMessage({ id, type: 'success', text: `${channel.toUpperCase()} reminder sent successfully.` });
    } catch (err: any) {
      console.error("[admin reminder] failed:", err);
      setReminderMessage({ id, type: 'error', text: err.message });
    } finally {
      setReminderState(null);
    }
  };

  const openApptEdit = (appt: Appointment) => {
    const d = new Date(appt.start_time);
    setApptForm({
      staff_id: appt.assigned_employee_id || '',
      date: d.toISOString().split('T')[0],
      time: d.toTimeString().slice(0, 5),
      service_ids: appt.appointment_services.map(s => s.service.id),
      customer_name: appt.customer_name || '',
      customer_email: appt.customer_email || '',
      customer_phone: appt.customer_phone || ''
    });
    setEditAppt(appt);
  };

  const handleApptSubmit = async () => {
    if (!editAppt || !apptForm.date || !apptForm.time || apptForm.service_ids.length === 0) return;
    setUpdatingId(editAppt.id);
    try {
      const start = new Date(`${apptForm.date}T${apptForm.time}:00`);
      let totalDuration = 0;
      apptForm.service_ids.forEach(sid => {
        const s = services.find(sv => sv.id === sid);
        if (s) totalDuration += s.duration_mins;
      });
      const end = new Date(start.getTime() + totalDuration * 60000);

      const res = await fetch(`/api/appointments/${editAppt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_employee_id: apptForm.staff_id || null,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          service_ids: apptForm.service_ids,
          status: editAppt.status,
          customer_name: apptForm.customer_name,
          customer_email: apptForm.customer_email,
          customer_phone: apptForm.customer_phone
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update appointment');
      }

      setEditAppt(null);
      await loadAppointments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Hours Actions ──
  const handleSaveHours = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, hours }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  // ── Staff Actions ──
  const handleSaveStaff = async () => {
    if (!selectedStaffId) return;
    setStaffSaving(true);
    try {
      const [resSched, resServ] = await Promise.all([
        fetch('/api/staff-schedules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business_id: businessId, team_member_id: selectedStaffId, schedules: staffHours }),
        }),
        fetch('/api/staff-services', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business_id: businessId, team_member_id: selectedStaffId, service_ids: staffServices }),
        })
      ]);

      if (!resSched.ok) {
        const d = await resSched.json();
        throw new Error(`Schedule save failed: ${d.error || resSched.statusText}`);
      }
      if (!resServ.ok) {
        const d = await resServ.json();
        throw new Error(`Services save failed: ${d.error || resServ.statusText}`);
      }
      
      setStaffSaved(true);
    } catch (err: any) {
      console.error('[ADMIN][STAFF_SAVE] error:', err);
      alert(err.message);
    } finally {
      setStaffSaving(false);
    }
  };

  // ── Services Actions ──
  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); setFormError(null); setShowForm(true); };
  const openEdit = (svc: Service) => {
    setEditId(svc.id);
    setForm({ name: svc.name, duration: String(svc.duration_mins), price: String(svc.price), emoji: svc.emoji || '', description: svc.description || '' });
    setFormError(null);
    setShowForm(true);
  };

  const handleServiceSubmit = async () => {
    if (!form.name.trim() || !form.duration || !form.price) {
      setFormError('Name, duration, and price are required.');
      return;
    }
    setFormSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...(editId ? { id: editId } : { business_id: businessId }),
        name: form.name.trim(),
        duration_mins: Number(form.duration),
        price: Number(form.price),
        emoji: form.emoji.trim() || null,
        description: form.description.trim() || null,
      };
      const res = await fetch('/api/services', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      await loadServices();
      setShowForm(false);
    } catch (e: any) {
      setFormError(e.message || 'Something went wrong.');
    } finally {
      setFormSaving(false);
    }
  };

  const toggleActive = async (svc: Service) => {
    await fetch('/api/services', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: svc.id, is_active: !svc.is_active }),
    });
    setServices(prev => prev.map(s => s.id === svc.id ? { ...s, is_active: !s.is_active } : s));
  };

  const deleteService = async (id: string) => {
    if (!window.confirm("Permanently delete this service?")) return;
    try {
      const res = await fetch(`/api/services?id=${id}`, { method: 'DELETE' });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error); }
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (err: any) { alert(err.message); }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/login'); };

  if (loadingUser) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]"><Loader2 className="animate-spin text-[var(--text-muted)]" /></div>;

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">

      {/* Appointment Edit Modal */}
      {editAppt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card w-full max-w-md shadow-2xl border-[1.5px] border-[var(--border-focus)] slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[17px] font-semibold text-[var(--text-primary)]">Edit Appointment</h3>
              <button className="btn-ghost p-1.5" onClick={() => setEditAppt(null)}><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="input-label">Customer Name</label>
                  <input type="text" className="input-field" value={apptForm.customer_name} onChange={e => setApptForm(f => ({ ...f, customer_name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Email</label>
                    <input type="email" className="input-field" value={apptForm.customer_email} onChange={e => setApptForm(f => ({ ...f, customer_email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="input-label">Phone</label>
                    <input type="tel" className="input-field" value={apptForm.customer_phone} onChange={e => setApptForm(f => ({ ...f, customer_phone: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div>
                <label className="input-label">Assigned Staff</label>
                <select className="input-field" value={apptForm.staff_id} onChange={e => setApptForm(f => ({ ...f, staff_id: e.target.value }))}>
                  <option value="">Any available</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Date</label>
                  <input type="date" className="input-field" value={apptForm.date} onChange={e => setApptForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label">Start Time</label>
                  <input type="time" className="input-field" value={apptForm.time} onChange={e => setApptForm(f => ({ ...f, time: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="input-label mb-2 block">Services</label>
                <div className="max-h-[160px] overflow-y-auto space-y-1 p-1 border rounded-lg border-[var(--border-default)]">
                  {services.map(s => (
                    <label key={s.id} className="flex items-center gap-2 p-2 rounded hover:bg-[var(--bg-subtle)] cursor-pointer">
                      <input type="checkbox" checked={apptForm.service_ids.includes(s.id)}
                        onChange={e => {
                          const ids = e.target.checked ? [...apptForm.service_ids, s.id] : apptForm.service_ids.filter(id => id !== s.id);
                          setApptForm(f => ({ ...f, service_ids: ids }));
                        }}
                      />
                      <span className="text-[13px] text-[var(--text-primary)]">{s.emoji} {s.name}</span>
                      <span className="text-[11px] text-[var(--text-secondary)] ml-auto">${Number(s.price).toFixed(0)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button className="btn-secondary flex-1" onClick={() => setEditAppt(null)}>Cancel</button>
                <button className="btn-primary flex-1" onClick={handleApptSubmit} disabled={updatingId === editAppt.id}>
                  {updatingId === editAppt.id ? <Loader2 size={16} className="animate-spin" /> : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="app-header-inner max-w-3xl mx-auto px-4 w-full flex justify-between items-center">
          <p className="font-semibold text-base md:text-lg text-[var(--text-primary)]">Admin Dashboard</p>
          <button onClick={handleSignOut} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors font-medium">
            <LogOut size={16} /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
        <div className="max-w-3xl mx-auto px-4 w-full overflow-x-auto no-scrollbar">
          <div className="flex gap-1 border-b border-[var(--border-default)]">
            {(['appointments', 'availability', 'services', 'staff'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`nav-tab relative ${tab === t ? 'active' : ''}`}
                style={tab === t ? { color: 'var(--text-primary)', fontWeight: 600 } : {}}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {tab === t && <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-[var(--text-primary)] rounded-t" style={{ transform: 'translateY(1px)' }} />}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 md:py-8 w-full space-y-6">

        {/* ── APPOINTMENTS ── */}
        {tab === 'appointments' && (
          <div className="slide-up space-y-5">

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-4">
                <p className="text-[12px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">Today's Bookings</p>
                {statsLoading ? <Loader2 size={18} className="animate-spin text-[var(--text-muted)]" /> : (
                  <p className="text-[24px] font-semibold text-[var(--text-primary)]">{stats?.todayBookingCount || 0}</p>
                )}
              </div>
              <div className="card p-4">
                <p className="text-[12px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">Revenue Today</p>
                {statsLoading ? <Loader2 size={18} className="animate-spin text-[var(--text-muted)]" /> : (
                  <p className="text-[24px] font-semibold text-[var(--text-primary)]">${(stats?.revenueToday || 0).toFixed(2)}</p>
                )}
              </div>
              <div className="card p-4">
                <p className="text-[12px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">Next Appointment</p>
                {statsLoading ? <Loader2 size={18} className="animate-spin text-[var(--text-muted)]" /> : stats?.nextUpcomingAppointment ? (
                  <div>
                    <p className="text-[15px] font-semibold text-[var(--text-primary)] truncate">{stats.nextUpcomingAppointment.customer_name}</p>
                    <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
                      {new Date(stats.nextUpcomingAppointment.appointment_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      {stats.nextUpcomingAppointment.assigned_employee_name ? ` · ${stats.nextUpcomingAppointment.assigned_employee_name}` : ''}
                    </p>
                  </div>
                ) : (
                  <p className="text-[14px] text-[var(--text-secondary)] mt-1">None scheduled</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Appointments</h2>
                <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">{apptLoading ? 'Loading…' : `${appointments.length} total`}</p>
              </div>
              <button className="btn-ghost text-[13px] px-3 flex items-center gap-2" onClick={() => { loadAppointments(); loadStats(); }}>
                <RotateCcw size={14} /> Refresh
              </button>
            </div>

            {/* Filters Bar */}
            <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Filters</p>
                {(filterStaff || filterStatus !== 'all' || searchTerm || (dateRange.from !== new Date().toISOString().split('T')[0])) && (
                  <button className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors" onClick={resetFilters}>
                    Clear
                  </button>
                )}
              </div>

              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search customer..." 
                  className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm focus:border-gray-400 focus:ring-0 outline-none transition-colors"
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    className={`h-10 rounded-lg border text-sm font-medium transition-colors ${dateRange.from === new Date().toISOString().split('T')[0] && dateRange.to === new Date().toISOString().split('T')[0] ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`} 
                    onClick={setToday}
                  >
                    Today
                  </button>
                  <button 
                    className="h-10 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors" 
                    onClick={setThisWeek}
                  >
                    This Week
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="date" 
                    placeholder="From" 
                    className="h-10 text-sm px-3 rounded-lg border border-gray-200 w-full min-w-0 focus:border-gray-400 outline-none text-gray-700 bg-white" 
                    value={dateRange.from} 
                    onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))} 
                  />
                  <input 
                    type="date" 
                    placeholder="To" 
                    className="h-10 text-sm px-3 rounded-lg border border-gray-200 w-full min-w-0 focus:border-gray-400 outline-none text-gray-700 bg-white" 
                    value={dateRange.to} 
                    onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select 
                  className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:border-gray-400 outline-none text-gray-700 bg-white" 
                  value={filterStaff} 
                  onChange={e => setFilterStaff(e.target.value)}
                >
                  <option value="">All Staff</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
                <select 
                  className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:border-gray-400 outline-none text-gray-700 bg-white" 
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>
            </div>

            {apptLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={22} className="animate-spin text-[var(--text-muted)]" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="card text-center py-12">
                <Calendar size={28} className="mx-auto mb-3 text-[var(--text-muted)]" />
                <p className="font-medium text-[15px] text-[var(--text-primary)]">No appointments found</p>
                <p className="text-[13px] text-[var(--text-secondary)] mt-1">Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="card overflow-hidden" style={{ padding: 0 }}>
                {appointments.map((appt, i) => (
                  <div key={appt.id}>
                    <button className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                      style={{ borderBottom: i < appointments.length - 1 && expandedId !== appt.id ? '1px solid var(--border-default)' : 'none' }}
                      onClick={() => setExpandedId(prev => prev === appt.id ? null : appt.id)}>
                      <div className="avatar avatar-md shrink-0 mt-0.5">{appt.customer_name?.[0]?.toUpperCase() || '?'}</div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="truncate text-[15px] font-semibold text-[var(--text-primary)]">
                            {appt.customer_name}
                          </h3>
                          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                            <span className={`badge text-[11px] px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[appt.status] || 'badge-gray'}`}>
                              {STATUS_LABELS[appt.status] || appt.status}
                            </span>
                            <ChevronDown size={16} className={`text-[var(--text-muted)] transition-transform ${expandedId === appt.id ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                          {formatDateTime(appt.start_time)}
                        </p>

                        {appt.appointment_services?.length > 0 && (
                          <p className="mt-1 truncate text-[13px] text-[var(--text-secondary)]">
                            {appt.appointment_services.map((s: any) => s.service.name).join(', ')}
                          </p>
                        )}

                        <p className="mt-1 truncate text-[12px] text-[var(--text-muted)]">
                          Staff: {appt.staff ? `${appt.staff.first_name} ${appt.staff.last_name}` : 'Unassigned'}
                        </p>
                      </div>
                    </button>

                    {expandedId === appt.id && (
                      <div className="px-4 pb-4 pt-3 bg-gray-50 border-b border-gray-200">
                        {/* Details Block */}
                        <div className="space-y-3 mb-5">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Contact</p>
                            <p className="text-sm text-gray-900">{appt.customer_email} • {appt.customer_phone || 'No phone'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Staff</p>
                            <p className="text-sm text-gray-900">{appt.staff ? `${appt.staff.first_name} ${appt.staff.last_name}` : 'Unassigned'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Services</p>
                            <div className="flex flex-wrap gap-1.5">
                              {appt.appointment_services.map((s: any) => (
                                <span key={s.service.id} className="text-xs px-2 py-1 bg-white border border-gray-200 text-gray-700 rounded-md">
                                  {s.service.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Primary Actions */}
                        {(appt.status !== 'completed' && appt.status !== 'cancelled') ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                            {(appt.status === 'pending' || appt.status === 'no_show') && (
                              <button className="h-11 rounded-xl text-sm font-medium w-full bg-black text-white hover:bg-gray-800 transition-colors" onClick={() => updateStatus(appt.id, 'confirmed')} disabled={updatingId === appt.id}>
                                {updatingId === appt.id ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Confirm'}
                              </button>
                            )}
                            {appt.status === 'confirmed' && (
                              <button className="h-11 rounded-xl text-sm font-medium w-full bg-black text-white hover:bg-gray-800 transition-colors" onClick={() => updateStatus(appt.id, 'completed')} disabled={updatingId === appt.id}>
                                {updatingId === appt.id ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Complete'}
                              </button>
                            )}
                            <button className="h-11 rounded-xl text-sm font-medium w-full border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 transition-colors" onClick={() => updateStatus(appt.id, 'cancelled')} disabled={updatingId === appt.id}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="mb-5 py-2.5 px-4 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-sm font-medium text-gray-500">
                            Appointment {appt.status === 'completed' ? 'completed' : 'cancelled'}
                          </div>
                        )}

                        {/* Secondary Actions */}
                        <div className="space-y-3 pt-4 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-500">More actions</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button className="h-10 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 flex justify-center items-center gap-2 hover:bg-gray-50 bg-white transition-colors" onClick={() => openApptEdit(appt)}>
                              <Pencil size={14} /> Edit Details
                            </button>
                            
                            {appt.status !== 'no_show' && appt.status !== 'completed' && appt.status !== 'cancelled' && (
                              <button className="h-10 rounded-lg border border-gray-200 text-sm font-medium text-orange-600 flex justify-center items-center gap-2 hover:bg-orange-50 bg-white transition-colors" onClick={() => updateStatus(appt.id, 'no_show')} disabled={updatingId === appt.id}>
                                Mark No Show
                              </button>
                            )}

                            {(appt.status !== 'completed' && appt.status !== 'cancelled') && (
                              <>
                                <button 
                                  type="button"
                                  className="h-10 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 flex justify-center items-center gap-2 hover:bg-gray-50 bg-white transition-colors" 
                                  onClick={(e) => sendReminder(e, appt.id, 'email')} 
                                  disabled={reminderState !== null}
                                >
                                  {reminderState?.id === appt.id && reminderState?.channel === 'email' ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                                  Email Reminder
                                </button>
                                {appt.customer_phone && (
                                  <button 
                                    type="button"
                                    className="h-10 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 flex justify-center items-center gap-2 hover:bg-gray-50 bg-white transition-colors" 
                                    onClick={(e) => sendReminder(e, appt.id, 'sms')} 
                                    disabled={reminderState !== null}
                                  >
                                    {reminderState?.id === appt.id && reminderState?.channel === 'sms' ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                                    SMS Reminder
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                          
                          {reminderMessage?.id === appt.id && (
                            <div className={`text-xs p-2.5 rounded-lg border mt-2 ${
                              reminderMessage.type === 'success' 
                                ? 'bg-green-50 border-green-200 text-green-700' 
                                : 'bg-red-50 border-red-200 text-red-700'
                            }`}>
                              {reminderMessage.text}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── AVAILABILITY ── */}
        {tab === 'availability' && (
          <div className="slide-up space-y-5">
            <div>
              <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Business hours</h2>
              <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Set when customers can book appointments</p>
            </div>
            <div className="card overflow-hidden" style={{ padding: 0 }}>
              {hours.map((h, i) => (
                <div key={h.day_of_week} className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 ${i < hours.length - 1 ? 'border-b border-[var(--border-default)]' : ''}`}
                  style={{ opacity: h.open ? 1 : 0.5 }}>
                  <span className="w-9 shrink-0 text-[13px] font-medium text-[var(--text-secondary)]">{DAYS_SHORT[h.day_of_week]}</span>
                  <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 min-w-0 w-full">
                    {h.open ? (
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full min-w-0">
                        <input type="time" value={h.open_time} onChange={e => { setHours(p => p.map(d => d.day_of_week === h.day_of_week ? { ...d, open_time: e.target.value } : d)); setSaved(false); }}
                          className="input-field w-full min-w-0 max-w-full text-[13px] py-1.5 px-2" />
                        <span className="hidden sm:block text-[12px] text-[var(--text-muted)] shrink-0">to</span>
                        <input type="time" value={h.close_time} onChange={e => { setHours(p => p.map(d => d.day_of_week === h.day_of_week ? { ...d, close_time: e.target.value } : d)); setSaved(false); }}
                          className="input-field w-full min-w-0 max-w-full text-[13px] py-1.5 px-2" />
                      </div>
                    ) : <span className="text-[13px] text-[var(--text-muted)] truncate py-1.5">Closed</span>}
                  </div>
                  <label className="toggle shrink-0">
                    <input type="checkbox" checked={h.open} onChange={() => { setHours(p => p.map(d => d.day_of_week === h.day_of_week ? { ...d, open: !d.open } : d)); setSaved(false); }} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
            <button className={`btn-primary ${saved ? '!bg-[var(--success)]' : ''}`} onClick={handleSaveHours} disabled={saving}>
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save hours'}
            </button>
          </div>
        )}

        {/* ── SERVICES ── */}
        {tab === 'services' && (
          <div className="slide-up space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Services</h2>
                <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Manage what customers can book</p>
              </div>
              {showForm ? (
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              ) : (
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors" onClick={openCreate}>
                  <Plus size={16} /> Add Service
                </button>
              )}
            </div>

            {showForm && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{editId ? 'Edit service' : 'New service'}</h3>
                  <button className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => setShowForm(false)}><X size={18} /></button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Service name *</label>
                    <input className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-gray-400 focus:ring-0 outline-none transition-colors" placeholder="e.g. Gel Manicure" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">Duration (mins) *</label>
                      <input className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-gray-400 focus:ring-0 outline-none transition-colors" type="number" step={5} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">Price ($) *</label>
                      <input className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-gray-400 focus:ring-0 outline-none transition-colors" type="number" step={0.01} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Description</label>
                    <textarea className="min-h-[88px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:ring-0 outline-none transition-colors resize-none" placeholder="Optional details" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  
                  {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-lg">{formError}</p>}
                  
                  <button className="h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2" onClick={handleServiceSubmit} disabled={formSaving}>
                    {formSaving ? <Loader2 size={18} className="animate-spin" /> : 'Save service'}
                  </button>
                </div>
              </div>
            )}

            {svcLoading ? (
              <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-[var(--text-muted)]" /></div>
            ) : services.length === 0 ? (
              <div className="card text-center py-12">
                <p className="font-medium text-[15px] text-[var(--text-primary)]">Create your first service to start taking bookings.</p>
                <button className="inline-flex items-center gap-2 px-4 py-2 mt-4 rounded-lg bg-black text-white text-[13px] font-medium" onClick={openCreate}>
                  <Plus size={16} /> Add Service
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--border-default)] bg-white shadow-sm divide-y divide-[var(--border-default)]">
                {services.map((svc) => (
                  <div key={svc.id} className="flex items-center justify-between gap-3 py-4 px-4">
                    {/* LEFT */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-[var(--text-primary)] truncate">
                        {svc.name}
                      </p>
                      <p className="text-[13px] text-[var(--text-secondary)] truncate mt-0.5">
                        {svc.duration_mins} min · ${Number(svc.price).toFixed(2)}
                      </p>
                    </div>

                    {/* RIGHT */}
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => toggleActive(svc)}
                        disabled={svcLoading}
                        className={`px-3 py-1.5 text-[11px] font-semibold tracking-wide rounded-full transition-colors ${
                          svc.is_active
                            ? "bg-[var(--success-light)] text-[var(--success-dark)]"
                            : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)]"
                        }`}
                      >
                        {svc.is_active ? "Active" : "Inactive"}
                      </button>
                      
                      <div className="relative">
                        <button 
                          className="p-1.5 rounded-md hover:bg-[var(--bg-subtle)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          onClick={() => setOpenServiceMenuId(prev => prev === svc.id ? null : svc.id)}
                          aria-label="Actions"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        
                        {openServiceMenuId === svc.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenServiceMenuId(null)} />
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-[var(--border-default)] py-1 z-50 overflow-hidden">
                              <button 
                                className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[var(--bg-subtle)] flex items-center gap-2 text-[var(--text-primary)]"
                                onClick={() => { openEdit(svc); setOpenServiceMenuId(null); }}
                              >
                                <Pencil size={14} /> Edit service
                              </button>
                              <button 
                                className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[var(--error-light)] flex items-center gap-2 text-[var(--error)]"
                                onClick={() => { deleteService(svc.id); setOpenServiceMenuId(null); }}
                              >
                                <Trash2 size={14} /> Delete service
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STAFF ── */}
        {tab === 'staff' && (
          <div className="slide-up flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Left side: Staff List */}
            <div className="w-full md:w-1/3 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
                <p className="text-sm text-gray-500 mt-0.5">Select staff to manage schedules</p>
              </div>
              <div className="flex flex-col gap-2">
                {staffLoading ? (
                  <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-[var(--text-muted)]" /></div>
                ) : (
                  allStaff.map(staff => (
                    <button
                      key={staff.id}
                      onClick={() => { setSelectedStaffId(staff.id); loadStaffDetails(staff.id); }}
                      className={`w-full text-left p-3 flex items-center gap-3 rounded-xl border transition-colors ${
                        selectedStaffId === staff.id 
                          ? 'bg-gray-100 border-gray-300 shadow-sm' 
                          : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <div className="avatar avatar-sm shrink-0">{staff.first_name[0]}{staff.last_name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${selectedStaffId === staff.id ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {staff.first_name} {staff.last_name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize truncate">{staff.role}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right side: Selected Staff Details */}
            <div className="w-full md:w-2/3">
              {selectedStaffId ? (
                <div className="space-y-8">
                  {/* Staff Schedule */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Working Hours</h3>
                      <p className="text-sm text-gray-500 mt-0.5">Set weekly availability for this staff member</p>
                    </div>
                    
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                      <div className="divide-y divide-gray-100">
                        {staffHours.map((h) => (
                          <div key={h.day_of_week} className="flex flex-col gap-3 p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">{DAYS_SHORT[h.day_of_week]}</span>
                              <label className="toggle shrink-0">
                                <input type="checkbox" checked={h.open} onChange={() => { setStaffHours(p => p.map(d => d.day_of_week === h.day_of_week ? { ...d, open: !d.open } : d)); setStaffSaved(false); }} />
                                <span className="toggle-slider" />
                              </label>
                            </div>
                            
                            {h.open ? (
                              <div className="flex gap-2">
                                <input type="time" value={h.open_time} onChange={e => { setStaffHours(p => p.map(d => d.day_of_week === h.day_of_week ? { ...d, open_time: e.target.value } : d)); setStaffSaved(false); }}
                                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gray-400 focus:ring-0 outline-none transition-colors" />
                                <input type="time" value={h.close_time} onChange={e => { setStaffHours(p => p.map(d => d.day_of_week === h.day_of_week ? { ...d, close_time: e.target.value } : d)); setStaffSaved(false); }}
                                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gray-400 focus:ring-0 outline-none transition-colors" />
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Off</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Staff Services */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Assigned Services</h3>
                      <p className="text-sm text-gray-500 mt-0.5">Which services this staff member provides</p>
                    </div>
                    
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {services.map(s => (
                          <label key={s.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <input 
                              type="checkbox" 
                              checked={staffServices.includes(s.id)}
                              className="rounded border-gray-300 text-black focus:ring-black"
                              onChange={e => {
                                setStaffServices(prev => 
                                  e.target.checked 
                                    ? [...prev, s.id] 
                                    : prev.filter(id => id !== s.id)
                                );
                                setStaffSaved(false);
                              }}
                            />
                            <span className="text-sm text-gray-900 min-w-0 truncate">{s.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {!staffSaved && (
                    <button className="w-full h-12 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-900 transition-colors shadow-sm" onClick={handleSaveStaff} disabled={staffSaving}>
                      {staffSaving ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Save changes'}
                    </button>
                  )}
                  {staffSaved && (
                    <div className="w-full h-12 bg-green-50 text-green-700 text-sm font-medium rounded-xl flex items-center justify-center gap-2 border border-green-200">
                      <Check size={16} /> Saved
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl py-20 bg-gray-50">
                  Select a team member to manage their schedule and services
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
