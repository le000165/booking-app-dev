import { redirect } from 'next/navigation';

export default function AdminStaffPage() {
  redirect('/admin?tab=staff');
}
