import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Reads repositories and recent commits through the app's shared GitHub connection.
// Admin-only: the connection belongs to the app builder's GitHub account.
const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'GitHub is available to workspace admins only' }, { status: 403 });
    const { action, repo } = await req.json().catch(() => ({}));
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');
    const gh = (path) => fetch(`https://api.github.com${path}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json', 'User-Agent': 'Quivaro' }, signal: AbortSignal.timeout(10000) });

    if (action === 'repos') {
      const r = await gh('/user/repos?sort=pushed&per_page=50');
      if (!r.ok) return Response.json({ error: `GitHub returned ${r.status}` }, { status: 502 });
      const list = await r.json();
      return Response.json({ repos: list.map((x) => ({ full_name: x.full_name, private: x.private })) });
    }
    if (action === 'commits') {
      if (!repo || !REPO_RE.test(repo)) return Response.json({ error: 'A valid owner/repo is required' }, { status: 400 });
      const r = await gh(`/repos/${repo}/commits?per_page=10`);
      if (r.status === 404 || r.status === 409) return Response.json({ commits: [] });
      if (!r.ok) return Response.json({ error: `GitHub returned ${r.status}` }, { status: 502 });
      const list = await r.json();
      return Response.json({
        commits: list.map((c) => ({
          sha: c.sha.slice(0, 7),
          message: (c.commit.message || '').split('\n')[0].slice(0, 200),
          author: c.author?.login || c.commit.author?.name || 'Unknown',
          avatar: c.author?.avatar_url || '',
          date: c.commit.author?.date,
          url: c.html_url,
        })),
      });
    }
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}