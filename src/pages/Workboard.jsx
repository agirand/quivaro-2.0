import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { fdate, label } from '@/lib/format';
import PageHeader from '@/components/q/PageHeader';
import DataTable from '@/components/q/DataTable';
import StatusBadge from '@/components/q/StatusBadge';
import Progress from '@/components/q/Progress';
import AgentAvatar from '@/components/q/AgentAvatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const E = base44.entities;
const NEXT = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
const TYPES = ['all', 'accounting', 'tax', 'registration', 'licensing', 'bookkeeping', 'compliance'];

export default function Workboard() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('matters');
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');
  const query = { ...(q && { client_name: { $regex: q, $options: 'i' } }) };
  const { data: matters } = useQuery({ queryKey: ['matters', type, q], enabled: tab === 'matters', queryFn: () => E.Matter.filter({ ...query, ...(type !== 'all' && { type }) }, { sort: 'target_date', limit: 100 }) });
  const { data: tasks } = useQuery({ queryKey: ['tasks', q], enabled: tab === 'tasks', queryFn: () => E.Task.filter(query, { sort: '-created_date', limit: 100 }) });

  const cycle = async (t) => { await E.Task.update(t.id, { status: NEXT[t.status] }); qc.invalidateQueries(); };
  const who = (n, s) => <div className="flex items-center gap-2"><AgentAvatar name={n} size="sm" /><div><div className="text-xs font-semibold">{n}</div><div className="text-[11px] text-slate-400">{s}</div></div></div>;

  return (
    <div>
      <PageHeader eyebrow="Workboard" title="Every matter, every task." subtitle="Client work in flight, with AI agents paired to the human staff who own it." />
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="matters">Client matters</TabsTrigger><TabsTrigger value="tasks">Tasks</TabsTrigger></TabsList></Tabs>
        <div className="relative flex-1 max-w-sm"><Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by client…" className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-teal-400" /></div>
        {tab === 'matters' && <select value={type} onChange={(e) => setType(e.target.value)} className="text-sm rounded-lg border border-slate-200 bg-white px-3 py-2">{TYPES.map((t) => <option key={t} value={t}>{label(t === 'all' ? 'all types' : t)}</option>)}</select>}
      </div>
      <div className="card-soft">
        {tab === 'matters' ? (
          <DataTable columns={['Client', 'Matter', 'Type', 'Owner', 'Status', 'Progress', 'Internal target']}
            rows={(matters?.items || []).map((m) => [<Link to={`/clients/${m.client_code}`} className="font-medium text-slate-900 hover:text-teal-700">{m.client_name}</Link>, m.title, label(m.type), who(m.agent, m.staff), <StatusBadge status={m.status} />, <Progress value={m.progress} />, fdate(m.target_date)])} />
        ) : (
          <DataTable columns={['Task', 'Client', 'Owner', 'Priority', 'Due', 'Status']}
            rows={(tasks?.items || []).map((t) => [<div><div className="font-medium text-slate-900">{t.title}</div>{t.source === 'maya' && <div className="text-[11px] text-teal-600">Created by Maya</div>}</div>, t.client_code ? <Link to={`/clients/${t.client_code}`} className="hover:text-teal-700">{t.client_name}</Link> : t.client_name, who(t.agent, t.staff), <StatusBadge status={t.priority} />, fdate(t.due_date),
              <button onClick={() => cycle(t)} title="Click to advance"><StatusBadge status={t.status} /></button>])} />
        )}
      </div>
    </div>
  );
}