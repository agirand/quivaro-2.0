import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Called by the "GitHub PR → Work Orders" workflow. Updates work orders linked to the PR URL.
const ACTIVE = ['executing', 'needs_input', 'awaiting_approval', 'blocked', 'revision_requested'];
const HANDLED = ['opened', 'reopened', 'synchronize', 'closed'];
const norm = (u) => String(u || '').trim().toLowerCase().replace(/\/+$/, '');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const data = body.data;
    const event = data?._provider_meta?.['x-github-event'];
    const pr = data?.pull_request;
    if (event !== 'pull_request' || !pr?.html_url) return Response.json({ skipped: 'not a pull request event' });
    if (!HANDLED.includes(data.action)) return Response.json({ skipped: `action ${data.action}` });

    const url = norm(pr.html_url);
    const kind = data.action === 'closed' ? (pr.merged ? 'merged' : 'closed') : data.action;
    const key = `${url}#${kind}#${pr.head?.sha || ''}#${pr.updated_at || ''}`;
    const db = base44.asServiceRole.entities.WorkOrder;
    const [byField, byText] = await Promise.all([
      db.filter({ pr_url: url }, { limit: 50 }),
      db.filter({ request: { $regex: esc(url), $options: 'i' } }, { limit: 50 }),
    ]);
    const orders = [...byField.items, ...byText.items].filter((o, i, a) => a.findIndex((x) => x.id === o.id) === i && !o.is_demo);

    const updated = [];
    for (const o of orders) {
      // Verify the match: the stored URL or the request text must contain this exact PR URL.
      if (norm(o.pr_url) !== url && !norm(o.request).includes(url)) continue;
      const history = o.history || [];
      if (history.some((h) => h.key === key)) continue; // duplicate delivery
      const patch = { pr_url: url, pr_state: kind === 'merged' ? 'merged' : kind === 'closed' ? 'closed' : 'open' };
      let note = `Pull request #${pr.number} ${kind === 'synchronize' ? 'received new commits' : kind} by ${data.sender?.login || 'GitHub'}`;
      if (kind === 'merged' && ACTIVE.includes(o.status)) {
        Object.assign(patch, { status: 'quality_review', needs_from_customer: `Pull request #${pr.number} was merged. Review the work and confirm it meets the acceptance criteria.` });
        note += '. Moved to quality review.';
      } else if (kind === 'closed' && ACTIVE.includes(o.status)) {
        Object.assign(patch, { status: 'blocked', needs_from_customer: `Pull request #${pr.number} was closed without merging. Decide whether to reopen it or cancel this work.` });
        note += ' without merging. Work is blocked.';
      } else if (kind === 'reopened' && o.status === 'blocked' && o.pr_state === 'closed') {
        Object.assign(patch, { status: 'executing', needs_from_customer: '' });
        note += '. Work resumed.';
      }
      patch.history = [...history, { at: new Date().toISOString(), event: 'GitHub pull request', detail: `${note} (${pr.html_url})`, key, source: 'github' }];
      await db.update(o.id, patch);
      updated.push(o.id);
    }
    return Response.json({ matched: orders.length, updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}