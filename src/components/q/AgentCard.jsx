import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { fdate } from '@/lib/format';
import AgentAvatar from './AgentAvatar';
import ActivityFeed from './ActivityFeed';

const E = base44.entities;

export default function AgentCard({ agent }) {
  const { data } = useQuery({
    queryKey: ['agent', agent.name],
    queryFn: async () => {
      const [open, done, tasks, act] = await Promise.all([
        E.Task.count({ agent: agent.name, status: { $ne: 'done' } }), E.Task.count({ agent: agent.name, status: 'done' }),
        E.Task.filter({ agent: agent.name, status: { $ne: 'done' } }, { sort: 'due_date', limit: 3 }),
        E.Activity.filter({ agent: agent.name }, { sort: '-created_date', limit: 3 }),
      ]);
      return { open, done, tasks: tasks.items, act: act.items };
    },
  });
  const busy = (data?.open || 0) > 0;
  return (
    <div className="card-soft p-6 flex flex-col">
      <div className="flex items-start gap-4">
        <AgentAvatar name={agent.name} size="lg" />
        <div className="flex-1">
          <div className="flex items-center gap-2"><h3 className="text-xl text-slate-900">{agent.name}</h3>
            <span className={`flex items-center gap-1 text-[11px] font-semibold ${busy ? 'text-teal-700' : 'text-slate-400'}`}><span className={`w-1.5 h-1.5 rounded-full ${busy ? 'bg-teal-500 animate-pulse' : 'bg-slate-300'}`} />{busy ? 'Working' : 'Available'}</span></div>
          <p className="text-xs text-slate-500">{agent.title}</p>
        </div>
      </div>
      <p className="text-sm text-slate-600 mt-4">{agent.tagline}</p>
      <div className="flex flex-wrap gap-1.5 mt-3">{agent.responsibilities.map((r) => <span key={r} className={`text-[11px] px-2 py-0.5 rounded-full ${agent.soft}`}>{r}</span>)}</div>
      <div className="grid grid-cols-2 gap-3 my-5">
        <div className="rounded-xl bg-slate-50 p-3"><div className="font-heading text-2xl text-slate-900">{data?.open ?? '—'}</div><div className="text-[11px] text-slate-500">Current assignments</div></div>
        <div className="rounded-xl bg-slate-50 p-3"><div className="font-heading text-2xl text-slate-900">{data?.done ?? '—'}</div><div className="text-[11px] text-slate-500">Tasks completed</div></div>
      </div>
      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Up next</div>
      <ul className="space-y-1.5 mb-5">{data?.tasks.map((t) => <li key={t.id} className="text-sm text-slate-700 flex justify-between gap-2"><span className="truncate">{t.title}</span><span className="text-xs text-slate-400 shrink-0">{fdate(t.due_date)}</span></li>)}
        {data && !data.tasks.length && <li className="text-sm text-slate-400">No open assignments.</li>}</ul>
      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-3">Recent activity</div>
      <ActivityFeed items={data?.act} />
    </div>
  );
}