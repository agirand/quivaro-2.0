import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrg, useWsRefresh } from '@/hooks/useWs';
import FactRow from './FactRow';
import { TYPE_META, PROFILE_FIELDS } from '@/lib/workspace';
import AnimatedNumber from '@/components/q/AnimatedNumber';

export default function LearnedPanel() {
  const org = useOrg();
  const { data: profile } = useQuery({ queryKey: ['ws', 'orgLive', org.id], queryFn: () => base44.entities.Organization.get(org.id) });
  const { data: counts = {} } = useQuery({
    queryKey: ['ws', 'counts', org.id],
    queryFn: async () => Object.fromEntries(await Promise.all(Object.entries(TYPE_META).map(async ([t, m]) => [t, await base44.entities[m.entity].count({ org_id: org.id })]))),
  });
  const { data: pendingProfile = 0 } = useQuery({ queryKey: ['ws', 'pendingProfile', org.id], queryFn: () => base44.entities.Discovery.count({ org_id: org.id, entity_type: 'profile', status: 'pending' }) });
  const refresh = useWsRefresh();
  const known = PROFILE_FIELDS.filter(([k]) => profile?.[k]);
  return (
    <section className="card-soft p-5">
      <h2 className="text-lg text-slate-900">Your workspace</h2>
      <div className="h-1.5 rounded-full bg-slate-100 mt-3 overflow-hidden"><div className="h-full bg-gradient-to-r from-teal-500 to-sky-500 transition-all duration-700" style={{ width: `${(known.length / PROFILE_FIELDS.length) * 100}%` }} /></div>
      <div className="text-[11px] text-slate-400 mt-1">Company profile {known.length}/{PROFILE_FIELDS.length} learned</div>
      <dl className="mt-3 space-y-1.5 text-xs">
        {known.map(([k, label]) => <FactRow key={k} org={profile} k={k} label={label} onChange={refresh} />)}
      </dl>
      {pendingProfile > 0 && <Link to="/w/review" className="block mt-3 text-[11px] font-semibold text-amber-800 bg-amber-50 rounded-lg px-2.5 py-1.5">{pendingProfile} profile detail{pendingProfile > 1 ? 's' : ''} with conflicting sources waiting in Review</Link>}
      {profile?.profile_source_url && (
        <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-500 leading-relaxed">
          Public info from <a href={profile.profile_source_url} target="_blank" rel="noreferrer" className="text-teal-700 underline break-all">{profile.profile_source_url.replace(/^https?:\/\//, '')}</a>, retrieved {new Date(profile.profile_retrieved_at).toLocaleDateString()} · {profile.profile_verification === 'match_confirmed' ? 'match confirmed by you' : 'unconfirmed'}.
          <div className="text-amber-700 mt-1">Ownership not verified. Public info grants no access to private business accounts.</div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {Object.entries(TYPE_META).map(([t, m]) => (
          <Link key={t} to={m.to} className="rounded-xl bg-slate-50 hover:bg-teal-50 transition p-2.5 text-center">
            <div className="font-heading text-xl text-slate-900"><AnimatedNumber value={counts[t] ?? 0} /></div>
            <div className="text-[10px] text-slate-500">{m.label}s</div>
          </Link>
        ))}
      </div>
    </section>
  );
}