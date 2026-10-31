import React from 'react';
import moment from 'moment';
import AgentAvatar from './AgentAvatar';

export default function ActivityFeed({ items = [] }) {
  if (!items.length) return <p className="text-sm text-slate-400 py-6 text-center">No activity yet.</p>;
  return (
    <ul className="space-y-4">
      {items.map((a) => (
        <li key={a.id} className="flex gap-3">
          <AgentAvatar name={a.agent} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-800"><span className="font-semibold">{a.agent}</span> · {a.action}</p>
            <p className="text-xs text-slate-500 truncate">{[a.client_name, a.detail].filter(Boolean).join(' — ')}</p>
          </div>
          <span className="text-[11px] text-slate-400 whitespace-nowrap">{moment(a.created_date).fromNow()}</span>
        </li>
      ))}
    </ul>
  );
}