import React from 'react';
import { AGENTS, STAFF } from '@/lib/agents';
import PageHeader from '@/components/q/PageHeader';
import AgentCard from '@/components/q/AgentCard';

export default function AITeam() {
  return (
    <div>
      <PageHeader eyebrow="Your AI team" title="Six agents, one Chief of Staff." subtitle="Maya coordinates the specialists. Each one supports a human counterpart at the firm." />
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">{AGENTS.map((a) => <AgentCard key={a.name} agent={a} />)}</div>
      <section className="card-soft p-6 mt-8">
        <h2 className="text-lg text-slate-900 mb-4">Human team · 10 employees</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {STAFF.map((s) => <div key={s.name} className="rounded-xl bg-slate-50 p-3"><div className="text-sm font-semibold text-slate-800">{s.name}</div><div className="text-[11px] text-slate-500">{s.role}</div></div>)}
        </div>
      </section>
    </div>
  );
}