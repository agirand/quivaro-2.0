import React from 'react';
import { Link } from 'react-router-dom';
import { Plug } from 'lucide-react';
import { useWsRecords } from '@/hooks/useWs';
import ManagerChat from '@/components/w/ManagerChat';
import LearnedPanel from '@/components/w/LearnedPanel';
import ActivityStream from '@/components/w/ActivityStream';

export default function WOverview() {
  const { data: convos = [] } = useWsRecords('Conversation', { channel: 'web' }, 'created_date', 1);
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0E1F3B] via-[#12305A] to-[#0F4C5C] text-white p-6 md:p-8">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.2em] text-teal-200/90">Conversational onboarding</div>
          <h1 className="text-2xl md:text-4xl font-heading mt-2 leading-tight">You talk. Quivaro learns.<br className="hidden md:block" /> Your workspace builds itself.</h1>
          <Link to="/w/integrations" className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-sm hover:bg-white/20 transition"><Plug className="w-4 h-4" />Connect sample systems for discovery</Link>
        </div>
      </section>
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {convos[0] ? <ManagerChat conversationId={convos[0].id} /> : <div className="card-soft h-[560px] animate-pulse" />}
        <div className="space-y-6"><LearnedPanel /><ActivityStream limit={8} /></div>
      </div>
    </div>
  );
}