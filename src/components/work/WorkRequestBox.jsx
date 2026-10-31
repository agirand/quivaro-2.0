import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';

const EXAMPLE = 'Onboard our 3 new clients, collect missing documents, and prepare their files for review by Friday.';

export default function WorkRequestBox({ templates = [], initialTemplate = '' }) {
  const nav = useNavigate();
  const [text, setText] = useState('');
  const [tpl, setTpl] = useState(initialTemplate);
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    const res = await base44.functions.invoke('scopeWork', { request: text, template_key: tpl, due_date: due }).catch((e) => ({ data: { error: e.response?.data?.error || e.message } }));
    setBusy(false);
    if (res.data?.id) nav(`/w/work/${res.data.id}`);
    else toast({ title: 'Could not scope that work', description: res.data?.error, variant: 'destructive' });
  };
  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#0E1F3B] via-[#12305A] to-[#0F4C5C] text-white p-5 md:p-8 relative overflow-hidden">
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-teal-400/20 blur-3xl" />
      <div className="relative">
        <div className="text-[11px] uppercase tracking-[0.2em] text-teal-200/90">Quivaro does the work</div>
        <h1 className="text-2xl md:text-4xl font-heading mt-2 leading-tight">What needs to get done?</h1>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder={EXAMPLE} className="mt-5 w-full rounded-2xl bg-white/10 border border-white/15 p-4 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-300/50 resize-none" />
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <select value={tpl} onChange={(e) => setTpl(e.target.value)} className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-sm [&>option]:text-slate-900">
            <option value="">Let Quivaro choose a template</option>
            {templates.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
          </select>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-sm [color-scheme:dark]" />
          <button onClick={submit} disabled={busy || !text.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-slate-900 px-5 py-2.5 text-sm font-semibold disabled:opacity-50 transition hover:bg-teal-50">
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" />Scoping…</> : <>Create Work Order<ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
        <p className="text-[11px] text-white/50 mt-3">Quivaro scopes the work first. Nothing runs until you approve the plan.</p>
      </div>
    </div>
  );
}