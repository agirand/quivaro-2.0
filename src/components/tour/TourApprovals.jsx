import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ApprovalCard from '@/components/q/ApprovalCard';

export default function TourApprovals() {
  const { data } = useQuery({
    queryKey: ['tourApprovals'],
    queryFn: () => base44.entities.Approval.filter({ kind: 'doc_reminder', matter_id: { $exists: true } }, { sort: '-created_date', limit: 6 }),
  });
  return (
    <div className="space-y-4">
      <h3 className="text-lg text-slate-900">Owner approval</h3>
      <p className="text-sm text-slate-500 -mt-3">Approve, edit or reject each draft. Approving logs a simulated delivery. Nothing is sent.</p>
      {data?.items.map((a) => <ApprovalCard key={a.id} a={a} />)}
    </div>
  );
}