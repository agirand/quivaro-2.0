import React, { useState } from 'react';
import { Check, X, Loader2, GitMerge } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useWsRefresh } from '@/hooks/useWs';
import { TYPE_META } from '@/lib/workspace';
import SourceBadge from './SourceBadge';
import ProfileDiscoveryCard from './ProfileDiscoveryCard';

export default function DiscoveryCard({ d }) {
  if (d.entity_type === 'profile') return <ProfileDiscoveryCard d={d} />;
  return <RecordDiscoveryCard d={d} />;
}

function RecordDiscoveryCard({ d }) {
  const [name, setName] = useState(d.name);
  const [busy, setBusy] = useState(null);
  const refresh = useWsRefresh();
  const decide = async (decision) => {
    setBusy(decision);
    await base44.functions.invoke('reviewDiscovery', { id: d.id, decision, name });
    await refresh();
  };
  return (
    <div className="card-soft p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700">{TYPE_META[d.entity_type]?.label} · {Math.round((d.confidence ?? 0) * 100)}% confident</span>
        <SourceBadge r={d} />
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full font-semibold text-slate-900 bg-transparent border-b border-dashed border-slate-200 focus:border-teal-500 focus:outline-none py-1" />
      <div className="text-xs text-slate-500 mt-2 flex flex-wrap gap-x-3">{Object.entries(d.fields || {}).map(([k, v]) => <span key={k}><span className="text-slate-400">{k.replace(/_/g, ' ')}:</span> {v}</span>)}</div>
      <p className="text-sm text-slate-700 mt-3">{d.reason}</p>
      {d.possible_match && <p className="text-xs text-sky-800 bg-sky-50 rounded-lg px-2.5 py-1.5 mt-2 flex items-center gap-1.5"><GitMerge className="w-3.5 h-3.5" />Possible match: <b>{d.possible_match}</b>. Rename above to merge into it.</p>}
      <div className="flex gap-2 mt-4">
        <button onClick={() => decide('approve')} disabled={!!busy} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-60">{busy === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}Confirm</button>
        <button onClick={() => decide('reject')} disabled={!!busy} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50 disabled:opacity-60"><X className="w-4 h-4" />Reject</button>
      </div>
    </div>
  );
}