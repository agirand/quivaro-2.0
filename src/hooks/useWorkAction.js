import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { useWsRefresh } from '@/hooks/useWs';

// Runs a Work Engine action on one order and refreshes workspace data.
export function useWorkAction(id) {
  const refresh = useWsRefresh();
  const [busy, setBusy] = useState('');
  const act = async (action, extra = {}) => {
    setBusy(action);
    const res = await base44.functions.invoke('workAction', { id, action, ...extra }).catch((e) => ({ error: e.response?.data?.error || e.message }));
    setBusy('');
    if (res.error) toast({ title: 'Could not complete that', description: res.error, variant: 'destructive' });
    refresh();
    return !res.error;
  };
  return { act, busy };
}