import React from 'react';
import { STATUS } from '@/lib/work';

export default function StatusPill({ status }) {
  const [label, cls] = STATUS[status] || [status, 'bg-slate-100 text-slate-600'];
  return <span className={`chip ${cls}`}>{label}</span>;
}