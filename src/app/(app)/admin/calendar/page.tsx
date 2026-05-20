import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Appointment - Calendar',
};

export default function AdminCalendarPage() {
  redirect('/admin/appointments/calendar');
}
