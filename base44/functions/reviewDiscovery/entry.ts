import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { applyProposal, getOrg } from '../../shared/workspace.ts';
import { setFact, FIELD_LABELS } from '../../shared/facts.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { id, decision, name, fields, value } = await req.json();
    const org = await getOrg(base44, user.id);
    const d = id && await base44.entities.Discovery.get(id).catch(() => null);
    if (!org || !d || d.org_id !== org.id || d.status !== 'pending') return Response.json({ error: 'Not found' }, { status: 404 });

    if (d.entity_type === 'profile' && decision === 'approve') {
      const field = d.fields?.field;
      const v = String(value ?? '').trim().slice(0, 500);
      if (!field || !v) return Response.json({ error: 'Choose a value' }, { status: 400 });
      const opt = (d.fields.options || []).find((o) => o.value === v) || { source: 'owner_edit', source_url: '', excerpt: '' };
      const facts = { ...(org.profile_facts || {}) };
      setFact(facts, field, v, 'confirmed', opt);
      await base44.entities.Organization.update(org.id, { [field]: v, profile_facts: facts });
      await base44.entities.WorkspaceEvent.create({ org_id: org.id, action: 'confirmed', entity_type: 'profile', record_name: FIELD_LABELS[field] || field, source: opt.source, detail: 'Confirmed by owner' });
    } else if (decision === 'approve') {
      await applyProposal(base44, org.id, { entity_type: d.entity_type, name: name || d.name, fields: fields || d.fields, confidence: 1, excerpt: d.source_excerpt }, { source: d.source, source_ref: d.source_ref, verification: 'confirmed', source_title: 'Confirmed by owner' });
    } else {
      await base44.entities.WorkspaceEvent.create({ org_id: org.id, action: 'rejected', entity_type: d.entity_type, record_name: d.name, source: d.source });
    }
    await base44.entities.Discovery.update(id, { status: decision === 'approve' ? 'approved' : 'rejected' });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}