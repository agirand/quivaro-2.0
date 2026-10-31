import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { money } from '@/lib/format';
import PageHeader from '@/components/q/PageHeader';
import StatusBadge from '@/components/q/StatusBadge';

export default function Clients() {
  const [q, setQ] = useState('');
  const { data } = useQuery({ queryKey: ['clients', q], queryFn: () => base44.entities.Client.filter(q ? { name: { $regex: q, $options: 'i' } } : {}, { sort: 'name', limit: 100 }) });
  return (
    <div>
      <PageHeader eyebrow="Clients" title="Client directory" subtitle="Fictional small businesses served by Delaware Valley Business Services.">
        <div className="relative w-full md:w-72"><Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients…" className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-teal-400" /></div>
      </PageHeader>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {data?.items.map((c) => (
          <Link key={c.id} to={`/clients/${c.code}`} className="card-soft p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-start justify-between gap-2">
              <div><h3 className="text-lg text-slate-900 group-hover:text-teal-800 transition">{c.name}</h3><p className="text-xs text-slate-500">{c.industry} · {c.city}</p></div>
              <StatusBadge status={c.status} />
            </div>
            <div className="flex flex-wrap gap-1 mt-4">{c.services?.slice(0, 3).map((s) => <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{s}</span>)}</div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <span>{c.contact_name} {c.language === 'es' && <span className="ml-1 font-bold text-sky-700">ES</span>}</span><span className="font-semibold text-slate-800">{money(c.monthly_fee)}/mo</span>
            </div>
          </Link>
        ))}
      </div>
      {data && !data.items.length && <p className="text-center text-slate-400 py-16">No clients match your search.</p>}
    </div>
  );
}