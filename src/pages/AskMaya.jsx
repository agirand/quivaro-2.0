import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { runCommand, SUGGESTIONS } from '@/lib/maya';
import MessageBubble from '@/components/maya/MessageBubble';
import DelegationSteps from '@/components/maya/DelegationSteps';
import AgentAvatar from '@/components/q/AgentAvatar';

const E = base44.entities;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function AskMaya() {
  const qc = useQueryClient();
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(null);
  const end = useRef(null);
  const { data: msgs = [] } = useQuery({ queryKey: ['chat'], queryFn: async () => (await E.ChatMessage.filter({}, { sort: 'created_date', limit: 200 })).items });

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length, pending]);

  const send = async (text) => {
    if (!text.trim() || pending) return;
    setInput('');
    setPending({ steps: [], done: 0 });
    await E.ChatMessage.create({ role: 'user', text });
    await qc.invalidateQueries({ queryKey: ['chat'] });
    const res = await runCommand(text);
    const steps = res.steps || [];
    for (let i = 0; i <= steps.length; i++) { setPending({ steps, done: i }); await wait(600); }
    await E.ChatMessage.create({ role: 'maya', text: res.text, payload: { steps, table: res.table, actions: res.actions, links: res.links } });
    await qc.invalidateQueries();
    setPending(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 pb-5 border-b border-slate-200/70">
        <AgentAvatar name="Maya" size="lg" />
        <div><h1 className="text-2xl text-slate-900">Ask Maya</h1><p className="text-sm text-slate-500">Your AI Chief of Staff. Give her an objective and she'll coordinate the team.</p></div>
      </div>
      <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-1">
        {msgs.map((m) => <MessageBubble key={m.id} m={m} />)}
        {pending && (
          <div className="flex gap-3"><AgentAvatar name="Maya" /><div className="flex-1 max-w-3xl">
            {pending.steps.length ? <DelegationSteps steps={pending.steps} done={pending.done} /> : <div className="card-soft px-4 py-3 text-sm text-slate-500 inline-flex gap-1">Maya is thinking<span className="animate-pulse">…</span></div>}
          </div></div>
        )}
        <div ref={end} />
      </div>
      <div className="pt-3">
        <div className="flex gap-2 overflow-x-auto pb-3">
          {SUGGESTIONS.map((s) => <button key={s} disabled={!!pending} onClick={() => send(s)} className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-teal-400 hover:text-teal-800 transition disabled:opacity-50">{s}</button>)}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="card-soft flex items-center gap-2 p-2 pl-4">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Give Maya an objective…" className="flex-1 bg-transparent outline-none text-sm py-2" />
          <button disabled={!!pending || !input.trim()} className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center disabled:opacity-30 transition"><ArrowUp className="w-4 h-4" /></button>
        </form>
      </div>
    </div>
  );
}