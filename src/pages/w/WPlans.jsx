import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Heart } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useOrg } from '@/hooks/useWs';
import { useQueryClient } from '@tanstack/react-query';
import { PLANS } from '@/lib/work';

export default function WPlans() {
  const org = useOrg();
  const qc = useQueryClient();
  const [plan, setPlan] = useState(org.plan || 'starter');
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const { data: used = 0 } = useQuery({ queryKey: ['ws', 'usage', org.id], queryFn: () => base44.entities.WorkOrder.count({ org_id: org.id, is_demo: { $ne: true }, status: { $ne: 'cancelled' }, created_date: { $gte: start.toISOString() } }) });
  const { data: bonus } = useQuery({ queryKey: ['ws', 'bonus', org.id], queryFn: () => base44.entities.WorkOrder.aggregate({ query: { org_id: org.id, bonus_status: 'pledged' }, sum: ['bonus_amount'] }) });
  const cur = PLANS.find((p) => p.id === plan);
  const choose = async (id) => { setPlan(id); await base44.entities.Organization.update(org.id, { plan: id }); qc.invalidateQueries({ queryKey: ['ws', 'org'] }); };
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl text-slate-900 mb-1">Plan & usage</h1>
      <p className="text-sm text-slate-500 mb-6">A simple monthly plan covers your everyday work. When Quivaro delivers something especially valuable, you can choose to add a bonus. Never automatic.</p>
      <div className="card-soft p-5 mb-6 grid sm:grid-cols-3 gap-4">
        <div><div className="text-xs text-slate-500">This month</div><div className="text-2xl font-heading text-slate-900">{used} / {cur.included}</div><div className="text-xs text-slate-500">work orders used</div></div>
        <div className="sm:col-span-1"><div className="h-2 rounded-full bg-slate-100 mt-6 overflow-hidden"><div className="h-full bg-teal-500" style={{ width: `${Math.min(100, (used / cur.included) * 100)}%` }} /></div></div>
        <div className="flex items-center gap-2 text-sm text-slate-600"><Heart className="w-4 h-4 text-rose-500" />${bonus?.rows?.[0]?.sum_bonus_amount || 0} in bonuses pledged</div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <div key={p.id} className={`card-soft p-5 ${plan === p.id ? 'ring-2 ring-teal-600' : ''}`}>
            <div className="font-heading text-xl text-slate-900">{p.name}</div>
            <div className="mt-2"><span className="text-3xl font-heading text-slate-900">${p.price}</span><span className="text-sm text-slate-500">/mo</span></div>
            <p className="text-sm text-slate-500 mt-2">{p.about}</p>
            <div className="flex items-center gap-2 text-sm text-slate-700 mt-3"><Check className="w-4 h-4 text-teal-600" />{p.included} work orders included</div>
            <div className="flex items-center gap-2 text-sm text-slate-700 mt-1"><Check className="w-4 h-4 text-teal-600" />Optional post-delivery bonus</div>
            <button onClick={() => choose(p.id)} disabled={plan === p.id} className="w-full mt-5 rounded-xl py-2 text-sm font-medium bg-slate-900 text-white disabled:bg-slate-100 disabled:text-slate-500">{plan === p.id ? 'Current plan' : `Choose ${p.name}`}</button>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-4">Illustrative pricing. Billing is not active yet: choosing a plan or pledging a bonus doesn't charge you.</p>
    </div>
  );
}