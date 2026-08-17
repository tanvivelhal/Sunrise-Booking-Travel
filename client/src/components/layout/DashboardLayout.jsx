import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  ClipboardList,
  Ticket,
  Bell,
  LogOut,
  Menu,
  X,
  CheckSquare,
  BarChart3,
  Users,
  ShieldCheck,
  ChevronsLeft,
  ChevronsRight,
  Command,
  BellRing,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { LogoMark } from '../ui/Logo.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import api from '../../api/client.js';
import { timeAgo } from '../../utils/format.js';

function useNotifications() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/notifications');
      setItems(res.data.results.slice(0, 8));
      setUnread(res.data.unread);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    load();
  };

  return { items, unread, open, setOpen, load, markAll };
}

const NAV_GROUPS = {
  employee: [
    {
      label: 'Workspace',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/travel', label: 'Search Travel', icon: Search },
        { to: '/requests', label: 'My Requests', icon: ClipboardList },
      ],
    },
    {
      label: 'Travel',
      items: [{ to: '/bookings', label: 'My Bookings', icon: Ticket }],
    },
  ],
  manager: [
    {
      label: 'Workspace',
      items: [
        { to: '/manager', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/approvals', label: 'Approvals', icon: CheckSquare },
      ],
    },
    {
      label: 'Travel',
      items: [{ to: '/bookings', label: 'Team Bookings', icon: Ticket }],
    },
  ],
  admin: [
    {
      label: 'Workspace',
      items: [
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      ],
    },
    {
      label: 'Travel',
      items: [
        { to: '/approvals', label: 'Approvals', icon: CheckSquare },
        { to: '/bookings', label: 'All Bookings', icon: Ticket },
      ],
    },
    {
      label: 'Administration',
      items: [
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/admin/policies', label: 'Travel Policies', icon: ShieldCheck },
      ],
    },
  ],
};

function NotificationBell({ variant = 'light' }) {
  const { items, unread, open, setOpen, markAll } = useNotifications();
  const navigate = useNavigate();
  const muted = variant === 'muted' ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative rounded-lg p-2 transition ${muted}`}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-bold text-slate-900">Notifications</p>
              {unread > 0 && (
                <button onClick={markAll} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>
              )}
              {items.map((n) => (
                <button
                  key={n._id}
                  onClick={() => {
                    setOpen(false);
                    if (n.entity === 'Booking' && n.entityId) navigate(`/bookings/${n.entityId}`);
                    else if (n.entity === 'TravelRequest' && n.entityId) navigate('/requests');
                    else navigate('/notifications');
                  }}
                  className={`block w-full border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50 ${n.read ? 'opacity-60' : ''}`}
                >
                  <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.message}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                navigate('/notifications');
              }}
              className="block w-full border-t border-slate-100 px-4 py-2.5 text-center text-xs font-semibold text-brand-600 hover:bg-slate-50"
            >
              View all notifications
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function GlobalSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const boxRef = useRef(null);

  const flatNav = useMemo(() => {
    const groups = NAV_GROUPS[user.role] || NAV_GROUPS.employee;
    return [
      ...groups.flatMap((g) => g.items),
      { to: '/notifications', label: 'Notifications', icon: BellRing },
    ];
  }, [user.role]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flatNav.slice(0, 6);
    return flatNav.filter((i) => i.label.toLowerCase().includes(q)).slice(0, 6);
  }, [query, flatNav]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setFocused(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const go = (to) => {
    setQuery('');
    setFocused(false);
    navigate(to);
  };

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search or jump to…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-9 text-sm text-slate-700 placeholder:text-slate-400 transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:flex">
          <Command size={9} /> K
        </kbd>
      </div>

      {focused && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift">
          <p className="border-b border-slate-100 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Quick navigation
          </p>
          {results.map((i) => (
            <button
              key={i.to}
              onClick={() => go(i.to)}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
            >
              <i.icon size={15} className="text-slate-400" />
              {i.label}
            </button>
          ))}
          {results.length === 0 && (
            <p className="px-3.5 py-4 text-sm text-slate-400">No matching pages for “{query}”.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sunrise_sidebar_collapsed') === '1');
  const [profileOpen, setProfileOpen] = useState(false);

  const groups = NAV_GROUPS[user.role] || NAV_GROUPS.employee;
  const firstTo = groups[0].items[0].to;

  const roleLabel = {
    employee: 'Employee',
    manager: 'Travel Manager',
    admin: 'Travel Administrator',
  }[user.role];

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem('sunrise_sidebar_collapsed', next ? '1' : '0');
      return next;
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = (
    <div className="flex h-full flex-col bg-navy-950 text-white">
      {/* Brand */}
      <div className="flex h-16 items-center justify-between px-4">
        <Link to={firstTo} className="flex items-center gap-2.5 overflow-hidden">
          <LogoMark size={30} />
          {!collapsed && (
            <span className="flex flex-col leading-none">
              <span className="text-[15px] font-extrabold tracking-tight">SUNRISE</span>
              <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">Corporate Travel</span>
            </span>
          )}
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 lg:hidden"
          aria-label="Close menu"
        >
          <X size={17} />
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-2 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-semibold transition ${
                        collapsed ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-brand-600/90 text-white shadow-sm'
                          : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                      }`
                    }
                  >
                    <item.icon size={17} className={collapsed ? '' : 'shrink-0'} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent-400 opacity-0 transition group-hover:opacity-60" />
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Profile + sign out */}
      <div className="border-t border-white/10 p-3">
        <div className={`flex items-center gap-2.5 rounded-lg px-2 py-2 ${collapsed ? 'justify-center' : ''}`}>
          <Avatar name={user.name} size="sm" />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13px] font-bold">{user.name}</p>
              <p className="truncate text-[11px] text-slate-400">{roleLabel}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`mt-1.5 flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden transition-all duration-200 lg:block ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        {SidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 transition-transform lg:hidden">{SidebarContent}</aside>
        </>
      )}

      {/* Main column */}
      <div className={`transition-all duration-200 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}`}>
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <Link to={firstTo} className="flex items-center gap-2">
            <LogoMark size={26} />
            <span className="text-sm font-extrabold tracking-tight text-navy-950">SUNRISE</span>
          </Link>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Desktop header */}
        <header className="sticky top-0 z-20 hidden h-16 items-center gap-6 border-b border-slate-200 bg-white/85 px-6 backdrop-blur lg:flex">
          <button
            onClick={toggleCollapsed}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>

          <GlobalSearch />

          <div className="ml-auto flex items-center gap-2">
            <span className="mr-1 hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 xl:flex">
              <Compass size={13} className="text-accent-600" />
              {user.department || 'Corporate Travel'}
            </span>
            <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-lg border border-transparent py-1 pl-1 pr-2.5 transition hover:bg-slate-100"
              >
                <Avatar name={user.name} size="sm" />
                <span className="hidden leading-tight text-left md:block">
                  <p className="text-[13px] font-bold text-slate-900">{user.name}</p>
                  <p className="text-[11px] text-slate-500">{user.designation || roleLabel}</p>
                </span>
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-lift">
                    <div className="border-b border-slate-100 px-4 py-2.5">
                      <p className="text-sm font-bold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <Link
                      to="/notifications"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <BellRing size={15} className="text-slate-400" /> Notifications
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>

        <footer className="px-6 pb-6 text-center text-xs text-slate-400 lg:text-left">
          SUNRISE · Corporate travel, simplified. © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
