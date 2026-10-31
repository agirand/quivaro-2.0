import React from 'react';
import { AGENT_MAP } from '@/lib/agents';

export default function AgentAvatar({ name, size = 'md' }) {
  const a = AGENT_MAP[name] || { grad: 'from-slate-400 to-slate-500' };
  const s = { sm: 'w-6 h-6 text-[10px]', md: 'w-9 h-9 text-sm', lg: 'w-14 h-14 text-xl' }[size];
  return (
    <div className={`${s} shrink-0 rounded-full bg-gradient-to-br ${a.grad} text-white font-semibold flex items-center justify-center ring-2 ring-white shadow-sm`}>
      {(name || '?')[0]}
    </div>
  );
}