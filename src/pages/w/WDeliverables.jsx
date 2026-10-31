import React from 'react';
import { useWsRecords } from '@/hooks/useWs';
import DeliverableCard from '@/components/work/DeliverableCard';

export default function WDeliverables() {
  const { data: dels = [], isLoading } = useWsRecords('Deliverable');
  const { data: orders = [] } = useWsRecords('WorkOrder', { id: { $in: [...new Set(dels.map((d) => d.work_order_id))] } });
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl text-slate-900 mb-1">Deliverables</h1>
      <p className="text-sm text-slate-500 mb-6">Completed work, verified against each order's acceptance criteria, with the evidence behind it.</p>
      {isLoading ? <div className="card-soft h-32 animate-pulse" /> : !dels.length ? <div className="card-soft p-10 text-center text-sm text-slate-500">Nothing delivered yet. Completed work will appear here.</div>
        : <div className="space-y-4">{dels.map((d) => <DeliverableCard key={d.id} d={d} order={orders.find((o) => o.id === d.work_order_id)} />)}</div>}
    </div>
  );
}