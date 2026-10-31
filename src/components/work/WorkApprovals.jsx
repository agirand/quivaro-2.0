import React from 'react';
import { useWsRecords } from '@/hooks/useWs';
import WorkOrderCard from './WorkOrderCard';

// Work orders waiting on an approval, missing information, a connection or a quality decision.
export default function WorkApprovals() {
  const { data: items = [] } = useWsRecords('WorkOrder', { status: { $in: ['scoped', 'awaiting_approval', 'needs_input', 'blocked', 'quality_review'] } });
  if (!items.length) return null;
  return (
    <section className="mb-8">
      <h2 className="text-lg text-slate-900 mb-1">Work approvals & exceptions</h2>
      <p className="text-sm text-slate-500 mb-3">Work Quivaro paused until you decide.</p>
      <div className="space-y-3">{items.map((o) => <WorkOrderCard key={o.id} o={o} />)}</div>
    </section>
  );
}