import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, ArrowRight } from 'lucide-react';
import TemplateEditor from './TemplateEditor';

export default function TemplateCard({ t }) {
  const [edit, setEdit] = useState(false);
  return (
    <div className="card-soft p-5 flex flex-col">
      <div className="text-[11px] uppercase tracking-wider text-teal-700">{t.category}</div>
      <div className="font-heading text-lg text-slate-900 mt-1">{t.name}</div>
      <p className="text-sm text-slate-500 mt-1 flex-1">{t.description}</p>
      <div className="text-xs text-slate-500 mt-3">{(t.steps || []).length} steps · {(t.steps || []).filter((s) => s.needs_approval).length} approval gates · {t.price_mode === 'package' ? `$${t.package_price} package` : 'Included in plan'}</div>
      <div className="flex gap-2 mt-4">
        <Link to={`/w?template=${t.key}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 hover:text-teal-700">Order this<ArrowRight className="w-4 h-4" /></Link>
        {t.key !== 'lead_to_proposal' && <button onClick={() => setEdit(true)} className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"><Pencil className="w-3.5 h-3.5" />Customize</button>}
      </div>
      {edit && <TemplateEditor t={t} onClose={() => setEdit(false)} />}
    </div>
  );
}