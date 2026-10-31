import React from 'react';
import { money } from '@/lib/format';

export default function ARBreakdown({ d }) {
  const rows = d ? [['Paid (period)', d.paid, 'bg-emerald-500'], ['Open, not yet due', d.openInv, 'bg-sky-500'], ['Overdue', d.overdue, 'bg-rose-500']] : [];
  const max = Math.max(1, ...rows.map((r) => r[1].sum_amount));
  return (
    <section className="card-soft p-6">
      <h2 className="text-lg text-slate-900 mb-5">Accounts receivable</h2>
      <div className="space-y-5">
        {rows.map(([name, r, color]) => (
          <div key={name}>
            <div className="flex justify-between text-sm"><span className="text-slate-600">{name}</span><span className="font-semibold text-slate-900 tabular-nums">{money(r.sum_amount)}</span></div>
            <div className="h-2 rounded-full bg-slate-100 mt-2 overflow-hidden"><div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${(r.sum_amount / max) * 100}%` }} /></div>
            <div className="text-[11px] text-slate-400 mt-1">{r.count} invoices</div>
          </div>
        ))}
      </div>
    </section>
  );
}