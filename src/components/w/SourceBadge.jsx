import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { base44 } from '@/api/base44Client';

function SourceDetail({ r }) {
  const { data: ref } = useQuery({ queryKey: ['ws', 'src', r.source_ref], enabled: r.source === 'discovery' && !!r.source_ref, queryFn: () => base44.entities.SourceRef.get(r.source_ref) });
  return (
    <div className="space-y-2 text-xs">
      <div className="font-semibold text-slate-900">Source</div>
      <div className="text-slate-600 break-all">{r.source === 'public_web' ? <>Public website: <a href={r.source_ref} target="_blank" rel="noreferrer" className="text-teal-700 underline">{r.source_ref}</a></> : r.source === 'discovery' ? `${ref?.title || 'Connected system'}${ref?.is_sample ? ' (sample data)' : ''}` : r.source === 'conversation' ? 'Your conversation with the AI Manager' : 'Entered manually'}</div>
      {r.source_excerpt && <blockquote className="border-l-2 border-teal-400 pl-2 italic text-slate-600">“{r.source_excerpt}”</blockquote>}
      <div className="text-slate-400">Discovered {new Date(r.created_date).toLocaleString()} · updated {new Date(r.updated_date || r.created_date).toLocaleString()}</div>
      <div className="text-slate-400">{r.verification === 'confirmed' ? 'Confirmed by you' : 'Not yet confirmed'} · confidence {Math.round((r.confidence ?? 1) * 100)}%</div>
    </div>
  );
}

export default function SourceBadge({ r }) {
  const ok = r.verification === 'confirmed';
  return (
    <Popover>
      <PopoverTrigger className={`chip ${ok ? 'bg-emerald-50 text-emerald-800' : 'bg-sky-50 text-sky-800'} hover:brightness-95`}>
        {ok ? <ShieldCheck className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}{ok ? 'Confirmed' : 'AI-learned'} · {r.source === 'public_web' ? 'website' : r.source === 'discovery' ? 'discovery' : 'chat'}
      </PopoverTrigger>
      <PopoverContent className="w-72"><SourceDetail r={r} /></PopoverContent>
    </Popover>
  );
}