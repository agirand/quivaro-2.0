import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useWsRecords, useWsRefresh } from '@/hooks/useWs';
import WsMessage from './WsMessage';
import ChatComposer from './ChatComposer';

export default function ManagerChat({ conversationId, className = 'h-[560px]' }) {
  const { data: msgs = [] } = useWsRecords('Message', { conversation_id: conversationId }, 'created_date', 200);
  const [pending, setPending] = useState(null);
  const refresh = useWsRefresh();
  const { toast } = useToast();
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [msgs.length, pending]);

  const send = async (text) => {
    setPending(text);
    const res = await base44.functions.invoke('managerTurn', { conversation_id: conversationId, text }).catch((e) => ({ error: e }));
    if (res.error) toast({ title: 'The AI Manager could not respond', description: 'Please try again.', variant: 'destructive' });
    await refresh();
    setPending(null);
  };

  return (
    <div className={`card-soft flex flex-col overflow-hidden ${className}`}>
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
        {msgs.map((m) => <WsMessage key={m.id} m={m} />)}
        {pending && <WsMessage m={{ sender: 'owner', text: pending }} />}
        {pending && <div className="flex items-center gap-2 text-xs text-slate-500 pl-11"><Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />AI Manager is reading and updating your workspace…</div>}
        <div ref={end} />
      </div>
      <ChatComposer onSend={send} disabled={!!pending} />
    </div>
  );
}