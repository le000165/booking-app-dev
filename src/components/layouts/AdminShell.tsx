'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePathname, useSearchParams } from 'next/navigation';
import { CalendarDays, ChevronDown, Clock3, LogOut, Menu, Settings, Users, X, type LucideIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type AdminSection = 'appointments' | 'availability' | 'services' | 'staff';
type AppointmentSection = 'overview' | 'calendar';
type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  key: AdminSection;
  children?: {
    href: string;
    label: string;
    key: AppointmentSection;
  }[];
};

const ADMIN_NAV: AdminNavItem[] = [
  {
    href: '/admin/appointments',
    label: 'Appointments',
    icon: CalendarDays,
    key: 'appointments',
    children: [
      { href: '/admin/appointments', label: 'Overview', key: 'overview' },
      { href: '/admin/appointments/calendar', label: 'Calendar', key: 'calendar' },
    ],
  },
  { href: '/admin/availability', label: 'Availability', icon: Clock3, key: 'availability' },
  { href: '/admin/services', label: 'Services', icon: Settings, key: 'services' },
  { href: '/admin/staff', label: 'Staff', icon: Users, key: 'staff' },
];

function getCurrentSection(pathname: string, tab: string | null): AdminSection {
  if (tab === 'availability' || pathname === '/admin/availability') return 'availability';
  if (tab === 'services' || pathname === '/admin/services') return 'services';
  if (tab === 'staff' || pathname === '/admin/staff') return 'staff';
  return 'appointments';
}

function getCurrentAppointmentSection(pathname: string, view: string | null): AppointmentSection {
  if (
    view === 'calendar' ||
    pathname === '/admin/calendar' ||
    pathname === '/admin/appointments/calendar'
  ) {
    return 'calendar';
  }
  return 'overview';
}

function getAdminDocumentTitle(
  pathname: string,
  tab: string | null,
  view: string | null,
  section: AdminSection,
  appointmentSection: AppointmentSection
) {
  if (pathname === '/admin' && !tab && !view) return 'Appointment - Overview';
  if (section === 'availability') return 'Availability';
  if (section === 'services') return 'Services';
  if (section === 'staff') return 'Staff';
  if (appointmentSection === 'calendar') return 'Appointment - Calendar';
  return 'Appointment - Overview';
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const [businessName, setBusinessName] = useState('Dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const tabParam = searchParams.get('tab');
  const viewParam = searchParams.get('view');

  const currentSection = useMemo(
    () => getCurrentSection(pathname, tabParam),
    [pathname, tabParam]
  );
  const currentAppointmentSection = useMemo(
    () => getCurrentAppointmentSection(pathname, viewParam),
    [pathname, viewParam]
  );

  useEffect(() => {
    document.title = getAdminDocumentTitle(
      pathname,
      tabParam,
      viewParam,
      currentSection,
      currentAppointmentSection
    );
  }, [currentAppointmentSection, currentSection, pathname, tabParam, viewParam]);

  // Click-based expand state for parent nav items with children.
  // null = all collapsed. Uses the section key as the value.
  //
  // Syncs with top-level section changes:
  //   - entering appointments from outside → auto-open
  //   - leaving appointments → auto-close
  // Clicking the parent while already in that section toggles without
  // triggering the effect (section doesn't change on same-section click).
  const [expandedKey, setExpandedKey] = useState<AdminSection | null>(null);

  useEffect(() => {
    if (currentSection === 'appointments') {
      setExpandedKey('appointments');
    } else {
      setExpandedKey(null);
    }
  }, [currentSection]);

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

      setBusinessName((business as { name?: string }).name || 'Dashboard');
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
          <Image
            src="/brand/logo-mark.svg"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7"
          />
        </div>
        <div className="admin-brand-block">
          <p className="admin-brand-title">{businessName}</p>
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
        {ADMIN_NAV.map(item => {
          const Icon = item.icon;
          const active = currentSection === item.key;
          const isExpanded = expandedKey === item.key;
          const childrenId = item.children ? `nav-${item.key}-children` : undefined;

          return (
            <div key={item.href} className="admin-nav-group">
              {item.children ? (
                // Parent items with a submenu: toggle-only, never navigate or close sidebar
                <button
                  type="button"
                  className={`admin-nav-item w-full ${active ? 'active-parent' : ''}`}
                  title={item.label}
                  aria-expanded={isExpanded}
                  aria-controls={childrenId}
                  onClick={() => {
                    setExpandedKey(prev => prev === item.key ? null : item.key);
                  }}
                >
                  <Icon size={17} className="shrink-0" />
                  <span className="admin-nav-label">{item.label}</span>
                  <ChevronDown
                    size={13}
                    className="admin-nav-chevron"
                    style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>
              ) : (
                // Leaf items: navigate and close mobile sidebar
                <Link
                  href={item.href}
                  className={`admin-nav-item ${active ? 'active' : ''}`}
                  title={item.label}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => {
                    if (variant === 'mobile') setMobileSidebarOpen(false);
                  }}
                >
                  <Icon size={17} className="shrink-0" />
                  <span className="admin-nav-label">{item.label}</span>
                </Link>
              )}

              {item.children && (
                <div
                  className={`admin-nav-children ${isExpanded ? 'is-open' : 'is-closed'}`}
                  id={childrenId}
                  aria-hidden={!isExpanded}
                >
                  <div className="admin-nav-children-inner">
                    {item.children.map(child => {
                      const childActive = currentAppointmentSection === child.key;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`admin-nav-subitem ${childActive ? 'active' : ''}`}
                          aria-current={childActive ? 'page' : undefined}
                          tabIndex={isExpanded ? 0 : -1}
                          onClick={() => {
                            if (variant === 'mobile') setMobileSidebarOpen(false);
                          }}
                        >
                          <span className="admin-nav-label">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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

      <div className="admin-main">
        <div className="admin-mobile-topbar md:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="admin-mobile-menu-btn"
            aria-label="Open navigation"
            aria-expanded={mobileSidebarOpen}
          >
            <Menu size={18} />
          </button>
          <span className="ml-3 text-[14px] font-semibold text-[var(--text-primary)] truncate">
            <Image
              src="/brand/logo-mark.svg"
              alt="Vero"
              width={28}
              height={28}
              className="mr-2 inline-block h-7 w-7 align-middle"
            />
            {businessName}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
