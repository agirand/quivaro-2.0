import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import AgentAvatar from '@/components/q/AgentAvatar';

export default function DelegationSteps({ steps = [], done }) {
  const n = done ?? steps.length;
  if (!steps.length) return null;
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Delegation</div>
      {steps.map((s, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: i <= n ? 1 : 0.35, x: 0 }} transition={{ delay: done == null ? 0 : 0.05 }} className="flex items-center gap-2.5">
          <AgentAvatar name={s.agent} size="sm" />
          <span className="text-sm text-slate-700 flex-1"><span className="font-semibold">{s.agent}</span> — {s.label}</span>
          {i < n ? <Check className="w-4 h-4 text-teal-600" /> : i === n ? <Loader2 className="w-4 h-4 animate-spin text-sky-500" /> : null}
        </motion.div>
      ))}
      <div className="h-1 rounded-full bg-slate-200 overflow-hidden"><div className="h-full bg-gradient-to-r from-teal-500 to-sky-500 transition-all duration-500" style={{ width: `${(n / steps.length) * 100}%` }} /></div>
    </div>
  );
}