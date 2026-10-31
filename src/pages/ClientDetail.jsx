import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { money, fdate } from '@/lib/format';
import StatusBadge from '@/components/q/StatusBadge';
import Progress from '@/components/q/Progress';
import DataTable from '@/components/q/DataTable';
import ActivityFeed from '@/components/q/ActivityFeed';

const E = base44.entities;

export default function ClientDetail() {
  const { code } = useParams();
  const { data: d, isLoading } = useQuery({
    queryKey: ['client', code],
    queryFn: async () => {
      const c = (await E.Client.filter({ code }, { limit: 1 })).items[0];
      if (!c) return null;
      const [m, i, docs, comms, act] = await Promise.all([
        E.Matter.filter({ client_code: code }, { sort: 'target_date', limit: 50 }), E.Invoice.filter({ client_code: code }, { sort: '-issue_date', limit: 50 }),
        E.DocumentRequest.filter({ client_code: code }, { sort: '-requested_date', limit: 50 }), E.Approval.filter({ client_code: code }, { sort: '-created_date', limit: 20 }),
        E.Activity.filter({ client_name: c.name }, { sort: '-created_date', limit: 10 }),
      ]);
      return { c, m: m.items, i: i.items, docs: docs.items, comms: comms.items, act: act.items };
    },
  });
  if (isLoading) return <p className="text-slate-400 py-20 text-center">Loading client…</p>;
  if (!d) return <p className="text-slate-500 py-20 text-center">Client not found. <Link to="/clients" className="text-teal-700">Back to clients</Link></p>;
  const { c } = d;
  const Box = ({ title, children }) => <section className="card-soft"><h2 className="text-lg text-slate-900 px-5 pt-5 pb-2">{title}</h2>{children}</section>;

  return (
    <div className="space-y-6">
      <Link to="/clients" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft className="w-4 h-4" />Clients</Link>
      <div className="card-soft p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl text-slate-900">{c.name}</h1><StatusBadge status={c.status} /><span className="text-xs text-slate-400">{c.code}</span></div>
        <p className="text-slate-500 mt-1">{c.industry} · client since {c.since} · {money(c.monthly_fee)}/mo · lead: {c.owner_staff}</p>
        <div className="flex flex-wrap gap-5 mt-5 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">{c.contact_name}</span>
          <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" />{c.email}</span>
          <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400" />{c.phone}</span>
          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" />{c.city}</span>
          <span>{c.language === 'es' ? 'Español preferred' : 'English preferred'}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-5">{c.services?.map((s) => <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-800">{s}</span>)}</div>
        {c.notes && <p className="text-sm text-slate-500 mt-4 italic">{c.notes}</p>}
      </div>
      <Box title="Matters"><DataTable columns={['Matter', 'Owner', 'Status', 'Progress', 'Internal target']} rows={d.m.map((m) => [m.title, `${m.agent} · ${m.staff}`, <StatusBadge status={m.status} />, <Progress value={m.progress} />, fdate(m.target_date)])} /></Box>
      <div className="grid lg:grid-cols-2 gap-6">
        <Box title="Invoices"><DataTable columns={['Invoice', 'Amount', 'Due', 'Status']} rows={d.i.map((i) => [i.number, money(i.amount), fdate(i.due_date), <StatusBadge status={i.status} />])} /></Box>
        <Box title="Documentation"><DataTable columns={['Document', 'Requested', 'Status']} rows={d.docs.map((x) => [x.document, fdate(x.requested_date) + (x.last_reminder ? ' · reminded' : ''), <StatusBadge status={x.status} />])} empty="No document requests." /></Box>
        <Box title="Communications"><DataTable columns={['Subject', 'By', 'Status']} rows={d.comms.map((a) => [a.subject, a.agent, <StatusBadge status={a.status} />])} empty="No communications yet." /></Box>
        <Box title="Activity history"><div className="p-5 pt-2"><ActivityFeed items={d.act} /></div></Box>
      </div>
    </div>
  );
}