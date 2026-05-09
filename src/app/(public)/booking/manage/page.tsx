'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Clock, Calendar, User, CheckCircle, AlertCircle, Loader2, ArrowLeft, XCircle } from 'lucide-react';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true };
  return d.toLocaleString('en-US', options);
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'badge-green',
  completed: 'badge-gray',
  cancelled: 'badge-red',
  no_show: 'badge-red',
};

function ManageBookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('No appointment ID provided.');
      setLoading(false);
      return;
    }
    // console.log("[manage cancel] page loaded with id:", id);

    async function loadAppointment() {
      try {
        const res = await fetch(`/api/appointments/${id}`);
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || 'Failed to load appointment.');
        } else {
          setAppointment(data.appointment);
        }
      } catch (err: any) {
        setError('Failed to connect to the server.');
      } finally {
        setLoading(false);
      }
    }
    loadAppointment();
  }, [id]);

  const handleCancel = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    setCancelling(true);
    setError(null);
    try {
      const payload = { status: 'cancelled' };
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      // console.log("[manage cancel] response status:", res.status);
      // console.log("[manage cancel] response ok:", res.ok);
      
      const data = await res.json();
      // console.log("[manage cancel] response json:", data);
      
      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Failed to cancel appointment.');
      }
      
      // console.log("[manage cancel] updated appointment status:", data?.appointment?.status);
      setAppointment((prev: any) => ({ ...prev, status: 'cancelled' }));
      setCancelSuccess(true);
      setShowConfirm(false);
    } catch (err: any) {
      console.error("[manage cancel] cancel failed:", err);
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleReschedule = async (e: React.MouseEvent) => {
    e.preventDefault();
    // console.log(`[CLIENT] Reschedule button clicked for appointment id: ${id}`);
    if (appointment?.status !== 'cancelled') {
      if (!window.confirm("Rescheduling will cancel your current appointment. Do you want to proceed?")) return;
      
      setCancelling(true);
      try {
        const res = await fetch(`/api/appointments/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to cancel current appointment.');
      } catch (err: any) {
        setError(err.message);
        setCancelling(false);
        return;
      }
    }

    // Redirect to booking flow with pre-filled params
    const slug = appointment?.businesses?.slug || appointment?.businesses?.id;
    if (!slug) {
      setError('Unable to find business details to reschedule.');
      setCancelling(false);
      return;
    }
    
    const serviceIds = appointment?.appointment_services?.map((s: any) => s.service.id).join(',') || '';
    const staffId = appointment?.assigned_employee_id || '';
    
    const params = new URLSearchParams();
    if (serviceIds) params.set('service_ids', serviceIds);
    if (staffId) params.set('staff_id', staffId);
    params.set('reschedule_from', id!);
    
    router.push(`/${slug}/book?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex flex-col items-center justify-center px-5 text-center gap-4">
        <AlertCircle size={36} className="text-[var(--text-muted)]" />
        <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">Booking not found</h1>
        <p className="text-[14px] text-[var(--text-secondary)] max-w-[280px]">{error}</p>
      </div>
    );
  }

  const canCancel = appointment.status !== 'cancelled' && appointment.status !== 'completed';
  const businessName = appointment.businesses?.name || 'the business';

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex flex-col items-center justify-center py-10 px-4">
      <div className="w-full max-w-md mx-auto slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--bg-subtle)] mb-4">
            <Calendar size={20} className="text-[var(--text-primary)]" />
          </div>
          <h1 className="text-[22px] font-semibold text-[var(--text-primary)] tracking-tight">
            Manage your booking
          </h1>
          <p className="text-[14px] text-[var(--text-secondary)] mt-1">
            Appointment at {businessName}
          </p>
        </div>

        {cancelSuccess && (
          <div className="mb-6 bg-[var(--success-light)] border border-[var(--success)] rounded-lg p-4 flex items-start gap-3">
            <CheckCircle size={18} className="text-[var(--success)] shrink-0 mt-0.5" />
            <div className="text-[14px] text-[var(--text-primary)]">
              Your appointment has been cancelled successfully.
            </div>
          </div>
        )}
        
        {error && !cancelSuccess && (
          <div className="mb-6 bg-[var(--error-light)] border border-[var(--error-border)] rounded-lg p-4 text-[13px] text-[var(--error)]">
            {error}
          </div>
        )}

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="section-label">Details</p>
            <span className={`badge ${STATUS_BADGE[appointment.status] || 'badge-gray'}`}>
              {STATUS_LABELS[appointment.status] || appointment.status}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User size={16} className="text-[var(--text-muted)] mt-0.5 shrink-0" />
              <div>
                <p className="text-[14px] font-medium text-[var(--text-primary)]">{appointment.customer_name}</p>
                <p className="text-[13px] text-[var(--text-secondary)]">{appointment.customer_email}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock size={16} className="text-[var(--text-muted)] mt-0.5 shrink-0" />
              <div>
                <p className="text-[14px] text-[var(--text-primary)]">
                  {formatDateTime(appointment.start_time)}
                </p>
              </div>
            </div>

            <div className="divider" style={{ margin: '16px 0' }} />

            <div>
              <p className="text-[12px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-2">Services</p>
              <div className="space-y-2">
                {appointment.appointment_services?.map((s: any) => (
                  <div key={s.service.id} className="flex justify-between items-center">
                    <span className="text-[14px] text-[var(--text-primary)]">{s.service.name}</span>
                    <span className="text-[13px] text-[var(--text-secondary)]">{s.service.duration_mins} min</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="divider" style={{ margin: '16px 0' }} />

            <div>
              <p className="text-[12px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">Provider</p>
              <p className="text-[14px] text-[var(--text-primary)]">
                {appointment.staff ? `${appointment.staff.first_name} ${appointment.staff.last_name}` : 'Any available staff'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {!showConfirm ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                type="button"
                className="btn-primary w-full sm:flex-1 h-12 sm:h-10 text-sm" 
                onClick={handleReschedule}
                disabled={cancelling || appointment.status === 'completed'}
              >
                {cancelling ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Reschedule'}
              </button>
              
              {canCancel && (
                <button 
                  type="button"
                  className="btn-secondary w-full sm:flex-1 h-12 sm:h-10 text-sm text-[var(--error)] hover:bg-[var(--error-light)] border-[var(--error-border)] transition-colors"
                  onClick={() => setShowConfirm(true)}
                  disabled={cancelling}
                >
                  Cancel appointment
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg p-4 slide-up">
              <p className="text-[14px] font-medium text-[var(--text-primary)] mb-4 text-center">
                Are you sure you want to cancel this appointment?
              </p>
              <div className="flex gap-3">
                <button 
                  type="button"
                  className="btn-secondary flex-1 h-12 sm:h-10 text-sm"
                  onClick={() => setShowConfirm(false)}
                  disabled={cancelling}
                >
                  No
                </button>
                <button 
                  type="button"
                  className="btn-primary flex-1 h-12 sm:h-10 text-sm bg-[var(--error)] hover:bg-[#dc2626] border-transparent text-white"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Yes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ManageBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    }>
      <ManageBookingContent />
    </Suspense>
  );
}
