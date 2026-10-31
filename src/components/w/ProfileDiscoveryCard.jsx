import React, { useState } from 'react';
import { Check, X, Loader2, Globe } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useWsRefresh } from '@/hooks/useWs';

const SRC = { public_web: 'Website', search_result: 'Search result', conversation: 'Your chat', owner_edit: 'Your edit', existing: 'Current profile' };

export default function ProfileDiscoveryCard({ d }) {
  const options = d.fields?.options || [];
  const [value, setValue] = useState(options[0]?.value || '');
  const [busy, setBusy] = useState(null);
  const refresh = useWsRefresh();
  const decide = async (decision) => {
    setBusy(decision);
    await base44.functions.invoke('reviewDiscovery', { id: d.id, decision, value });
    await refresh();
  };
  return (
    <div className="card-soft p-5">
      <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700">Company profile · {d.name}</span>
      <p className="text-sm text-slate-700 mt-2">{d.reason}</p>
      <div className="space-y-2 mt-3">
        {options.map((o) => (
          <label key={o.value} className={`flex gap-3 rounded-xl border p-3 cursor-pointer transition ${value === o.value ? 'border-teal-400 bg-teal-50/40' : 'border-slate-200 hover:border-slate-300'}`}>
            <input type="radio" checked={value === o.value} onChange={() => setValue(o.value)} className="mt-1 accent-teal-600" />
            <div className="min-w-0 text-xs">
              <div className="text-sm font-medium text-slate-900">{o.value}{o.label && <span className="text-slate-400 font-normal"> · {o.label}</span>}</div>
              <div className="text-slate-500 mt-0.5 flex items-center gap-1"><Globe className="w-3 h-3" />{SRC[o.source] || o.source}{o.source_url?.startsWith('http') && <a href={o.source_url} target="_blank" rel="noreferrer" className="underline truncate">{o.source_url.replace(/^https?:\/\/(www\.)?/, '')}</a>}</div>
              {o.excerpt && o.excerpt !== o.value && <div className="italic text-slate-500 mt-1">“{o.excerpt}”</div>}
            </div>
          </label>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={() => decide('approve')} disabled={!!busy || !value} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-60">{busy === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}This one is current</button>
        <button onClick={() => decide('reject')} disabled={!!busy} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50 disabled:opacity-60"><X className="w-4 h-4" />None of these</button>
      </div>
    </div>
  );
}