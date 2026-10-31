import React from 'react';
import { TOOL_LABEL, MODE_LABEL } from '@/lib/work';

export default function EvidenceList({ evidence = [] }) {
  if (!evidence.length) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Actions taken</div>
      <div className="space-y-1.5">
        {evidence.map((e, i) => {
          const external = !['workspace', 'ai'].includes(e.tool);
          const [m, cls] = MODE_LABEL[e.mode] || MODE_LABEL.not_connected;
          return (
            <div key={i} className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-700">{e.step}</span>
              <span className="chip bg-slate-100 text-slate-600">{e.agent} · {TOOL_LABEL[e.tool] || e.tool}</span>
              {(external || e.mode === 'demo' || e.mode === 'manual') && <span className={`chip ${cls}`}>{m}</span>}
              {e.approved && <span className="chip bg-amber-50 text-amber-700">Owner approved</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}