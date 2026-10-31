import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { today, daysFrom } from '@/lib/format';
import PageHeader from '@/components/q/PageHeader';
import ApprovalCard from '@/components/q/ApprovalCard';
import AgentAvatar from '@/components/q/AgentAvatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const E = base44.entities;

export default function Decisions() {
  const [status, setStatus] = useState('pending');
  const { data: list } = useQuery({ queryKey: ['approvals', status], queryFn: () => E.Approval.filter({ status }, { sort: '-created_date', limit: 50 }) });
  const { data: counts } = useQuery({ queryKey: ['approvalCounts'], queryFn: () => E.Approval.aggregate({ groupBy: 'status' }) });
  const { data: exc } = useQuery({ queryKey: ['exceptions'], queryFn: () => E.Matter.filter({ status: { $ne: 'completed' }, target_date: { $lt: today() } }, { sort: 'target_date', limit: 8 }) });
  const c = (s) => counts?.rows.find((r) => r.status === s)?.count || 0;

  return (
    <div>
      <PageHeader eyebrow="Decision Center" title="What needs your judgment." subtitle="Drafts, recommendations and exceptions from your AI team. Nothing reaches a client until you approve it." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Tabs value={status} onValueChange={setStatus}><TabsList>
            <TabsTrigger value="pending">Pending ({c('pending')})</TabsTrigger><TabsTrigger value="approved">Approved ({c('approved')})</TabsTrigger><TabsTrigger value="rejected">Rejected ({c('rejected')})</TabsTrigger>
          </TabsList></Tabs>
          {list?.items.map((a) => <ApprovalCard key={a.id} a={a} />)}
          {list && !list.items.length && <div className="card-soft p-10 text-center text-sm text-slate-400">Nothing here. Ask Maya to draft reminders or review invoices.</div>}
        </div>
        <aside className="card-soft p-6 h-fit">
          <h2 className="text-lg text-slate-900">Exceptions</h2>
          <p className="text-xs text-slate-500 mb-4">Matters past their internal demo target that may need a human decision.</p>
          <div className="space-y-3">
            {exc?.items.map((m) => (
              <div key={m.id} className="flex gap-3 items-start">
                <AgentAvatar name={m.agent} size="sm" />
                <div className="flex-1 min-w-0"><p className="text-sm text-slate-800 truncate">{m.title}</p><p className="text-[11px] text-slate-500">{m.client_name}</p></div>
                <span className="text-[11px] font-semibold text-rose-600 whitespace-nowrap">{-daysFrom(m.target_date)}d</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}