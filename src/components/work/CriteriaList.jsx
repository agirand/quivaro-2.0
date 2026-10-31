import React from 'react';
import { CheckCircle2, XCircle, Circle } from 'lucide-react';

export default function CriteriaList({ criteria = [] }) {
  return (
    <div className="space-y-2.5">
      {criteria.map((c, i) => {
        const Icon = c.met === true ? CheckCircle2 : c.met === false ? XCircle : Circle;
        const cls = c.met === true ? 'text-teal-600' : c.met === false ? 'text-rose-500' : 'text-slate-300';
        return (
          <div key={i} className="flex gap-2 text-sm">
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cls}`} />
            <div><div className="text-slate-800">{c.text}</div>{c.evidence && <div className="text-xs text-slate-500 mt-0.5">Evidence: {c.evidence}</div>}</div>
          </div>
        );
      })}
    </div>
  );
}