import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import AgentAvatar from '@/components/q/AgentAvatar';
import DataTable from '@/components/q/DataTable';
import DelegationSteps from './DelegationSteps';

export default function MessageBubble({ m }) {
  if (m.role === 'user') {
    return <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end"><div className="max-w-[80%] bg-slate-900 text-white rounded-2xl rounded-br-md px-4 py-3 text-sm">{m.text}</div></motion.div>;
  }
  const p = m.payload || {};
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
      <AgentAvatar name="Maya" />
      <div className="flex-1 min-w-0 space-y-3 max-w-3xl">
        <DelegationSteps steps={p.steps} />
        <div className="card-soft px-5 py-4 text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none prose-strong:text-slate-900"><ReactMarkdown>{m.text}</ReactMarkdown></div>
        {p.table?.rows?.length > 0 && <div className="card-soft max-h-80 overflow-y-auto"><DataTable columns={p.table.columns} rows={p.table.rows} /></div>}
        {(p.actions?.length > 0 || p.links?.length > 0) && (
          <div className="flex flex-wrap items-center gap-2">
            {p.actions?.map((a) => <span key={a} className="inline-flex items-center gap-1.5 text-xs bg-teal-50 text-teal-800 px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3.5 h-3.5" />{a}</span>)}
            {p.links?.map((l) => <Link key={l.to + l.label} to={l.to} className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900 px-2 py-1">{l.label}<ArrowRight className="w-3 h-3" /></Link>)}
          </div>
        )}
      </div>
    </motion.div>
  );
}