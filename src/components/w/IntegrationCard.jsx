import React, { useState } from 'react';
import moment from 'moment';
import { Loader2, CheckCircle2, AlertTriangle, Circle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useOrg, useWsRefresh } from '@/hooks/useWs';
import { useToast } from '@/components/ui/use-toast';

const STATE = { disconnected: [Circle, 'text-slate-400', 'Disconnected'], connecting: [Loader2, 'text-sky-600 animate-spin', 'Connecting & discovering…'], connected: [CheckCircle2, 'text-teal-600', 'Connected · demo'], error: [AlertTriangle, 'text-rose-600', 'Error'] };

export default function IntegrationCard({ p, rec }) {
  const org = useOrg();
  const refresh = useWsRefresh();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const status = busy ? 'connecting' : rec?.status || 'disconnected';
  const save = (data) => (rec ? base44.entities.Integration.update(rec.id, data) : base44.entities.Integration.create({ org_id: org.id, provider: p.id, mode: 'demo', ...data }));

  const connect = async () => {
    setBusy(true);
    await save({ status: 'connecting', error_message: '' });
    const res = await base44.functions.invoke('runDiscovery', { provider: p.id }).catch((e) => ({ error: e }));
    if (res.error) await save({ status: 'error', error_message: 'Discovery failed. Try reconnecting.' });
    else {
      await save({ status: 'connected', last_sync: new Date().toISOString() });
      await base44.entities.WorkspaceEvent.create({ org_id: org.id, action: 'connected', entity_type: 'integration', record_name: `${p.name} (demo)`, source: 'discovery' });
      toast({ title: `${p.name} demo connected`, description: `${res.data.applied.length} records added, ${res.data.queued.length} queued for your review.` });
    }
    setBusy(false);
    refresh();
  };
  const disconnect = async () => { await save({ status: 'disconnected' }); refresh(); };
  const [Icon, tone, label] = STATE[status];

  return (
    <div className="card-soft p-5 flex flex-col">
      <div className="flex items-start justify-between">
        <div><div className="font-semibold text-slate-900">{p.name}</div><div className="text-xs text-slate-500">{p.about}</div></div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{p.sample ? 'DEMO' : 'SOON'}</span>
      </div>
      <div className={`flex items-center gap-1.5 text-xs mt-4 ${tone.replace('animate-spin', '')}`}><Icon className={`w-3.5 h-3.5 ${tone}`} />{label}</div>
      <div className="text-[11px] text-slate-400 mt-1 min-h-[16px]">{status === 'error' ? rec?.error_message : rec?.last_sync && status === 'connected' ? `Synced ${moment(rec.last_sync).fromNow()} · ${p.sample}` : p.sample || 'Live connection coming soon'}</div>
      <div className="mt-4">
        {!p.sample ? <button disabled className="w-full py-2 rounded-xl bg-slate-100 text-slate-400 text-sm">Not available yet</button>
          : status === 'connected' ? <button onClick={disconnect} className="w-full py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50">Disconnect</button>
          : <button onClick={connect} disabled={busy} className="w-full py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800 active:scale-95 transition disabled:opacity-60">{status === 'error' ? 'Retry demo connection' : 'Connect demo data'}</button>}
      </div>
    </div>
  );
}