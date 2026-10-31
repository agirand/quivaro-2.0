import React, { useState } from 'react';
import { Globe, MapPin, Check, X, Loader2, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useWsRefresh } from '@/hooks/useWs';

export default function MatchCards({ m }) {
  const p = m.payload;
  const [busy, setBusy] = useState(null);
  const refresh = useWsRefresh();
  const pending = p.match_status === 'pending';
  const decide = async (decision, index) => {
    setBusy(`${decision}${index ?? ''}`);
    await base44.functions.invoke('companyMatch', { message_id: m.id, decision, index });
    await refresh();
    setBusy(null);
  };
  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1"><Search className="w-3 h-3" />Live web search results</div>
      {p.candidates.map((c, i) => {
        const chosen = p.match_status === 'confirmed' && p.chosen === i;
        return (
          <div key={c.website} className={`rounded-2xl border bg-white p-4 transition ${chosen ? 'border-teal-400 ring-2 ring-teal-100' : 'border-slate-200'} ${!pending && !chosen ? 'opacity-50' : ''}`}>
            <div className="font-semibold text-slate-900 text-sm">{c.name}</div>
            <a href={c.website} target="_blank" rel="noreferrer" className="text-xs text-teal-700 flex items-center gap-1 mt-0.5 hover:underline"><Globe className="w-3 h-3" />{c.website.replace(/^https?:\/\//, '')}</a>
            {c.location && <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{c.location}</div>}
            {c.description && <p className="text-xs text-slate-600 mt-2 leading-relaxed">{c.description}</p>}
            {pending && (
              <button onClick={() => decide('yes', i)} disabled={!!busy} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-60">
                {busy === `yes${i}` ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Reading up to 10 pages…</> : <><Check className="w-3.5 h-3.5" />Yes, that's us</>}
              </button>
            )}
            {chosen && <div className="mt-2 text-xs font-semibold text-teal-700 flex items-center gap-1"><Check className="w-3.5 h-3.5" />Confirmed</div>}
          </div>
        );
      })}
      {pending && <button onClick={() => decide('no')} disabled={!!busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs hover:bg-slate-50 disabled:opacity-60"><X className="w-3.5 h-3.5" />No, {p.candidates.length > 1 ? 'none of these' : 'not us'}</button>}
    </div>
  );
}