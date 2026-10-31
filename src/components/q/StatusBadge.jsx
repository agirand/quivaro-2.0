import React from 'react';
import { label } from '@/lib/format';

const MAP = {
  completed: 'bg-emerald-50 text-emerald-700', done: 'bg-emerald-50 text-emerald-700', paid: 'bg-emerald-50 text-emerald-700', approved: 'bg-emerald-50 text-emerald-700', received: 'bg-emerald-50 text-emerald-700', active: 'bg-emerald-50 text-emerald-700',
  in_progress: 'bg-sky-50 text-sky-700', open: 'bg-sky-50 text-sky-700', review: 'bg-indigo-50 text-indigo-700', onboarding: 'bg-indigo-50 text-indigo-700',
  waiting_client: 'bg-amber-50 text-amber-700', pending: 'bg-amber-50 text-amber-700', outstanding: 'bg-amber-50 text-amber-700', medium: 'bg-amber-50 text-amber-700',
  overdue: 'bg-rose-50 text-rose-700', rejected: 'bg-rose-50 text-rose-700', high: 'bg-rose-50 text-rose-700',
  not_started: 'bg-slate-100 text-slate-600', todo: 'bg-slate-100 text-slate-600', low: 'bg-slate-100 text-slate-600', inactive: 'bg-slate-100 text-slate-600',
};

export default function StatusBadge({ status }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${MAP[status] || 'bg-slate-100 text-slate-600'}`}>{label(status)}</span>;
}