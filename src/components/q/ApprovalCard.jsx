import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X, Pencil, Loader2 } from 'lucide-react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { decide } from '@/lib/approvals';
import { label } from '@/lib/format';
import AgentAvatar from './AgentAvatar';
import StatusBadge from './StatusBadge';

export default function ApprovalCard({ a }) {
  const qc = useQueryClient();
  const [edit, setEdit] = useState(false);
  const [subject, setSubject] = useState(a.subject || '');
  const [body, setBody] = useState(a.body || '');
  const [busy, setBusy] = useState(null);
  const act = async (d) => { setBusy(d); await decide(a, d, edit ? { subject, body } : undefined); await qc.invalidateQueries(); setBusy(null); setEdit(false); };
  const pending = a.status === 'pending';
  return (
    <div className="card-soft p-5">
      <div className="flex items-start gap-3">
        <AgentAvatar name={a.agent} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h3 className="font-body font-semibold text-slate-900">{a.title}</h3><StatusBadge status={a.status} />
            {a.language === 'es' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700">ES</span>}</div>
          <p className="text-xs text-slate-500 mt-0.5">{a.client_code ? <Link to={`/clients/${a.client_code}`} className="hover:text-teal-700 underline-offset-2 hover:underline">{a.client_name}</Link> : a.client_name} · drafted by {a.agent} · {label(a.kind)} · {moment(a.created_date).fromNow()}</p>
        </div>
      </div>
      {a.matter_title && <p className="text-xs text-slate-600 mt-3">Matter: <Link to={`/clients/${a.client_code}`} className="font-semibold text-teal-700 hover:underline">{a.matter_title}</Link></p>}
      {a.rationale && <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2 mt-4">{a.rationale}</p>}
      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
        {edit ? (<>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full text-sm font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 mb-2" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2" />
        </>) : (<>
          <div className="text-sm font-semibold text-slate-800 mb-2">{a.subject}</div>
          <div className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{a.body}</div>
        </>)}
      </div>
      {pending && (
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => act('approved')} disabled={!!busy} className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition">{busy === 'approved' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{edit ? 'Save & approve' : 'Approve'}</button>
          <button onClick={() => setEdit(!edit)} className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition"><Pencil className="w-4 h-4" />{edit ? 'Cancel edit' : 'Edit'}</button>
          <button onClick={() => act('rejected')} disabled={!!busy} className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg text-rose-600 hover:bg-rose-50 transition">{busy === 'rejected' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}Reject</button>
          <span className="text-[11px] text-slate-400 self-center ml-auto">Demo: approval marks it sent, but nothing is actually sent</span>
        </div>
      )}
    </div>
  );
}