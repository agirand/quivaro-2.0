import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { FileCheck2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useWorkAction } from '@/hooks/useWorkAction';
import CriteriaList from './CriteriaList';
import EvidenceList from './EvidenceList';

const LABEL = { ready: ['Ready for you', 'bg-teal-50 text-teal-700'], accepted: ['Accepted', 'bg-emerald-50 text-emerald-700'], revision_requested: ['Revision requested', 'bg-violet-50 text-violet-700'] };

export default function DeliverableCard({ d, order }) {
  const { act, busy } = useWorkAction(d.work_order_id);
  const [open, setOpen] = useState(false);
  const [revise, setRevise] = useState(false);
  const [note, setNote] = useState('');
  const [label, cls] = LABEL[d.status] || LABEL.ready;
  const download = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([`# ${d.title}\n\n${d.summary || ''}\n\n${d.content || ''}`], { type: 'text/markdown' })); a.download = `${d.title}.md`; a.click(); };
  const canDecide = order?.status === 'delivered' && d.status === 'ready';
  return (
    <div className="card-soft p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3 min-w-0"><div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0"><FileCheck2 className="w-4 h-4" /></div>
          <div className="min-w-0"><div className="font-medium text-slate-900">{d.title}</div>{order && <Link to={`/w/work/${order.id}`} className="text-xs text-slate-500 hover:text-slate-900">View work order</Link>}</div></div>
        <span className={`chip shrink-0 ${cls}`}>{label}</span>
      </div>
      {d.summary && <p className="text-sm text-slate-600 mt-3">{d.summary}</p>}
      <div className="flex flex-wrap gap-2 mt-4">
        <Button size="sm" variant="outline" onClick={() => setOpen(!open)}>{open ? 'Hide details' : 'View output & evidence'}</Button>
        <Button size="sm" variant="ghost" onClick={download}><Download className="w-4 h-4 mr-1" />Download</Button>
        {canDecide && !revise && <><Button size="sm" disabled={!!busy} onClick={() => act('accept')}>{busy === 'accept' ? 'Accepting…' : 'Accept'}</Button><Button size="sm" variant="outline" onClick={() => setRevise(true)}>Request revision</Button></>}
        {order?.status === 'accepted' && !order.is_demo && <Button size="sm" variant="ghost" onClick={() => setRevise(true)}>Reopen</Button>}
      </div>
      {revise && <div className="mt-3 space-y-2"><Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="What should be different?" /><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setRevise(false)}>Back</Button><Button size="sm" disabled={!!busy || !note.trim() || order?.is_demo} onClick={() => act('rework', { note })}>{busy ? 'Working…' : 'Send for revision'}</Button></div>{order?.is_demo && <p className="text-xs text-slate-400">Revisions aren't available on the demo.</p>}</div>}
      {open && <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
        <div className="prose prose-sm max-w-none text-slate-700 overflow-x-auto"><ReactMarkdown>{d.content || ''}</ReactMarkdown></div>
        <div><div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Quality checks</div><CriteriaList criteria={d.quality_checks} /></div>
        <EvidenceList evidence={d.evidence} />
      </div>}
    </div>
  );
}