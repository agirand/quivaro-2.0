import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { PROPOSAL_SCHEMA, knownNames, processProposals, getOrg } from '../../shared/workspace.ts';
import { SAMPLE_SOURCES } from '../../shared/sampleSources.ts';

// Demo discovery: ingests clearly-labeled SAMPLE email, documents and financial data
// for the providers the owner connected in demo mode.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { provider } = await req.json();
    const org = await getOrg(base44, user.id);
    if (!org) return Response.json({ error: 'No organization' }, { status: 404 });
    const pick = SAMPLE_SOURCES.filter((s) => s.provider === provider);
    if (!pick.length) return Response.json({ applied: [], queued: [], sources: 0 });

    const existing = await base44.entities.SourceRef.filter({ org_id: org.id, provider, is_sample: true }, { limit: 50, fields: ['title'] });
    const seen = new Set(existing.items.map((s) => s.title));
    const fresh = pick.filter((s) => !seen.has(s.title));
    if (!fresh.length) return Response.json({ applied: [], queued: [], sources: 0 });
    const refs = await base44.entities.SourceRef.bulkCreate(fresh.map((s) => ({ ...s, org_id: org.id, is_sample: true })));

    const known = await knownNames(base44, org.id);
    const prompt = `You are Quivaro's business discovery engine. Extract structured business records from the sources below for the company's workspace.
Find: employees (name + role), customers (company + contact), offerings/services (with pricing), projects/engagements, outstanding tasks with deadlines and assignees, and operating preferences/procedures.
Records already known: ${JSON.stringify(known)}
Rules: only facts present in the sources. Set source_index to the [n] of the source and excerpt to a short quote. Use confidence >= 0.85 for explicit facts. Set needs_confirmation=true with a reason for ambiguous facts (unclear roles, partial names) and for likely duplicates of each other or of known records (e.g. name variants of the same business); set possible_match. Deduplicate: one proposal per real-world entity.

Sources:
${fresh.map((s, i) => `[${i}] (${s.kind}) ${s.title}\n${s.content}`).join('\n\n')}`;

    const out = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: { type: 'object', properties: { proposals: PROPOSAL_SCHEMA }, required: ['proposals'] } });
    const result = await processProposals(base44, org.id, out.proposals, (p) => {
      const ref = refs[p.source_index] || refs[0];
      return { source: 'discovery', source_ref: ref.id, source_title: ref.title };
    });
    return Response.json({ ...result, sources: refs.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}