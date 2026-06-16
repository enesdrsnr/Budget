import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Receipt, Coffee, BarChart3, PiggyBank } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Özet', id: 'nav-dashboard' },
  { to: '/gelir', icon: TrendingUp, label: 'Gelir', id: 'nav-income' },
  { to: '/yükümler', icon: Receipt, label: 'Gider', id: 'nav-obligations' },
  { to: '/sosyal', icon: Coffee, label: 'Sosyal', id: 'nav-social' },
  { to: '/ipo', icon: BarChart3, label: 'IPO', id: 'nav-ipo' },
  { to: '/tasarruf', icon: PiggyBank, label: 'Birikim', id: 'nav-savings' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 nav-glow"
      style={{
        background: 'linear-gradient(180deg, rgba(11,15,26,0) 0%, rgba(11,15,26,0.98) 20%)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2">
        {navItems.map(({ to, icon: Icon, label, id }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              id={id}
              className={`bottom-nav-item flex-1 max-w-[68px] ${
                isActive
                  ? 'text-accent-blue'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-accent-blue/15' : ''
              }`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {isActive && (
                  <span className="absolute inset-0 rounded-xl bg-accent-blue/10 blur-sm" />
                )}
              </div>
              <span className={`text-[10px] font-medium leading-none ${
                isActive ? 'text-accent-blue' : 'text-white/35'
              }`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
