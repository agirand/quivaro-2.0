import React from 'react';
import { Play, Loader2 } from 'lucide-react';
import useDelegatedRun from '@/hooks/useDelegatedRun';
import MessageBubble from '@/components/maya/MessageBubble';
import DelegationSteps from '@/components/maya/DelegationSteps';

export default function TourStep({ step, onDone, children }) {
  const r = useDelegatedRun();
  const start = async () => { await r.run(step.command); onDone?.(); };
  return (
    <div className="space-y-5">
      <div className="card-soft p-5 md:p-6">
        <p className="text-sm text-slate-500">{step.why}</p>
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-800 italic">“{step.command}”</div>
        {!r.result && (
          <button onClick={start} disabled={r.running} className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 active:scale-95 transition disabled:opacity-60">
            {r.running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}{r.running ? 'Maya is delegating…' : 'Send to Maya'}
          </button>
        )}
      </div>
      {r.running && r.steps.length > 0 && <DelegationSteps steps={r.steps} done={r.done} />}
      {r.result && <MessageBubble m={{ role: 'maya', text: r.result.text, payload: r.result }} />}
      {r.result && children}
    </div>
  );
}