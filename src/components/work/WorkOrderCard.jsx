import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, AlertCircle } from 'lucide-react';
import StatusPill from './StatusPill';

export default function WorkOrderCard({ o }) {
  const done = (o.steps || []).filter((s) => s.status === 'done').length;
  return (
    <Link to={`/w/work/${o.id}`} className="card-soft p-4 block hover:-translate-y-0.5 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-slate-900 truncate">{o.title}</div>
          <div className="text-xs text-slate-500 mt-0.5">{done} of {(o.steps || []).length} steps{o.due_date ? ` · due ${o.due_date}` : ''}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0"><StatusPill status={o.status} /><ChevronRight className="w-4 h-4 text-slate-400" /></div>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 mt-3 overflow-hidden"><div className="h-full bg-gradient-to-r from-teal-500 to-sky-500 transition-all" style={{ width: `${o.progress || 0}%` }} /></div>
      {o.needs_from_customer && <div className="flex items-start gap-1.5 text-xs text-amber-700 mt-2.5"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{o.needs_from_customer}</div>}
    </Link>
  );
}