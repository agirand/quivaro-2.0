// Fact provenance for the company profile. Status: confirmed (owner stated/confirmed),
// discovered (identifiable external source, unconfirmed). A missing fact is unknown.
export const now = () => new Date().toISOString();
export const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export const normKey = (s) => norm(s).replace(/\b(services?|and|the|of|for)\b/g, ' ').replace(/s\b/g, '').replace(/\s+/g, ' ').trim();
// True when the excerpt really appears in the source text (anti-fabrication check).
export const supported = (excerpt, text) => { const e = norm(excerpt); return e.length >= 3 && norm(text).includes(e); };

export const PROFILE_KEYS = ['name', 'industry', 'description', 'employee_count', 'customer_segments', 'time_drains', 'location', 'communication_tools', 'software', 'website', 'address', 'public_phone', 'public_email'];
export const FIELD_LABELS = { description: 'What you do', industry: 'Industry', address: 'Address', public_phone: 'Public phone', public_email: 'Public email' };

export function setFact(facts, field, value, status, src) {
  const prev = facts[field];
  const t = now();
  const history = prev ? [...(prev.history || []), { value: prev.value, status: prev.status, source: prev.source, source_url: prev.source_url, excerpt: prev.excerpt, at: prev.updated_at }].slice(-10) : [];
  facts[field] = { value, status, source: src.source, source_url: src.source_url || '', excerpt: String(src.excerpt || '').slice(0, 300), discovered_at: prev?.discovered_at || t, updated_at: t, history };
}

// Stage a discovered value without overwriting anything the owner confirmed.
export function stageDiscovered(org, facts, field, opt) {
  const f = facts[field];
  const cur = org[field];
  if (f?.status === 'confirmed' && !f.value) return 'skip'; // owner cleared it on purpose
  if (cur && norm(cur) === norm(opt.value)) { if (!f) setFact(facts, field, cur, 'discovered', opt); return 'same'; }
  if (cur) return 'conflict';
  setFact(facts, field, opt.value, 'discovered', opt);
  return 'set';
}

// One pending review card per profile field; repeated discoveries merge into it.
export async function queueProfileReview(db, org, field, options, reason) {
  const page = await db.entities.Discovery.filter({ org_id: org.id, entity_type: 'profile', status: 'pending', name: FIELD_LABELS[field] || field }, { limit: 1 });
  const existing = page.items[0];
  const merged = [...(existing?.fields?.options || [])];
  for (const o of options) if (!merged.some((m) => norm(m.value) === norm(o.value))) merged.push(o);
  const data = { fields: { field, options: merged.slice(0, 6) }, reason, source_excerpt: merged.map((o) => o.excerpt).filter(Boolean)[0] || '' };
  if (existing) return db.entities.Discovery.update(existing.id, data);
  await db.entities.Discovery.create({ org_id: org.id, entity_type: 'profile', name: FIELD_LABELS[field] || field, confidence: 0.6, source: 'public_web', source_ref: options[0]?.source_url || '', status: 'pending', ...data });
  await db.entities.WorkspaceEvent.create({ org_id: org.id, action: 'queued', entity_type: 'profile', record_name: FIELD_LABELS[field] || field, source: 'public_web', detail: reason });
}