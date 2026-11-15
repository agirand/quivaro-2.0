import React, { useState } from 'react';
import { GitPullRequest } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWsRefresh } from '@/hooks/useWs';

const PR_RE = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+$/i;
const norm = (u) => u.trim().toLowerCase().replace(/\/+$/, '');

export default function PrLinkField({ o }) {
  const refresh = useWsRefresh();
  const [url, setUrl] = useState(o.pr_url || '');
  const [saving, setSaving] = useState(false);
  const valid = !url.trim() || PR_RE.test(norm(url));
  const save = async () => {
    setSaving(true);
    await base44.entities.WorkOrder.update(o.id, { pr_url: url.trim() ? norm(url) : '' });
    setSaving(false); refresh();
  };
  return (
    <div className="card-soft p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-900"><GitPullRequest className="w-4 h-4" />Linked pull request</div>
      <p className="text-xs text-slate-500 mt-1 mb-3">Pull request activity updates this order automatically.{o.pr_state ? ` Last state: ${o.pr_state}.` : ''}</p>
      <div className="flex gap-2">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/owner/repo/pull/12" className="text-xs" />
        <Button size="sm" disabled={saving || !valid || norm(url) === (o.pr_url || '')} onClick={save}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>
      {!valid && <p className="text-xs text-rose-600 mt-1.5">Use a full GitHub pull request link.</p>}
    </div>
  );
}