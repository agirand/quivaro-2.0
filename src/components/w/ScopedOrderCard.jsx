import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ArrowRight } from 'lucide-react';

export default function ScopedOrderCard({ o }) {
  return (
    <Link to={`/w/work/${o.id}`} className="flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50/50 p-3.5 hover:bg-teal-50 transition">
      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0"><Briefcase className="w-4 h-4" /></div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-slate-900 truncate">{o.title}</div>
        <div className="text-xs text-slate-500">{o.steps} steps · {o.approvals} approval points{o.inputs?.length ? ` · ${o.inputs.length} details needed` : ''}</div>
      </div>
      <span className="inline-flex items-center gap-1 text-sm text-teal-700 font-medium whitespace-nowrap">Review & approve<ArrowRight className="w-3.5 h-3.5" /></span>
    </Link>
  );
}