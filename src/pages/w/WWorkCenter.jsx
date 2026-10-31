import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlayCircle, MessagesSquare } from 'lucide-react';
import { useOrg, useWsRecords, useWsRefresh } from '@/hooks/useWs';
import { ensureTemplates, ACTIVE } from '@/lib/work';
import { seedDemoOrder } from '@/lib/demoWork';
import WorkRequestBox from '@/components/work/WorkRequestBox';
import WorkStats from '@/components/work/WorkStats';
import WorkOrderCard from '@/components/work/WorkOrderCard';
import TemplateCard from '@/components/work/TemplateCard';

export default function WWorkCenter() {
  const org = useOrg();
  const refresh = useWsRefresh();
  const [seeding, setSeeding] = useState(false);
  const { data: templates = [] } = useQuery({ queryKey: ['ws', 'tpl', org.id], queryFn: () => ensureTemplates(org.id) });
  const { data: orders = [], isLoading } = useWsRecords('WorkOrder', {}, '-updated_date', 50);
  const initial = new URLSearchParams(window.location.search).get('template') || '';
  const active = orders.filter((o) => ACTIVE.includes(o.status) || o.status === 'scoped');
  const done = orders.filter((o) => ['delivered', 'accepted', 'closed'].includes(o.status)).slice(0, 4);
  const demo = async () => { setSeeding(true); await seedDemoOrder(org.id); setSeeding(false); refresh(); };
  return (
    <div className="space-y-6">
      <WorkRequestBox key={initial} templates={templates} initialTemplate={initial} />
      <WorkStats orders={orders} />
      <section>
        <div className="flex items-center justify-between mb-3"><h2 className="text-lg text-slate-900">Current work</h2>
          <div className="flex gap-3 text-xs">
            {!orders.some((o) => o.is_demo) && <button onClick={demo} disabled={seeding} className="inline-flex items-center gap-1 text-violet-700 hover:text-violet-900"><PlayCircle className="w-3.5 h-3.5" />{seeding ? 'Loading demo…' : 'Load demo order'}</button>}
            <Link to="/w/overview" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900"><MessagesSquare className="w-3.5 h-3.5" />AI Manager</Link>
          </div>
        </div>
        {isLoading ? <div className="card-soft h-24 animate-pulse" /> : active.length ? <div className="grid md:grid-cols-2 gap-3">{active.map((o) => <WorkOrderCard key={o.id} o={o} />)}</div>
          : <div className="card-soft p-8 text-center text-sm text-slate-500">No work in progress. Describe an outcome above, or pick a service below.</div>}
      </section>
      {!!done.length && <section><div className="flex items-center justify-between mb-3"><h2 className="text-lg text-slate-900">Recently delivered</h2><Link to="/w/deliverables" className="text-xs text-slate-500 hover:text-slate-900">All deliverables</Link></div><div className="grid md:grid-cols-2 gap-3">{done.map((o) => <WorkOrderCard key={o.id} o={o} />)}</div></section>}
      <section>
        <div className="flex items-center justify-between mb-3"><h2 className="text-lg text-slate-900">Work catalog</h2><Link to="/w/catalog" className="text-xs text-slate-500 hover:text-slate-900">See all</Link></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{templates.slice(0, 3).map((t) => <TemplateCard key={t.id} t={t} />)}</div>
      </section>
    </div>
  );
}