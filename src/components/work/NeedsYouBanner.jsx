import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function NeedsYouBanner({ o, act, busy }) {
  const [info, setInfo] = useState('');
  if (o.status === 'scoped') return (
    <div className="card-soft p-5 border-amber-200 bg-amber-50/40">
      <div className="font-medium text-slate-900">Review the plan below, then approve to start.</div>
      <p className="text-sm text-slate-600 mt-1">Quivaro won't take any action until you approve this scope. Approval gates still pause the work for anything sensitive.</p>
      <div className="flex gap-2 mt-4">
        <Button disabled={!!busy} onClick={() => act('approve_scope')}>{busy === 'approve_scope' ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Working…</> : 'Approve & start'}</Button>
        <Button variant="outline" disabled={!!busy} onClick={() => act('cancel')}>Cancel</Button>
      </div>
    </div>
  );
  if (!o.needs_from_customer) return null;
  return (
    <div className="card-soft p-5 border-amber-200 bg-amber-50/40">
      <div className="flex items-start gap-2 text-sm text-slate-800"><AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" /><span><b>Quivaro needs you:</b> {o.needs_from_customer}</span></div>
      {['needs_input', 'quality_review'].includes(o.status) && (
        <div className="mt-3 space-y-2">
          <Textarea value={info} onChange={(e) => setInfo(e.target.value)} placeholder="Add the missing information…" rows={3} className="bg-white" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={!!busy || !info.trim()} onClick={async () => (await act('provide_info', { note: info })) && setInfo('')}>{busy === 'provide_info' ? 'Working…' : 'Send to Quivaro'}</Button>
            {o.status === 'quality_review' && <Button size="sm" variant="outline" disabled={!!busy} onClick={() => act('rework', { note: 'Address the unmet acceptance criteria' })}>Send back for rework</Button>}
          </div>
        </div>
      )}
    </div>
  );
}