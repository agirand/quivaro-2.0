import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useWorkAction } from '@/hooks/useWorkAction';
import { useWsRecords } from '@/hooks/useWs';
import StatusPill from '@/components/work/StatusPill';
import NeedsYouBanner from '@/components/work/NeedsYouBanner';
import ScopePanel from '@/components/work/ScopePanel';
import StepItem from '@/components/work/StepItem';
import CriteriaList from '@/components/work/CriteriaList';
import OrderEconomics from '@/components/work/OrderEconomics';
import OrderHistory from '@/components/work/OrderHistory';
import BonusPanel from '@/components/work/BonusPanel';
import DeliverableCard from '@/components/work/DeliverableCard';

export default function WWorkOrder() {
  const { id } = useParams();
  const { act, busy } = useWorkAction(id);
  const { data: o, isLoading } = useQuery({ queryKey: ['ws', 'order', id], queryFn: () => base44.entities.WorkOrder.get(id).catch(() => null) });
  const { data: dels = [] } = useWsRecords('Deliverable', { work_order_id: id });
  useEffect(() => {
    if (isLoading || o) return;
    const m = document.createElement('meta'); m.name = 'prerender-status-code'; m.content = '404'; document.head.appendChild(m);
    return () => m.remove();
  }, [isLoading, o]);
  if (isLoading) return <div className="flex justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>;
  if (!o) return <div className="card-soft p-10 text-center text-sm text-slate-500">Work order not found. <Link to="/w" className="underline">Back to Work Center</Link></div>;
  const canContinue = !o.is_demo && o.status === 'executing';
  return (
    <div className="space-y-5">
      <Link to="/w" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900"><ArrowLeft className="w-3.5 h-3.5" />Work Center</Link>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          {o.is_demo && <div className="chip bg-violet-50 text-violet-700 mb-2">Demo · synthetic clients · nothing is sent</div>}
          <h1 className="text-2xl md:text-3xl text-slate-900">{o.title}</h1>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500"><StatusPill status={o.status} /><span>{o.progress || 0}% complete</span>{o.due_date && <span>· due {o.due_date}</span>}</div>
        </div>
        <div className="flex gap-2">
          {canContinue && <Button disabled={!!busy} onClick={() => act('run')}>{busy === 'run' ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Working…</> : <><Play className="w-4 h-4 mr-2" />Continue work</>}</Button>}
          {!['accepted', 'cancelled', 'closed', 'scoped'].includes(o.status) && <Button variant="outline" disabled={!!busy} onClick={() => window.confirm('Cancel this work order?') && act('cancel')}>Cancel</Button>}
        </div>
      </div>
      <NeedsYouBanner o={o} act={act} busy={busy} />
      {dels.map((d) => <DeliverableCard key={d.id} d={d} order={o} />)}
      <BonusPanel o={o} act={act} busy={busy} />
      <div className="grid lg:grid-cols-[1fr_340px] gap-5">
        <div className="space-y-5">
          <div className="card-soft p-5"><div className="text-sm font-medium text-slate-900 mb-4">Execution plan</div>{(o.steps || []).map((s, i) => <StepItem key={i} s={s} i={i} act={act} busy={busy} />)}</div>
          <div className="card-soft p-5"><div className="text-sm font-medium text-slate-900 mb-3">Acceptance criteria</div><CriteriaList criteria={o.acceptance_criteria} /><p className="text-[11px] text-slate-400 mt-3">Work is only delivered once every criterion is verified.</p></div>
        </div>
        <div className="space-y-5"><ScopePanel o={o} /><OrderEconomics o={o} /><OrderHistory history={o.history} /></div>
      </div>
    </div>
  );
}