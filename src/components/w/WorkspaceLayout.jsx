import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft } from 'lucide-react';
import { ensureOrg } from '@/lib/workspace';
import { WS_NAV } from './wsNav';
import ReviewBadge from './ReviewBadge';

export default function WorkspaceLayout() {
  const { data: org } = useQuery({ queryKey: ['ws', 'org'], queryFn: ensureOrg, staleTime: Infinity });
  const link = ({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap ${isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`;
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <aside className="lg:w-64 lg:fixed lg:inset-y-0 border-b lg:border-b-0 lg:border-r border-slate-200/70 bg-[#F1F4F7]/80 backdrop-blur p-4 lg:p-5 flex flex-col gap-4 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-teal-700 text-white font-heading text-lg flex items-center justify-center">Q</div>
          <div className="min-w-0">
            <div className="font-heading text-xl text-slate-900 leading-none">Quivaro</div>
            <div className="text-[10px] text-slate-500 mt-1 truncate">{org?.name || 'Your business workspace'}</div>
          </div>
        </div>
        <nav className="flex lg:flex-col gap-1 overflow-x-auto -mx-1 px-1 lg:mt-4">
          {WS_NAV.map(([to, name, Icon]) => (
            <NavLink key={to} to={to} end={to === '/w'} className={link}>
              <Icon className="w-4 h-4" /> {name}
              {to === '/w/review' && org && <ReviewBadge orgId={org.id} />}
            </NavLink>
          ))}
        </nav>
        <Link to="/" className="hidden lg:flex mt-auto items-center gap-2 text-xs text-slate-500 hover:text-slate-900 px-1"><ArrowLeft className="w-3.5 h-3.5" />Founder demo (Delaware Valley)</Link>
      </aside>
      <main className="flex-1 lg:ml-64 px-4 md:px-10 py-6 md:py-10 max-w-[1400px] w-full">
        {org ? <Outlet context={{ org }} /> : <div className="flex flex-col items-center py-40 text-slate-500 gap-3"><Loader2 className="w-6 h-6 animate-spin text-teal-600" />Preparing your workspace…</div>}
      </main>
    </div>
  );
}