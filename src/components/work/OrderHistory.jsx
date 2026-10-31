import React from 'react';
import { formatDistanceToNow } from 'date-fns';

export default function OrderHistory({ history = [] }) {
  return (
    <div className="card-soft p-5">
      <div className="text-sm font-medium text-slate-900 mb-3">Audit trail</div>
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {[...history].reverse().map((h, i) => (
          <div key={i} className="text-xs border-l-2 border-slate-200 pl-3">
            <div className="text-slate-800 font-medium">{h.event}</div>
            {h.detail && <div className="text-slate-500 mt-0.5">{h.detail}</div>}
            <div className="text-slate-400 mt-0.5">{formatDistanceToNow(new Date(h.at), { addSuffix: true })}</div>
          </div>
        ))}
      </div>
    </div>
  );
}