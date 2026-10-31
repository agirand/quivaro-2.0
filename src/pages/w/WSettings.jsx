import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrg, useWsRefresh } from '@/hooks/useWs';
import { PROFILE_FIELDS } from '@/lib/workspace';
import { confirmFields, factStatus, FACT_STATUS } from '@/lib/facts';
import { useToast } from '@/components/ui/use-toast';

export default function WSettings() {
  const org = useOrg();
  const refresh = useWsRefresh();
  const { toast } = useToast();
  const { data: profile } = useQuery({ queryKey: ['ws', 'orgLive', org.id], queryFn: () => base44.entities.Organization.get(org.id) });
  const [edits, setEdits] = useState({});
  const save = async () => { await confirmFields(org.id, edits); setEdits({}); refresh(); toast({ title: 'Company profile saved', description: 'Your corrections are confirmed and won’t be overwritten by future scans.' }); };
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl text-slate-900">Settings</h1>
      <section className="card-soft p-5 md:p-6">
        <h2 className="text-lg text-slate-900">Company profile</h2>
        <p className="text-xs text-slate-500 mb-4">Learned by the AI Manager. Correct anything here.</p>
        <div className="space-y-3">
          {PROFILE_FIELDS.map(([k, label]) => (
            <label key={k} className="block">
              <span className="text-xs text-slate-500 flex items-center gap-2">{label}{FACT_STATUS[factStatus(profile, k)] && <span className={`chip !py-0.5 ${FACT_STATUS[factStatus(profile, k)].cls}`}>{FACT_STATUS[factStatus(profile, k)].label}</span>}</span>
              <input value={edits[k] ?? profile?.[k] ?? ''} onChange={(e) => setEdits({ ...edits, [k]: e.target.value })} placeholder="Not learned yet" className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40" />
            </label>
          ))}
        </div>
        <button onClick={save} disabled={!Object.keys(edits).length} className="mt-5 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm disabled:opacity-40">Save changes</button>
      </section>
      <section className="card-soft p-5 text-xs text-slate-600 leading-relaxed">
        <h2 className="text-lg text-slate-900 mb-2">Security</h2>
        Quivaro never asks for passwords in chat. External accounts will be connected through the provider's secure sign-in, never by sharing credentials. All records belong to your organization only.
      </section>
    </div>
  );
}