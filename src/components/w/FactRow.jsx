import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { FACT_STATUS, factStatus, confirmFields } from '@/lib/facts';

export default function FactRow({ org, k, label, onChange }) {
  const [busy, setBusy] = useState(false);
  const st = factStatus(org, k);
  const f = org.profile_facts?.[k];
  const meta = FACT_STATUS[st];
  const confirm = async () => { setBusy(true); await confirmFields(org.id, { [k]: org[k] }); await onChange(); setBusy(false); };
  return (
    <div className="flex gap-2 items-start">
      <dt className="text-slate-400 w-24 shrink-0">{label}</dt>
      <dd className="flex-1 min-w-0">
        <div className="text-slate-700 line-clamp-2">{org[k]}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`chip !py-0.5 ${meta.cls}`} title={f?.excerpt ? `“${f.excerpt}”` : undefined}>{meta.label}</span>
          {f?.source_url?.startsWith('http') && <a href={f.source_url} target="_blank" rel="noreferrer" className="text-[10px] text-teal-700 underline truncate max-w-[110px]">{f.source_url.replace(/^https?:\/\/(www\.)?/, '')}</a>}
          {st !== 'confirmed' && (
            <button onClick={confirm} disabled={busy} className="text-[10px] font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center gap-0.5">
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}Confirm
            </button>
          )}
        </div>
      </dd>
    </div>
  );
}