import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Sparkles, Users, LayoutGrid, Gavel, Building2, Loader2, PlayCircle, Wand2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { resetDemo, syncInvoiceStatuses } from '@/lib/seed';
import ResetButton from './ResetButton';

const NAV = [
  ['/pulse', 'Business Pulse', Activity], ['/tour', 'Demo Tour', PlayCircle], ['/maya', 'Ask Maya', Sparkles], ['/team', 'AI Team', Users],
  ['/workboard', 'Workboard', LayoutGrid], ['/decisions', 'Decision Center', Gavel], ['/clients', 'Clients', Building2],
  ['/w', 'My Workspace', Wand2],
];

export default function Layout() {
  const qc = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const { data: pending = 0 } = useQuery({ queryKey: ['pendingCount'], queryFn: () => base44.entities.Approval.count({ status: 'pending' }) });

  useEffect(() => {
    base44.entities.Client.count({}).then(async (n) => {
      if (n === 0) { setSeeding(true); await resetDemo(); setSeeding(false); }
      else await syncInvoiceStatuses();
      qc.invalidateQueries();
    });
  }, []);

  const link = ({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap ${isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <aside className="lg:w-64 lg:fixed lg:inset-y-0 border-b lg:border-b-0 lg:border-r border-slate-200/70 bg-[#F1F4F7]/80 backdrop-blur p-4 lg:p-5 flex flex-col gap-4 z-20">
        <div className="flex items-center justify-between lg:block">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-teal-700 text-white font-heading text-lg flex items-center justify-center">Q</div>
            <div>
              <div className="font-heading text-xl text-slate-900 leading-none">Quivaro</div>
              <div className="text-[10px] text-slate-500 mt-1 tracking-wide">AI Business Operating Team</div>
            </div>
          </div>
          <span className="lg:hidden text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800">DEMO MODE</span>
        </div>
        <nav className="flex lg:flex-col gap-1 overflow-x-auto -mx-1 px-1 lg:mt-4">
          {NAV.map(([to, name, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'} className={link}>
              <Icon className="w-4 h-4" /> {name}
              {to === '/decisions' && pending > 0 && <span className="ml-auto text-[10px] font-bold bg-teal-500 text-white rounded-full px-1.5 py-0.5">{pending}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="hidden lg:block mt-auto space-y-3">
          <div className="rounded-xl bg-amber-50 border border-amber-200/70 p-3">
            <div className="text-[11px] font-bold text-amber-800 tracking-wide">DEMO MODE</div>
            <p className="text-[11px] text-amber-800/80 mt-1 leading-relaxed">Fictional data only. No emails, filings or payments are sent. Dates are internal demo targets, not statutory deadlines.</p>
          </div>
          <div className="text-[11px] text-slate-500 px-1">Delaware Valley Business Services<br />Bristol, PA</div>
          <ResetButton />
        </div>
      </aside>
      <main className="flex-1 lg:ml-64 px-4 md:px-10 py-8 md:py-10 max-w-[1400px] w-full">
        <div className="lg:hidden mb-4"><ResetButton /></div>
        {seeding ? (
          <div className="flex flex-col items-center justify-center py-40 text-slate-500 gap-3"><Loader2 className="w-6 h-6 animate-spin text-teal-600" />Setting up the demo business…</div>
        ) : <Outlet />}
      </main>
    </div>
  );
}