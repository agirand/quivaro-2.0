import React, { useState } from 'react';
import moment from 'moment';
import { useWsRecords } from '@/hooks/useWs';
import { CHANNELS } from '@/lib/channels';
import ManagerChat from '@/components/w/ManagerChat';
import DemoChannel from '@/components/w/DemoChannel';

export default function WConversations() {
  const { data: convos = [] } = useWsRecords('Conversation', {}, 'created_date', 50);
  const [sel, setSel] = useState(null);
  const active = convos.find((c) => c.id === sel) || convos[0];
  return (
    <div>
      <h1 className="text-3xl text-slate-900 mb-1">Conversations</h1>
      <p className="text-sm text-slate-500 mb-6">One inbox. Every channel feeds the same AI Manager.</p>
      <div className="grid md:grid-cols-[280px_1fr] gap-4">
        <ul className="card-soft p-2 space-y-1 h-fit">
          {convos.map((c) => {
            const ch = CHANNELS[c.channel];
            return (
              <li key={c.id}>
                <button onClick={() => setSel(c.id)} className={`w-full text-left flex gap-3 items-center rounded-xl p-3 transition ${active?.id === c.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}>
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${ch.connected ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'}`}><ch.icon className="w-4 h-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between text-sm font-semibold">{ch.label}<span className="text-[10px] font-normal opacity-60">{c.last_message_at ? moment(c.last_message_at).fromNow(true) : ''}</span></span>
                    <span className="block text-xs opacity-60 truncate">{ch.connected ? c.last_message : 'Demo · not connected'}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {active && (active.channel === 'web' ? <ManagerChat conversationId={active.id} className="h-[620px]" /> : <DemoChannel channel={active.channel} />)}
      </div>
    </div>
  );
}