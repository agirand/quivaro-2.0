import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { getOrg } from '../../shared/workspace.ts';
import { scopeOrder } from '../../shared/scope.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { request, template_key, due_date } = await req.json().catch(() => ({}));
    if (!String(request || '').trim()) return Response.json({ error: 'Describe the outcome you need' }, { status: 400 });
    const org = await getOrg(base44, user.id);
    if (!org) return Response.json({ error: 'Not found' }, { status: 404 });
    const rec = await scopeOrder(base44, org, { request, template_key, due_date });
    return Response.json({ id: rec.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}