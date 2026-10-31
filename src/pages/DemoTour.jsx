import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import TourStep from '@/components/tour/TourStep';
import TourApprovals from '@/components/tour/TourApprovals';

const STEPS = [
  { title: 'Morning briefing', command: 'Give me a briefing on the business today.', why: 'Start the day the way an owner would: one question, and Maya pulls receivables, compliance and documents from the team.' },
  { title: 'At-risk filings', command: 'Show me all clients with outstanding compliance work.', why: 'Sofia AI scans the compliance calendar and Maya assigns her a review task, which appears on the Workboard.' },
  { title: 'Bilingual reminders', command: 'Draft missing-document reminders for clients with at-risk registration matters.', why: 'Nia drafts English/Spanish reminders linked to real matters. You stay in control: nothing goes out without your approval.' },
];

export default function DemoTour() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState([]);
  return (
    <div className="max-w-3xl">
      <div className="text-[11px] uppercase tracking-[0.18em] text-teal-700 font-semibold">Demo Tour · 5 minutes</div>
      <h1 className="text-3xl md:text-4xl text-slate-900 mt-2">Manage a team, not software.</h1>
      <div className="flex gap-2 mt-6 mb-6">
        {STEPS.map((s, k) => (
          <button key={s.title} onClick={() => setI(k)} className={`flex-1 text-left rounded-xl px-3 py-2.5 border transition ${k === i ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:border-teal-400'}`}>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-70">{done.includes(k) ? <Check className="w-3 h-3" /> : `Step ${k + 1}`}</div>
            <div className="text-xs md:text-sm font-semibold mt-0.5">{s.title}</div>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
          <TourStep step={STEPS[i]} onDone={() => setDone((d) => [...new Set([...d, i])])}>
            {i === 2 && <TourApprovals />}
            <div className="flex justify-end pt-2">
              {i < 2
                ? <button onClick={() => setI(i + 1)} className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-900">Next: {STEPS[i + 1].title}<ArrowRight className="w-4 h-4" /></button>
                : <Link to="/team" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-900">See the AI team's work log<ArrowRight className="w-4 h-4" /></Link>}
            </div>
          </TourStep>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}