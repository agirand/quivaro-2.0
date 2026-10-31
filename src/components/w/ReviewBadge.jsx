import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ReviewBadge({ orgId }) {
  const { data: n = 0 } = useQuery({ queryKey: ['ws', 'reviewCount', orgId], queryFn: () => base44.entities.Discovery.count({ org_id: orgId, status: 'pending' }) });
  if (!n) return null;
  return <span className="ml-auto text-[10px] font-bold bg-amber-500 text-white rounded-full px-1.5 py-0.5">{n}</span>;
}