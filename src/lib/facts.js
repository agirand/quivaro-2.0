import { base44 } from '@/api/base44Client';

export const FACT_STATUS = {
  confirmed: { label: 'Confirmed', cls: 'bg-emerald-50 text-emerald-800' },
  discovered: { label: 'From website', cls: 'bg-sky-50 text-sky-800' },
  unverified: { label: 'Unverified', cls: 'bg-slate-100 text-slate-600' },
};
export const factStatus = (org, k) => org?.profile_facts?.[k]?.status || (org?.[k] ? 'unverified' : 'unknown');

// Owner confirms or corrects profile values; history is preserved and future scans won't overwrite.
export async function confirmFields(orgId, values) {
  const org = await base44.entities.Organization.get(orgId);
  const facts = { ...(org.profile_facts || {}) };
  const t = new Date().toISOString();
  for (const [k, v] of Object.entries(values)) {
    const prev = facts[k];
    const same = prev && prev.value === v;
    const history = prev ? [...(prev.history || []), { value: prev.value, status: prev.status, source: prev.source, source_url: prev.source_url, excerpt: prev.excerpt, at: prev.updated_at }].slice(-10) : [];
    facts[k] = { value: v, status: 'confirmed', source: same ? prev.source : 'owner_edit', source_url: same ? prev.source_url : '', excerpt: same ? prev.excerpt : '', discovered_at: prev?.discovered_at || t, updated_at: t, history };
  }
  await base44.entities.Organization.update(orgId, { ...values, profile_facts: facts });
}