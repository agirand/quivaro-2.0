import React from 'react';
import { WS_AGENTS } from '@/lib/wsAgents';
import WsAgentCard from '@/components/w/WsAgentCard';

export default function WAgents() {
  return (
    <div>
      <h1 className="text-3xl text-slate-900 mb-1">Agents</h1>
      <p className="text-sm text-slate-500 mb-6">One AI Manager coordinates four specialists. Delegated work is recorded here; nothing external is executed without a connected system and your approval.</p>
      <div className="grid lg:grid-cols-2 gap-5">{WS_AGENTS.map((a) => <WsAgentCard key={a.name} a={a} />)}</div>
    </div>
  );
}