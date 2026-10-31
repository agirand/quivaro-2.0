import React from 'react';
import { Check, X } from 'lucide-react';

export default function CrawlReport({ pages }) {
  const ok = pages.filter((p) => p.ok).length;
  return (
    <details className="text-[11px] text-slate-500 rounded-xl bg-slate-50 px-3 py-2">
      <summary className="cursor-pointer select-none">Pages inspected: {ok} read{pages.length > ok ? `, ${pages.length - ok} could not be inspected` : ''}</summary>
      <ul className="mt-2 space-y-1">
        {pages.map((p) => (
          <li key={p.url} className="flex items-start gap-1.5">
            {p.ok ? <Check className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" /> : <X className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />}
            <a href={p.url} target="_blank" rel="noreferrer" className="underline break-all">{p.url.replace(/^https?:\/\/(www\.)?/, '')}</a>
            {!p.ok && <span className="text-rose-600 whitespace-nowrap">· {p.error}</span>}
          </li>
        ))}
      </ul>
    </details>
  );
}