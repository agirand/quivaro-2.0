import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Briefcase, FileWarning, DollarSign, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { today, inDays, money, fdate, daysFrom } from '@/lib/format';
import PulseHero from '@/components/q/PulseHero';
import StatCard from '@/components/q/StatCard';
import ActivityFeed from '@/components/q/ActivityFeed';
import AgentAvatar from '@/components/q/AgentAvatar';
import ARBreakdown from '@/components/q/ARBreakdown';

const E = base44.entities;

export default function Pulse() {
  const { data: d } = useQuery({
    queryKey: ['pulse'],
    queryFn: async () => {
      const t = today();
      const [lateCount, clients, onboarding, open, docs, pending, ar, upcoming, late, activity] = await Promise.all([
        E.Matter.count({ status: { $ne: 'completed' }, target_date: { $lt: t } }),
        E.Client.count({ status: 'active' }), E.Client.count({ status: 'onboarding' }), E.Matter.count({ status: { $ne: 'completed' } }),
        E.DocumentRequest.count({ status: 'outstanding' }), E.Approval.count({ status: 'pending' }),
        E.Invoice.aggregate({ groupBy: 'status', sum: ['amount'] }),
        E.Matter.filter({ status: { $ne: 'completed' }, target_date: { $gte: t, $lte: inDays(14) } }, { sort: 'target_date', limit: 7 }),
        E.Matter.filter({ status: { $ne: 'completed' }, target_date: { $lt: t } }, { sort: 'target_date', limit: 6 }),
        E.Activity.filter({}, { sort: '-created_date', limit: 8 }),
      ]);
      const r = (s) => ar.rows.find((x) => x.status === s) || { count: 0, sum_amount: 0 };
      return { lateCount, clients, onboarding, open, docs, pending, paid: r('paid'), openInv: r('open'), overdue: r('overdue'), upcoming: upcoming.items, late: late.items, activity: activity.items };
    },
  });

  return (
    <div>
      <PulseHero d={d} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard label="Active clients" value={d?.clients} hint={`${d?.onboarding ?? 0} onboarding`} icon={Building2} />
        <StatCard label="Open matters" value={d?.open} hint={`${d?.lateCount ?? 0} past internal target`} icon={Briefcase} tone="text-sky-600 bg-sky-50" />
        <StatCard label="Receivables outstanding" value={d && money(d.openInv.sum_amount + d.overdue.sum_amount)} hint={d && `${money(d.overdue.sum_amount)} overdue`} icon={DollarSign} tone="text-indigo-600 bg-indigo-50" />
        <StatCard label="Docs awaiting clients" value={d?.docs} hint={`${d?.pending ?? 0} decisions pending`} icon={FileWarning} tone="text-amber-600 bg-amber-50" />
      </div>
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <section className="card-soft p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4"><AlertTriangle className="w-4 h-4 text-rose-500" /><h2 className="text-lg text-slate-900">Requires attention</h2></div>
          <div className="divide-y divide-slate-100">
            {d?.late.map((m) => (
              <Link to={`/clients/${m.client_code}`} key={m.id} className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg">
                <AgentAvatar name={m.agent} size="sm" />
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-800 truncate">{m.title}</p><p className="text-xs text-slate-500">{m.client_name}</p></div>
                <span className="text-xs font-semibold text-rose-600">{-daysFrom(m.target_date)}d past target</span>
              </Link>
            ))}
            {d && !d.late.length && <p className="text-sm text-slate-400 py-4">Everything is on track.</p>}
          </div>
        </section>
        <ARBreakdown d={d} />
        <section className="card-soft p-6 lg:col-span-2">
          <h2 className="text-lg text-slate-900 mb-4">Upcoming internal targets · 14 days</h2>
          <div className="divide-y divide-slate-100">
            {d?.upcoming.map((m) => (
              <Link to={`/clients/${m.client_code}`} key={m.id} className="flex items-center gap-4 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg">
                <div className="w-12 text-center"><div className="text-[10px] uppercase text-slate-400">{fdate(m.target_date).slice(0, 3)}</div><div className="font-heading text-xl text-slate-900">{fdate(m.target_date).split(' ')[1].replace(',', '')}</div></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-800 truncate">{m.title}</p><p className="text-xs text-slate-500">{m.client_name} · {m.agent}</p></div>
              </Link>
            ))}
          </div>
        </section>
        <section className="card-soft p-6">
          <h2 className="text-lg text-slate-900 mb-4">AI team activity</h2>
          <ActivityFeed items={d?.activity} />
        </section>
      </div>
    </div>
  );
}