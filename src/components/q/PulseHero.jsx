import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlayCircle, Sparkles } from 'lucide-react';
import { money } from '@/lib/format';
import { AGENTS } from '@/lib/agents';
import AnimatedNumber from './AnimatedNumber';
import AgentAvatar from './AgentAvatar';

export default function PulseHero({ d }) {
  const health = d ? Math.max(0, Math.round(100 - (d.lateCount / Math.max(1, d.open)) * 100)) : null;
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0E1F3B] via-[#12305A] to-[#0F4C5C] text-white p-6 md:p-9 shadow-xl">
      <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-teal-400/20 blur-3xl" />
      <div className="relative">
        <div className="text-[11px] uppercase tracking-[0.2em] text-teal-200/90">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <h1 className="text-3xl md:text-5xl font-heading mt-2 leading-tight">Good morning, Elena.</h1>
        <p className="text-slate-300 mt-2 max-w-xl text-sm md:text-base">Your AI team is working across <b className="text-white">{d?.open ?? '…'} open matters</b> for Delaware Valley Business Services.</p>
        <div className="grid grid-cols-3 gap-3 md:gap-6 mt-7 max-w-2xl">
          <div><div className="text-[11px] text-slate-400">On-track rate</div><div className="font-heading text-3xl md:text-4xl"><AnimatedNumber value={health} />%</div></div>
          <div><div className="text-[11px] text-slate-400">Overdue A/R</div><div className="font-heading text-3xl md:text-4xl"><AnimatedNumber value={d?.overdue.sum_amount} format={money} /></div></div>
          <div><div className="text-[11px] text-slate-400">Your decisions</div><div className="font-heading text-3xl md:text-4xl"><AnimatedNumber value={d?.pending} /></div></div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-7">
          <Link to="/tour" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:scale-[1.02] active:scale-95 transition"><PlayCircle className="w-4 h-4" />Start Demo Tour</Link>
          <Link to="/maya" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm hover:bg-white/20 transition"><Sparkles className="w-4 h-4" />Ask Maya</Link>
          <div className="flex -space-x-2 ml-auto">{AGENTS.map((a) => <AgentAvatar key={a.name} name={a.name} size="sm" />)}</div>
        </div>
      </div>
    </motion.section>
  );
}