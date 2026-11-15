import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function RepoPicker({ org }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['ws', 'gh-repos'], queryFn: () => base44.functions.invoke('githubRepo', { action: 'repos' }).then((r) => r.data.repos), retry: false, staleTime: 300000 });
  const choose = async (repo) => {
    await base44.entities.Organization.update(org.id, { github_repo: repo });
    qc.setQueryData(['ws', 'org'], { ...org, github_repo: repo });
  };
  return (
    <select value={org.github_repo || ''} onChange={(e) => choose(e.target.value)} disabled={isLoading} className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-60">
      <option value="" disabled>{isLoading ? 'Loading repositories…' : 'Select a repository'}</option>
      {(data || []).map((r) => <option key={r.full_name} value={r.full_name}>{r.full_name}</option>)}
    </select>
  );
}