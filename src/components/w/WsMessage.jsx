import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import LearnedChips from './LearnedChips';
import MatchCards from './MatchCards';
import CrawlReport from './CrawlReport';

export default function WsMessage({ m }) {
  if (m.sender === 'owner') {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <div className="max-w-[85%] bg-slate-900 text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm whitespace-pre-wrap">{m.text}</div>
      </motion.div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
      <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-slate-900 to-teal-700 text-white text-[11px] font-bold flex items-center justify-center">AI</div>
      <div className="min-w-0 max-w-[88%] space-y-2">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-md px-4 py-2.5 text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-strong:text-slate-900">
          <ReactMarkdown>{m.text}</ReactMarkdown>
        </div>
        {m.payload?.candidates?.length > 0 && <MatchCards m={m} />}
        {m.payload?.source_url && <div className="text-[11px] text-slate-400">Source: <a href={m.payload.source_url} target="_blank" rel="noreferrer" className="underline">{m.payload.source_url}</a> · retrieved {new Date(m.payload.retrieved_at).toLocaleString()}</div>}
        {m.payload?.pages?.length > 0 && <CrawlReport pages={m.payload.pages} />}
        <LearnedChips p={m.payload} />
      </div>
    </motion.div>
  );
}