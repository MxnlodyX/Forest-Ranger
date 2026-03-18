import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { CircleUserRound, FileWarning, House, ListChecks, Map } from 'lucide-react';

const navItems = [
  { to: '/field-ops/home', label: 'Home', icon: House },
  { to: '/field-ops/map', label: 'Map', icon: Map },
  { to: '/field-ops/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/field-ops/report', label: 'Report', icon: FileWarning },
  { to: '/field-ops/profile', label: 'Profile', icon: CircleUserRound },
];

export function FieldOpsLayout() {
  return (
    <div className="min-h-screen bg-[#111820] text-slate-200 font-sans flex justify-center pb-24">
      <div className="w-full max-w-md px-4 py-6">
        <Outlet />
      </div>

      <nav className="fixed bottom-0 w-full max-w-md bg-[#0f1721] border-t border-[#1e293b] flex justify-between items-center px-3 py-3 pb-6 z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-2 py-1 rounded-md ${
                  isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`
              }
            >
              <Icon size={20} />
              <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
