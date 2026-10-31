import React from 'react';
import { useWsRecords } from '@/hooks/useWs';
import DiscoveryCard from '@/components/w/DiscoveryCard';
import WorkApprovals from '@/components/work/WorkApprovals';

export default function WReview() {
  const { data: items = [], isLoading } = useWsRecords('Discovery', { status: 'pending' });
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl text-slate-900 mb-1">Approvals & exceptions</h1>
      <p className="text-sm text-slate-500 mb-6">Work waiting on your decision, plus facts Quivaro wasn't sure about. Nothing here moves forward until you confirm it.</p>
      <WorkApprovals />
      <h2 className="text-lg text-slate-900 mb-3">Business facts to review</h2>
      {isLoading ? <div className="card-soft h-32 animate-pulse" /> : !items.length ? <div className="card-soft p-10 text-center text-sm text-slate-500">All caught up. Nothing to review.</div>
        : <div className="space-y-4">{items.map((d) => <DiscoveryCard key={d.id} d={d} />)}</div>}
    </div>
  );
}