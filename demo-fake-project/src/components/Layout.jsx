import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

import {
  LuLayoutDashboard,
  LuUsers,
  LuMessageSquare,
  LuMail,
  LuSettings,
  LuLogOut,
  LuMenu,
} from 'react-icons/lu';

/** Sidebar links. `Icon` ek component hai, is liye naam bare harf se shuru hota hai. */
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', Icon: LuLayoutDashboard },
  { to: '/contacts', label: 'Contacts', Icon: LuUsers },
  { to: '/replies', label: 'Replies', Icon: LuMessageSquare },
  { to: '/templates', label: 'Email Templates', Icon: LuMail },
  { to: '/settings', label: 'Settings', Icon: LuSettings },
];

/** App shell — sidebar + top bar. Mobile par sidebar drawer ban jata hai. */
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ---------------- Sidebar ---------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 text-slate-300 transition-transform duration-200
                    lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-extrabold text-white">
            X
          </div>
          <div>
            <p className="text-sm font-bold text-white">XPORTYN</p>
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Sales Tracker</p>
          </div>
        </div>

        <nav className="space-y-1 p-3">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-slate-800 p-4">
          <p className="text-xs text-slate-500">Logged in as</p>
          <p className="text-sm font-semibold text-white">{user?.username || 'admin'}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold
                       text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <LuLogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ---------------- Main area ---------------- */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <LuMenu className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-800">XPORTYN Sales Tracker</h1>
            <p className="text-xs text-slate-500">Outreach & follow-up management</p>
          </div>

          {/* Nayi reply ki live khabar -- Socket.IO se aati hai */}
          <NotificationBell />

          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-8 w-8 rounded-full bg-brand-100 text-center text-sm font-bold leading-8 text-brand-700">
              {(user?.username || 'A')[0].toUpperCase()}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
