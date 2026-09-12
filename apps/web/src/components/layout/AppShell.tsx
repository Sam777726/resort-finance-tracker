import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { NAV_ITEMS } from './navItems';
import { useAuthStore } from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';
import { useLiveInvalidation } from '../../hooks/useLiveInvalidation';
import { Toaster } from '../ui/Toaster';

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const role = useAuthStore((s) => s.user?.role);
  const items = NAV_ITEMS.filter((item) => !('adminOnly' in item) || !item.adminOnly || role === 'admin');
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold',
              isActive ? 'bg-accentsoft text-accentstrong' : 'text-inkdim hover:text-ink',
            )
          }
        >
          <span className="w-[18px] text-center">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  useLiveInvalidation();

  return (
    <div>
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/35 z-[29] lg:hidden" onClick={() => setDrawerOpen(false)} />
      )}
      <aside
        className={clsx(
          'fixed top-0 left-0 bottom-0 w-[250px] bg-surface z-30 p-2.5 pt-[calc(1rem+env(safe-area-inset-top))] overflow-y-auto transition-transform lg:hidden',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="font-display font-bold text-lg text-accentstrong px-3 pb-1">🏕️ Camp Dilly</div>
        {user && (
          <div className="px-3 pb-4 mb-2.5 border-b border-border text-xs text-inkdim">
            <b className="block text-ink text-sm mb-0.5">{user.name}</b>
            {user.role}
          </div>
        )}
        <NavList onNavigate={() => setDrawerOpen(false)} />
      </aside>

      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] bg-surface border-b border-border">
        <button className="lg:hidden p-2.5 flex flex-col gap-1" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <span className="w-5 h-0.5 bg-ink rounded" />
          <span className="w-5 h-0.5 bg-ink rounded" />
          <span className="w-5 h-0.5 bg-ink rounded" />
        </button>
        <div className="font-display font-bold text-lg text-accentstrong flex-1 truncate">🏕️ Camp Dilly Ledger</div>
        {user && (
          <div className="text-right text-xs text-inkdim hidden sm:block">
            <b className="text-ink text-sm block">{user.name}</b>
            {user.role}
          </div>
        )}
        <button
          onClick={() => logout.mutate()}
          className="bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-sm flex-shrink-0"
        >
          Log out
        </button>
      </header>

      <div className="flex max-w-[1280px] mx-auto">
        <aside className="hidden lg:block w-[220px] flex-shrink-0 border-r border-border p-2.5 sticky top-[53px] h-[calc(100vh-53px)] overflow-y-auto">
          <NavList />
        </aside>
        <main className="flex-1 min-w-0 px-4 py-4.5 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}
