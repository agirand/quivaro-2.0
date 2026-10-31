import React from 'react';
import moment from 'moment';
import { Plus, RefreshCw, HelpCircle, Check, X, Plug, User } from 'lucide-react';
import { useWsRecords } from '@/hooks/useWs';
import { TYPE_META } from '@/lib/workspace';

const ICON = { created: [Plus, 'bg-teal-50 text-teal-700', 'Added'], updated: [RefreshCw, 'bg-sky-50 text-sky-700', 'Updated'], queued: [HelpCircle, 'bg-amber-50 text-amber-700', 'Needs review'], confirmed: [Check, 'bg-emerald-50 text-emerald-700', 'Confirmed'], rejected: [X, 'bg-rose-50 text-rose-700', 'Rejected'], connected: [Plug, 'bg-indigo-50 text-indigo-700', 'Connected'], profile: [User, 'bg-slate-100 text-slate-700', 'Profile updated'] };

export default function ActivityStream({ limit = 15 }) {
  const { data: items = [] } = useWsRecords('WorkspaceEvent', {}, '-created_date', limit);
  return (
    <section className="card-soft p-5">
      <h2 className="text-lg text-slate-900 mb-4">Learned through conversation</h2>
      {!items.length && <p className="text-sm text-slate-400 text-center py-6">Records will appear here as the AI Manager learns.</p>}
      <ul className="space-y-3">
        {items.map((e) => {
          const [Icon, tone, verb] = ICON[e.action] || ICON.updated;
          return (
            <li key={e.id} className="flex gap-3 items-start">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tone}`}><Icon className="w-3.5 h-3.5" /></span>
              <div className="flex-1 min-w-0 text-sm">
                <div className="text-slate-800"><span className="font-semibold">{verb}</span> {TYPE_META[e.entity_type]?.label?.toLowerCase() || e.entity_type} · {e.record_name}</div>
                <div className="text-[11px] text-slate-400">via {e.source === 'discovery' ? `discovery${e.detail ? ` · ${e.detail}` : ''}` : e.source || 'workspace'} · {moment(e.created_date).fromNow()}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}