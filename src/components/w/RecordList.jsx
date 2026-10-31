import React from 'react';
import { Link } from 'react-router-dom';
import { MessagesSquare } from 'lucide-react';
import { useWsRecords } from '@/hooks/useWs';
import SourceBadge from './SourceBadge';

export default function RecordList({ entity, title, columns, empty, action }) {
  const { data: rows, isLoading } = useWsRecords(entity);
  return (
    <section className="card-soft p-5 md:p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg text-slate-900">{title}</h2>
        <span className="text-xs text-slate-400">{rows?.length ?? 0} records</span>
      </div>
      {isLoading ? <div className="h-20 rounded-xl bg-slate-50 animate-pulse" /> : !rows.length ? (
        <div className="text-center py-8 text-sm text-slate-500">
          {empty}
          <Link to="/w" className="flex items-center justify-center gap-1.5 mt-3 text-teal-700 font-semibold"><MessagesSquare className="w-4 h-4" />Tell the AI Manager</Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => (
            <li key={r.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">{action?.(r)}{r.name}</div>
                <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-x-3">
                  {columns.filter(([k]) => r[k]).map(([k, label]) => <span key={k}><span className="text-slate-400">{label}:</span> {r[k]}</span>)}
                </div>
              </div>
              <SourceBadge r={r} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}