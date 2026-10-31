import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ label, value, hint, icon: Icon, tone = 'text-teal-600 bg-teal-50' }) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="card-soft p-4 md:p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        {Icon && <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tone}`}><Icon className="w-4 h-4" /></span>}
      </div>
      <div className="font-heading text-2xl md:text-3xl text-slate-900 mt-3 tabular-nums">{value ?? '—'}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </motion.div>
  );
}