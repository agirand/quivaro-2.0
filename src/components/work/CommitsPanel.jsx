import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { GitCommitHorizontal, Github, ExternalLink, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { base44 } from '@/api/base44Client';
import RepoPicker from './RepoPicker';

const call = (payload) => base44.functions.invoke('githubRepo', payload).then((r) => r.data);

export default function CommitsPanel({ org }) {
  const repo = org.github_repo;
  const { data, isLoading, error } = useQuery({ queryKey: ['ws', 'commits', repo], queryFn: () => call({ action: 'commits', repo }), enabled: !!repo, retry: false });
  const denied = error?.response?.status === 403;
  return (
    <section className="card-soft p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2"><Github className="w-4 h-4 text-slate-700" /><h2 className="text-lg text-slate-900">Latest commits</h2></div>
        {!denied && <RepoPicker org={org} />}
      </div>
      {denied ? <p className="text-sm text-slate-500">GitHub activity is visible to workspace admins only.</p>
        : !repo ? <p className="text-sm text-slate-500">Choose a repository to follow project progress here.</p>
        : isLoading ? <div className="flex items-center gap-2 text-sm text-slate-500 py-4"><Loader2 className="w-4 h-4 animate-spin text-teal-600" />Loading commits…</div>
        : error ? <p className="text-sm text-rose-600">Couldn't load commits: {error.response?.data?.error || error.message}</p>
        : !data?.commits?.length ? <p className="text-sm text-slate-500">No commits in this repository yet.</p>
        : <ul className="divide-y divide-slate-100">
            {data.commits.map((c) => (
              <li key={c.sha}>
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition">
                  <GitCommitHorizontal className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-slate-900 truncate">{c.message}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{c.author} · {c.date ? formatDistanceToNow(new Date(c.date), { addSuffix: true }) : ''} · <span className="font-mono">{c.sha}</span></div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 mt-1 shrink-0" />
                </a>
              </li>
            ))}
          </ul>}
    </section>
  );
}