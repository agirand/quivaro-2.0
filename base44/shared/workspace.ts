// Shared logic for turning AI-extracted proposals into organization records.
export const TYPES = {
  employee: { entity: 'Employee', fields: ['role', 'email', 'responsibilities'] },
  customer: { entity: 'Customer', fields: ['contact_name', 'email', 'industry', 'relationship'] },
  offering: { entity: 'Offering', fields: ['description', 'price_note'] },
  project: { entity: 'Project', fields: ['customer_name', 'status', 'due_date', 'description'] },
  task: { entity: 'WorkTask', fields: ['assignee', 'project_name', 'due_date', 'priority'] },
  preference: { entity: 'Preference', fields: ['detail', 'category'] },
};

const ALL_FIELDS = ['role', 'email', 'responsibilities', 'contact_name', 'industry', 'relationship', 'description', 'price_note', 'customer_name', 'status', 'due_date', 'assignee', 'project_name', 'priority', 'detail', 'category'];

export const PROPOSAL_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      entity_type: { type: 'string', enum: Object.keys(TYPES) },
      name: { type: 'string', description: 'Person name, company name, service name, project name, task title or preference title' },
      fields: { type: 'object', properties: Object.fromEntries(ALL_FIELDS.map((f) => [f, { type: 'string' }])) },
      confidence: { type: 'number', description: '0-1, how explicitly the source states this' },
      needs_confirmation: { type: 'boolean', description: 'true if ambiguous, inferred, or a likely duplicate of a known record' },
      possible_match: { type: 'string', description: 'Name of an existing known record this may duplicate, if any' },
      reason: { type: 'string', description: 'Why confirmation is needed' },
      source_index: { type: 'number', description: 'Index of the source document, if sources were provided' },
      excerpt: { type: 'string', description: 'Short verbatim quote supporting the fact' },
    },
    required: ['entity_type', 'name', 'confidence'],
  },
};

const clean = (type, fields = {}) => Object.fromEntries(TYPES[type].fields.filter((f) => fields[f]).map((f) => [f, String(fields[f]).slice(0, 500)]));
import { normKey } from './facts.ts';

export async function knownNames(db, orgId) {
  const out = {};
  await Promise.all(Object.entries(TYPES).map(async ([t, c]) => {
    const page = await db.entities[c.entity].filter({ org_id: orgId }, { limit: 60, fields: ['name'] });
    out[t] = page.items.map((i) => i.name);
  }));
  return out;
}

export async function applyProposal(db, orgId, p, meta) {
  const c = TYPES[p.entity_type];
  if (!c || !p.name) return null;
  const name = String(p.name).trim().slice(0, 200);
  const fields = clean(p.entity_type, p.fields);
  // Normalized match so "Tax Preparation" and "Tax preparation services" are one record.
  const page = await db.entities[c.entity].filter({ org_id: orgId }, { limit: 300, fields: ['name', 'verification', ...c.fields] });
  const existing = page.items.find((i) => normKey(i.name) === normKey(name));
  const confirmed = meta.verification === 'confirmed';
  const base = { source: meta.source, source_ref: meta.source_ref || '', source_excerpt: (p.excerpt || '').slice(0, 300), confidence: p.confidence ?? 1, verification: meta.verification || 'ai_extracted' };
  let action;
  if (existing) {
    // A later scan never silently overwrites what the owner confirmed.
    if (existing.verification === 'confirmed' && !confirmed) return { type: p.entity_type, name: existing.name, action: 'unchanged' };
    const updates = Object.fromEntries(Object.entries(fields).filter(([k, v]) => v && existing[k] !== v));
    if (!Object.keys(updates).length && !(confirmed && existing.verification !== 'confirmed')) return { type: p.entity_type, name: existing.name, action: 'unchanged' };
    await db.entities[c.entity].update(existing.id, { ...updates, ...(confirmed ? { verification: 'confirmed' } : {}) });
    action = 'updated';
  } else {
    await db.entities[c.entity].create({ org_id: orgId, name, ...fields, ...base });
    action = 'created';
  }
  await db.entities.WorkspaceEvent.create({ org_id: orgId, action, entity_type: p.entity_type, record_name: name, source: meta.source, detail: meta.source_title || '' });
  return { type: p.entity_type, name, action };
}

// Confident, unambiguous facts are written; everything else goes to the review queue.
export async function processProposals(db, orgId, proposals = [], metaFor) {
  const applied = [];
  const queued = [];
  for (const p of proposals.slice(0, 40)) {
    if (!TYPES[p.entity_type] || !p.name) continue;
    const meta = metaFor(p);
    if ((p.confidence ?? 0) >= 0.75 && !p.needs_confirmation) {
      const r = await applyProposal(db, orgId, p, meta);
      if (r && r.action !== 'unchanged') applied.push(r);
    } else {
      const dup = await db.entities.Discovery.filter({ org_id: orgId, entity_type: p.entity_type, status: 'pending' }, { limit: 100, fields: ['name'] });
      if (dup.items.some((x) => normKey(x.name) === normKey(p.name))) continue;
      await db.entities.Discovery.create({ org_id: orgId, entity_type: p.entity_type, name: String(p.name).slice(0, 200), fields: clean(p.entity_type, p.fields), reason: p.reason || 'Needs confirmation', possible_match: p.possible_match || '', confidence: p.confidence ?? 0.5, source: meta.source, source_ref: meta.source_ref || '', source_excerpt: (p.excerpt || '').slice(0, 300), status: 'pending' });
      await db.entities.WorkspaceEvent.create({ org_id: orgId, action: 'queued', entity_type: p.entity_type, record_name: p.name, source: meta.source, detail: p.reason || '' });
      queued.push({ type: p.entity_type, name: p.name });
    }
  }
  return { applied, queued };
}

export async function getOrg(db, userId) {
  const page = await db.entities.Organization.filter({ created_by_id: userId }, { limit: 1 });
  return page.items[0];
}