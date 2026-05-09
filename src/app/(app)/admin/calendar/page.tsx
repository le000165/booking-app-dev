import { redirect } from 'next/navigation';

export default function AdminCalendarPage() {
  redirect('/admin?tab=appointments&view=calendar');
}
