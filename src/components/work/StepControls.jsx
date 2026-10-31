import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TOOL_LABEL } from '@/lib/work';

export default function StepControls({ s, i, act, busy }) {
  const [note, setNote] = useState('');
  const [mode, setMode] = useState('');
  if (s.status === 'awaiting_approval') return (
    <div className="mt-3 space-y-2">
      {mode === 'reject' && <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What should change?" rows={2} />}
      <div className="flex gap-2">
        {mode === 'reject'
          ? <><Button size="sm" variant="outline" onClick={() => setMode('')}>Back</Button><Button size="sm" disabled={!!busy || !note.trim()} onClick={() => act('reject_step', { index: i, note })}>Send back</Button></>
          : <><Button size="sm" disabled={!!busy} onClick={() => act('approve_step', { index: i })}>{busy === 'approve_step' ? 'Approving…' : 'Approve'}</Button><Button size="sm" variant="outline" onClick={() => setMode('reject')}>Request changes</Button></>}
      </div>
    </div>
  );
  if (s.status === 'needs_connection') return (
    <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50/60 p-3 space-y-2">
      <p className="text-xs text-rose-700">{TOOL_LABEL[s.tool]} isn't connected for live work, so Quivaro has not done this step. Your team can do it, then mark it complete.</p>
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What your team did (e.g. sent from our Gmail on Oct 30)" rows={2} className="bg-white" />
      <Button size="sm" disabled={!!busy || !note.trim()} onClick={() => act('manual_complete', { index: i, note })}>Mark completed by my team</Button>
    </div>
  );
  return null;
}