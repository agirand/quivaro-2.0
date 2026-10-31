import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrg } from '@/hooks/useWs';
import { ensureTemplates } from '@/lib/work';
import TemplateCard from '@/components/work/TemplateCard';

export default function WCatalog() {
  const org = useOrg();
  const { data: templates = [], isLoading } = useQuery({ queryKey: ['ws', 'tpl', org.id], queryFn: () => ensureTemplates(org.id) });
  return (
    <div>
      <h1 className="text-3xl text-slate-900 mb-1">Work catalog</h1>
      <p className="text-sm text-slate-500 mb-6">Repeatable services Quivaro delivers. Customize steps, approvals and criteria for how your firm works.</p>
      {isLoading ? <div className="card-soft h-32 animate-pulse" /> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{templates.map((t) => <TemplateCard key={t.id} t={t} />)}</div>}
    </div>
  );
}