import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Check, Circle, Clock, AlertTriangle, Plug, ChevronDown } from 'lucide-react';
import { TOOL_LABEL, MODE_LABEL } from '@/lib/work';
import StepControls from './StepControls';

const ICON = { done: [Check, 'bg-teal-600 text-white'], awaiting_approval: [Clock, 'bg-amber-100 text-amber-700'], needs_input: [AlertTriangle, 'bg-amber-100 text-amber-700'], needs_connection: [Plug, 'bg-rose-100 text-rose-700'], pending: [Circle, 'bg-slate-100 text-slate-400'] };

export default function StepItem({ s, i, act, busy }) {
  const [open, setOpen] = useState(s.status === 'awaiting_approval');
  const [Icon, cls] = ICON[s.status] || ICON.pending;
  const [mode, modeCls] = MODE_LABEL[s.mode] || MODE_LABEL.not_connected;
  const external = !['workspace', 'ai'].includes(s.tool);
  return (
    <div className="flex gap-3">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${cls}`}><Icon className="w-3.5 h-3.5" /></div>
      <div className="flex-1 min-w-0 pb-5">
        <button onClick={() => setOpen(!open)} className="w-full text-left flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-medium text-slate-900">{s.title}</div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="chip bg-slate-100 text-slate-600">{s.agent}</span>
              <span className="chip bg-slate-100 text-slate-600">{TOOL_LABEL[s.tool] || s.tool}</span>
              {(external || s.mode === 'demo' || s.mode === 'manual') && <span className={`chip ${modeCls}`}>{mode}</span>}
              {s.needs_approval && <span className="chip bg-amber-50 text-amber-700">{s.approved ? 'Approved' : 'Approval gate'}</span>}
            </div>
          </div>
          {s.output && <ChevronDown className={`w-4 h-4 text-slate-400 mt-1 transition ${open ? 'rotate-180' : ''}`} />}
        </button>
        {s.missing && s.status === 'needs_input' && <div className="text-xs text-amber-700 mt-2">Needed: {s.missing}</div>}
        {open && s.output && <div className="prose prose-sm max-w-none mt-3 rounded-xl bg-slate-50 p-3 text-slate-700 overflow-x-auto"><ReactMarkdown>{s.output}</ReactMarkdown></div>}
        <StepControls s={s} i={i} act={act} busy={busy} />
      </div>
    </div>
  );
}