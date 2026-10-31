import React from 'react';
import moment from 'moment';
import { base44 } from '@/api/base44Client';
import { useWsRefresh } from '@/hooks/useWs';

const LABEL = { logged: ['Logged', 'bg-slate-100 text-slate-600'], pending_approval: ['Awaiting approval', 'bg-amber-100 text-amber-800'], approved: ['Approved · not executed', 'bg-emerald-100 text-emerald-800'], rejected: ['Rejected', 'bg-rose-100 text-rose-700'] };

export default function AgentActionRow({ x }) {
  const refresh = useWsRefresh();
  const decide = async (status) => {
    await base44.entities.AgentAction.update(x.id, { status, note: status === 'approved' ? 'Approved by owner. Recorded only: no connected system executes this yet.' : 'Rejected by owner.' });
    refresh();
  };
  const [label, tone] = LABEL[x.status] || LABEL.logged;
  return (
    <li className="text-xs">
      <div className="flex gap-2 items-start">
        <span className="flex-1 text-slate-700">{x.action}</span>
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${tone}`}>{label}</span>
      </div>
      <div className="flex items-center gap-3 mt-1 text-slate-400">
        {moment(x.created_date).fromNow()}
        {x.status === 'pending_approval' && <>
          <button onClick={() => decide('approved')} className="font-semibold text-teal-700 hover:underline">Approve</button>
          <button onClick={() => decide('rejected')} className="font-semibold text-rose-600 hover:underline">Reject</button>
        </>}
      </div>
    </li>
  );
}