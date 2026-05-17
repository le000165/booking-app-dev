'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname, useSearchParams } from 'next/navigation';
import { CalendarDays, Clock3, LogOut, Menu, Settings, Users, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const DESKTOP_NAV = [
  { href: '/admin?tab=appointments&view=calendar', label: 'Appointments', icon: CalendarDays, key: 'appointments' },
  { href: '/admin?tab=availability', label: 'Availability', icon: Clock3, key: 'availability' },
  { href: '/admin?tab=services', label: 'Services', icon: Settings, key: 'services' },
  { href: '/admin?tab=staff', label: 'Staff', icon: Users, key: 'staff' },
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const tabParam = searchParams.get('tab');
  const viewParam = searchParams.get('view');

  const currentSection = useMemo(
    () => getCurrentSection(pathname, tabParam),
    [pathname, tabParam]
  );
  const isCalendarView = currentSection === 'appointments' && viewParam === 'calendar';

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

  useEffect(() => {
    if (!mobileSidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileSidebarOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileSidebarOpen]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname, searchParams]);

  const renderSidebarContent = (variant: 'desktop' | 'mobile') => (
    <>
      <div className="admin-sidebar-header">
        <div className="admin-brand-mark" aria-hidden="true">
          {businessName.charAt(0).toUpperCase()}
        </div>
        <div className="admin-brand-block">
          <p className="admin-brand-eyebrow">Dashboard</p>
          <p className="admin-brand-title">{businessName}</p>
          <Link
            href={bookingPath}
            className="admin-brand-link"
            onClick={() => {
              if (variant === 'mobile') setMobileSidebarOpen(false);
            }}
          >
            {bookingPath}
          </Link>
        </div>
        {variant === 'mobile' && (
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="admin-sidebar-close"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="admin-nav" aria-label="Admin navigation">
        {DESKTOP_NAV.map(item => {
          const Icon = item.icon;
          const active = currentSection === item.key;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${active ? 'active' : ''}`}
              title={item.label}
              aria-current={active ? 'page' : undefined}
              onClick={() => {
                if (variant === 'mobile') setMobileSidebarOpen(false);
              }}
            >
              <Icon size={20} />
              <span className="admin-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <button
          type="button"
          onClick={handleSignOut}
          className="admin-nav-item admin-signout"
          title="Sign out"
        >
          <LogOut size={20} />
          <span className="admin-nav-label">Sign out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar admin-sidebar-desktop hidden md:flex">
        {renderSidebarContent('desktop')}
      </aside>

      {mobileSidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-backdrop md:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={`admin-sidebar admin-sidebar-mobile md:hidden ${
          mobileSidebarOpen ? 'is-open' : ''
        }`}
        aria-hidden={!mobileSidebarOpen}
      >
        {renderSidebarContent('mobile')}
      </aside>

      <div className={`admin-main ${isCalendarView ? 'admin-main-calendar' : ''}`}>
        <div className="admin-mobile-topbar md:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="admin-mobile-menu-btn"
            aria-label="Open navigation"
            aria-expanded={mobileSidebarOpen}
          >
            <Menu size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
