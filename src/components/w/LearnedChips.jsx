import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw, HelpCircle, ArrowRightLeft } from 'lucide-react';
import { TYPE_META } from '@/lib/workspace';

const STATUS = { pending_approval: 'awaiting your approval', logged: 'logged internally' };

export default function LearnedChips({ p }) {
  if (!p) return null;
  const { applied = [], queued = [], delegations = [], profile = [] } = p;
  if (!applied.length && !queued.length && !delegations.length && !profile.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {profile.length > 0 && <Link to="/w/settings" className="chip bg-sky-50 text-sky-800"><RefreshCw className="w-3 h-3" />Profile: {profile.join(', ').replace(/_/g, ' ')}</Link>}
      {applied.map((a) => (
        <Link key={a.type + a.name} to={TYPE_META[a.type]?.to || '/w'} className="chip bg-teal-50 text-teal-800">
          {a.action === 'created' ? <Plus className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}{TYPE_META[a.type]?.label}: {a.name}
        </Link>
      ))}
      {queued.length > 0 && <Link to="/w/review" className="chip bg-amber-50 text-amber-800"><HelpCircle className="w-3 h-3" />{queued.length} to confirm</Link>}
      {delegations.map((d, i) => <span key={i} className="chip bg-slate-100 text-slate-700"><ArrowRightLeft className="w-3 h-3" />{d.agent} Agent: {d.action} ({STATUS[d.status]})</span>)}
    </div>
  );
}