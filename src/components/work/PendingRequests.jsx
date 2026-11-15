import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, MessagesSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useWsRecords, useWsRefresh } from '@/hooks/useWs';
import WorkDraftCard from '@/components/w/WorkDraftCard';

// Work requests the AI Manager drafted in chat that are waiting for the owner's go-ahead.
export default function PendingRequests() {
  const { data: drafts = [] } = useWsRecords('Message', { sender: 'manager', 'payload.work_draft.status': 'proposed' }, '-created_date', 10);
  const [busy, setBusy] = useState(null);
  const refresh = useWsRefresh();
  const navigate = useNavigate();
  const { toast } = useToast();
  if (!drafts.length) return null;

  const act = async (m, text, action) => {
    setBusy(m.id);
    const res = await base44.functions.invoke('managerTurn', { conversation_id: m.conversation_id, text, action, draft_id: m.id }).catch(() => null);
    setBusy(null);
    if (!res) return toast({ title: 'Could not update this request', description: 'Please try again.', variant: 'destructive' });
    await refresh();
    const orderId = res.data?.message?.payload?.work_order?.id;
    if (orderId) navigate(`/w/work/${orderId}`);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg text-slate-900">Requests from your AI Manager <span className="text-sm text-slate-400 font-body">({drafts.length})</span></h2>
        <Link to="/w/overview" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"><MessagesSquare className="w-3.5 h-3.5" />Continue in chat</Link>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {drafts.map((m) => (
          <div key={m.id} className="relative">
            <WorkDraftCard d={m.payload.work_draft} busy={!!busy} onAction={(text, action) => act(m, text, action)} />
            {busy === m.id && <div className="absolute inset-0 rounded-2xl bg-white/70 flex items-center justify-center gap-2 text-sm text-slate-600"><Loader2 className="w-4 h-4 animate-spin text-teal-600" />Updating…</div>}
          </div>
        ))}
      </div>
    </section>
  );
}