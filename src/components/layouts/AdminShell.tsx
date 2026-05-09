'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname, useSearchParams } from 'next/navigation';
import { CalendarDays, Clock3, LogOut, Settings, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const DESKTOP_NAV = [
  { href: '/admin?tab=appointments&view=calendar', label: 'Appointments', icon: CalendarDays, key: 'appointments' },
  { href: '/admin?tab=availability', label: 'Availability', icon: Clock3, key: 'availability' },
  { href: '/admin?tab=services', label: 'Services', icon: Settings, key: 'services' },
  { href: '/admin?tab=staff', label: 'Staff', icon: Users, key: 'staff' },
];

const MOBILE_NAV = [
  { href: '/admin?tab=appointments', label: 'Home', icon: CalendarDays, key: 'appointments' },
  { href: '/admin?tab=appointments&view=calendar', label: 'Calendar', icon: CalendarDays, key: 'appointments-calendar' },
  { href: '/admin?tab=staff', label: 'Staff', icon: Users, key: 'staff' },
  { href: '/admin?tab=services', label: 'Services', icon: Settings, key: 'services' },
  { href: '/admin?tab=availability', label: 'More', icon: Settings, key: 'availability' },
];

type AdminSection = 'appointments' | 'availability' | 'services' | 'staff';

function getCurrentSection(pathname: string, tab: string | null): AdminSection {
  if (tab === 'availability' || pathname === '/admin/availability') return 'availability';
  if (tab === 'services' || pathname === '/admin/services') return 'services';
  if (tab === 'staff' || pathname === '/admin/staff') return 'staff';
  return 'appointments';
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const [businessName, setBusinessName] = useState('Dashboard');
  const [bookingPath, setBookingPath] = useState('/book');
  const tabParam = searchParams.get('tab');
  const viewParam = searchParams.get('view');

  const currentSection = useMemo(
    () => getCurrentSection(pathname, tabParam),
    [pathname, tabParam]
  );
  const isCalendarWorkspace = currentSection === 'appointments' && viewParam === 'calendar';
  useEffect(() => {
    let cancelled = false;

    async function loadBusinessDetails() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: member } = await supabase
        .from('team_members')
        .select('business_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      const businessId = (member as { business_id?: string } | null)?.business_id;
      if (!businessId || cancelled) return;

      const { data: business } = await supabase
        .from('businesses')
        .select('name, slug')
        .eq('id', businessId)
        .maybeSingle();

      if (!business || cancelled) return;

      const slug = (business as { slug?: string }).slug;
      setBusinessName((business as { name?: string }).name || 'Dashboard');
      setBookingPath(slug ? `/${slug}/book` : '/book');
    }

    loadBusinessDetails();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar hidden md:flex">
        <div className="admin-brand">
          <p className="admin-brand-eyebrow">DASHBOARD</p>
          <p className="admin-brand-title">{businessName}</p>
          <Link href={bookingPath} className="admin-brand-link">
            {bookingPath}
          </Link>
        </div>
        <nav className="admin-nav">
          {DESKTOP_NAV.map(item => {
            const Icon = item.icon;
            const active = currentSection === item.key;
            return (
              <Link key={item.href} href={item.href} className={`admin-nav-item ${active ? 'active' : ''}`}>
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <button type="button" onClick={handleSignOut} className="admin-nav-item admin-signout">
            <LogOut size={20} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className={`admin-main ${isCalendarWorkspace ? 'admin-main-calendar' : ''}`}>
        {children}
      </div>

      <nav className="admin-mobile-nav md:hidden">
        {MOBILE_NAV.map(item => {
          const Icon = item.icon;
          const active = item.key === 'appointments-calendar'
            ? currentSection === 'appointments' && viewParam === 'calendar'
            : currentSection === item.key;
          return (
            <Link key={item.href} href={item.href} className={`admin-mobile-item ${active ? 'active' : ''}`}>
              <Icon size={17} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
