import { Suspense, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { Spinner } from './ui';

const NAV = [
  { to: '/', label: 'Dashboard', end: true, icon: GridIcon },
  { to: '/products', label: 'Products', icon: TagIcon },
  { to: '/categories', label: 'Categories', icon: FolderIcon },
  { to: '/banners', label: 'Hero Banners', icon: ImageIcon },
  { to: '/homepage', label: 'Homepage', icon: LayoutIcon },
  { to: '/inventory', label: 'Inventory', icon: BoxIcon },
  { to: '/orders', label: 'Orders', icon: CartIcon },
  { to: '/reports', label: 'Reports', icon: ChartIcon },
  { to: '/customers', label: 'Customers', icon: UsersIcon },
  { to: '/wholesale', label: 'Wholesale', icon: TruckIcon },
  { to: '/coupons', label: 'Coupons', icon: TicketIcon },
  { to: '/settings', label: 'Site Settings', icon: CogIcon },
  { to: '/audit', label: 'Audit Log', icon: ClockIcon },
  { to: '/users', label: 'Admin Users', icon: ShieldIcon, superOnly: true },
];

export function AdminLayout() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 transform bg-charcoal text-white transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 px-6 py-5">
          <span className="font-display text-xl font-semibold">TAAJ</span>
          <span className="text-xs text-white/50">Admin</span>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {NAV.filter((item) => !item.superOnly || user?.role === 'SUPER_ADMIN').map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon /> {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-black/5 bg-white px-4 py-3 sm:px-6">
          <button className="rounded-lg p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <BarsIcon />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-charcoal">{user?.name}</p>
              <p className="text-xs text-charcoal/40">{user?.role.replace('_', ' ')}</p>
            </div>
            <button
              onClick={doLogout}
              className="rounded-lg border border-brand/30 px-3 py-1.5 text-sm text-brand-deep hover:bg-brand-soft/40"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Suspense fallback={<div className="flex h-64 items-center justify-center"><Spinner className="h-8 w-8" /></div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

/* — inline icons — */
function GridIcon() { return <Svg><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></Svg>; }
function TagIcon() { return <Svg><path d="M20 12l-8 8-8-8V4h8z" /><circle cx="8" cy="8" r="1.5" /></Svg>; }
function FolderIcon() { return <Svg><path d="M3 6h6l2 2h10v10H3z" /></Svg>; }
function ImageIcon() { return <Svg><path d="M3 5h18v14H3z" /><circle cx="8.5" cy="10" r="1.5" /><path d="M21 16l-5-5-6 6" /></Svg>; }
function LayoutIcon() { return <Svg><path d="M3 4h18v16H3zM3 9h18M9 9v11" /></Svg>; }
function CogIcon() { return <Svg><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></Svg>; }
function ShieldIcon() { return <Svg><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /><path d="M9.5 12l1.8 1.8L15 10" /></Svg>; }
function TruckIcon() { return <Svg><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></Svg>; }
function ClockIcon() { return <Svg><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>; }
function ChartIcon() { return <Svg><path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" /></Svg>; }
function TicketIcon() { return <Svg><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z" /><path d="M15 6v12" strokeDasharray="2 2" /></Svg>; }
function BoxIcon() { return <Svg><path d="M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7" /></Svg>; }
function CartIcon() { return <Svg><path d="M6 7h13l-1.5 9H7.5zM6 7L5 3H3" /></Svg>; }
function UsersIcon() { return <Svg><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.7" /></Svg>; }
function BarsIcon() { return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" /></svg>; }
function Svg({ children }: { children: React.ReactNode }) {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}
