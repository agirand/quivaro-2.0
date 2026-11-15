import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ArrowRight, CalendarDays } from 'lucide-react';

const STATUS = { proposed: 'Waiting for your go-ahead', created: 'Scoped', discarded: 'Set aside', superseded: 'Replaced by an updated request' };

export default function WorkDraftCard({ d, onAction, busy }) {
  const open = d.status === 'proposed';
  return (
    <div className={`rounded-2xl border bg-white p-4 space-y-3 ${open ? 'border-teal-200 shadow-sm' : 'border-slate-200 opacity-80'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-teal-700 font-semibold"><ClipboardList className="w-3.5 h-3.5" />Work request</div>
        <span className="text-[11px] text-slate-500">{STATUS[d.status]}</span>
      </div>
      <div>
        <div className="font-heading text-lg text-slate-900 leading-snug">{d.title}</div>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {d.template_name && <span className="chip bg-slate-100 text-slate-700">{d.template_name}</span>}
          {d.due_date && <span className="chip bg-slate-100 text-slate-700"><CalendarDays className="w-3 h-3" />Due {d.due_date}</span>}
        </div>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{d.request}</p>
      {d.missing?.length > 0 && (
        <div className="text-xs text-slate-500">
          <div className="font-medium text-slate-700 mb-1">Still unknown (you can add these later)</div>
          <ul className="list-disc pl-4 space-y-0.5">{d.missing.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      )}
      {open && onAction && (
        <div className="flex flex-wrap gap-2 pt-1">
          <button disabled={busy} onClick={() => onAction('Yes, scope this work.', 'confirm_work')} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-50">Scope this work<ArrowRight className="w-3.5 h-3.5" /></button>
          <button disabled={busy} onClick={() => onAction('Not now, set this request aside.', 'discard_work')} className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">Not now</button>
        </div>
      )}
      {d.status === 'created' && d.order_id && <Link to={`/w/work/${d.order_id}`} className="inline-flex items-center gap-1 text-sm text-teal-700 hover:underline">Open work order<ArrowRight className="w-3.5 h-3.5" /></Link>}
    </div>
  );
}