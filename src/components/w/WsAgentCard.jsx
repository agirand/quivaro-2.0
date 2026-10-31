import React from 'react';
import { useWsRecords } from '@/hooks/useWs';
import AgentActionRow from './AgentActionRow';

const Bounds = ({ label, items, tone }) => (
  <div><div className={`text-[10px] uppercase tracking-wider font-bold ${tone}`}>{label}</div><ul className="text-xs text-slate-600 mt-1 space-y-0.5">{items.map((i) => <li key={i}>• {i}</li>)}</ul></div>
);

export default function WsAgentCard({ a }) {
  const { data: acts = [] } = useWsRecords('AgentAction', { agent: a.name }, '-created_date', 6);
  return (
    <section className="card-soft p-5">
      <div className="flex gap-3 items-center">
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${a.tone} text-white font-heading text-lg flex items-center justify-center`}>{a.name[0]}</div>
        <div><h2 className="text-lg text-slate-900 leading-tight">{a.title}</h2><p className="text-xs text-slate-500">{a.responsibility}</p></div>
      </div>
      <p className="text-sm text-slate-600 mt-3">{a.description}</p>
      <div className="grid grid-cols-3 gap-3 mt-4">
        <Bounds label="Can do" items={a.can} tone="text-teal-700" />
        <Bounds label="Needs approval" items={a.approval} tone="text-amber-700" />
        <Bounds label="Never" items={a.never} tone="text-rose-700" />
      </div>
      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Activity history</div>
        {acts.length ? <ul className="space-y-2">{acts.map((x) => <AgentActionRow key={x.id} x={x} />)}</ul> : <p className="text-xs text-slate-400">No delegated work yet. Ask the AI Manager for help with something.</p>}
      </div>
    </section>
  );
}