import React from 'react';
import { useWsRecords } from '@/hooks/useWs';
import DiscoveryCard from '@/components/w/DiscoveryCard';

export default function WReview() {
  const { data: items = [], isLoading } = useWsRecords('Discovery', { status: 'pending' });
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl text-slate-900 mb-1">Review queue</h1>
      <p className="text-sm text-slate-500 mb-6">Facts Quivaro wasn't sure about, likely duplicates and ambiguous details. Nothing here is in your workspace until you confirm it.</p>
      {isLoading ? <div className="card-soft h-32 animate-pulse" /> : !items.length ? <div className="card-soft p-10 text-center text-sm text-slate-500">All caught up. Nothing to review.</div>
        : <div className="space-y-4">{items.map((d) => <DiscoveryCard key={d.id} d={d} />)}</div>}
    </div>
  );
}