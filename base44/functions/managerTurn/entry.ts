import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { PROPOSAL_SCHEMA, knownNames, processProposals, getOrg } from '../../shared/workspace.ts';
import { searchCompany } from '../../shared/companyResearch.ts';
import { PROFILE_KEYS, setFact, supported, normKey, norm } from '../../shared/facts.ts';

const AGENTS = ['Sales', 'Operations', 'Finance', 'Administration'];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { conversation_id, text } = await req.json();
    const msg = String(text || '').trim().slice(0, 4000);
    if (!conversation_id || !msg) return Response.json({ error: 'Missing message' }, { status: 400 });
    const db = base44;
    const org = await getOrg(db, user.id);
    const convo = await db.entities.Conversation.get(conversation_id).catch(() => null);
    if (!org || !convo || convo.org_id !== org.id) return Response.json({ error: 'Not found' }, { status: 404 });

    await db.entities.Message.create({ org_id: org.id, conversation_id, channel: 'web', direction: 'inbound', sender: 'owner', text: msg, delivery_status: 'delivered_in_app' });
    const [hist, known] = await Promise.all([
      db.entities.Message.filter({ conversation_id }, { sort: '-created_date', limit: 14, fields: ['sender', 'text'] }),
      knownNames(db, org.id),
    ]);
    const transcript = hist.items.reverse().map((m) => `${m.sender === 'owner' ? 'OWNER' : 'MANAGER'}: ${m.text}`).join('\n');
    const facts = { ...(org.profile_facts || {}) };
    const profile = Object.fromEntries(PROFILE_KEYS.map((k) => [k, org[k] ? { value: org[k], status: facts[k]?.status || 'unverified' } : 'UNKNOWN']));
    const stage = org.discovery_stage || 'intro';
    const stageNote = stage === 'services_confirm'
      ? `STAGE: You just summarised the owner's website and listed services it advertises (${known.offering.join(', ')}). If the owner says this is right, set services_confirmed=true. If they correct you, add missing services as proposals and list services to remove in remove_services. Then thank them briefly and ask the next question.`
      : stage === 'intro' || stage === 'awaiting_match'
        ? 'STAGE: You are learning the company name and what they do, so the company can be looked up online. If the name is not yet known, warmly ask for it. Do not claim you searched anything.'
        : '';

    const prompt = `You are the Quivaro AI Manager: a warm, sharp business colleague for a small business owner, never a form or CRM wizard.

Company profile (status: confirmed = owner said it, discovered = from public website, not yet confirmed; UNKNOWN = not established): ${JSON.stringify(profile)}
Records already in the workspace: ${JSON.stringify(known)}

Conversation so far:
${transcript}

STRICT ACCURACY RULES:
- Only record facts the owner explicitly and unambiguously stated in their LATEST message. Never invent or assume revenue, client counts, employee names, customer types, problems, tools or anything else. Generic industry knowledge is never a company fact.
- Each fact/proposal needs excerpt = the owner's exact words from the latest message that state it.
- If you suspect something (an inference), you may ASK about it as a question in your reply, but never record it.
- Unknown stays unknown.

Your job for this turn:
1. facts: profile fields the owner explicitly stated in the latest message (e.g. "eight employees" -> employee_count "8"). Owner corrections of existing values count.
2. proposals: new business records the owner stated (people, customers, services, projects, tasks, procedures). Use confidence >= 0.8 only for explicit statements. Set needs_confirmation=true (with a reason) for anything ambiguous or partial, or a possible duplicate of a known record (set possible_match). Use the exact existing name when updating a known record.
${stageNote}
3. reply: 2-4 short, warm, natural sentences. Acknowledge specifically what you learned, then ask exactly ONE next question. Priorities, skipping anything already in the profile (any status) or answered in the conversation: company name and what they do; how many employees and who handles what; how they work with customers; communication tools (email, WhatsApp, phone...); software they use; what operational work takes the owner's time; then deeper (key clients, projects, deadlines, preferences). Never repeat an answered question. Only ask about a discovered value if verifying it matters.
4. If the owner asks for work, delegate to one of ${AGENTS.join(', ')} as an internal action. You cannot send emails, messages, payments or touch external systems; anything outward-facing has requires_approval=true and your reply says it is drafted/queued, never done.
Never ask for passwords. If the owner offers one, tell them not to share it and to use the Integrations page instead.`;

    const out = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          reply: { type: 'string' },
          facts: { type: 'array', items: { type: 'object', properties: { field: { type: 'string', enum: PROFILE_KEYS }, value: { type: 'string' }, excerpt: { type: 'string' } }, required: ['field', 'value', 'excerpt'] } },
          proposals: PROPOSAL_SCHEMA,
          services_confirmed: { type: 'boolean' },
          remove_services: { type: 'array', items: { type: 'string' } },
          delegations: { type: 'array', items: { type: 'object', properties: { agent: { type: 'string', enum: AGENTS }, action: { type: 'string' }, requires_approval: { type: 'boolean' } }, required: ['agent', 'action'] } },
        },
        required: ['reply'],
      },
    });

    // Owner-stated profile facts: only kept when the excerpt really is in the owner's message.
    const upd = {};
    const src = { source: 'conversation', source_url: conversation_id };
    const profileKeys = [];
    for (const f of (out.facts || []).slice(0, 13)) {
      const value = String(f.value || '').trim().slice(0, 500);
      if (!PROFILE_KEYS.includes(f.field) || !value || !supported(f.excerpt, msg)) continue;
      if (facts[f.field]?.status === 'confirmed' && norm(facts[f.field].value) === norm(value)) continue;
      setFact(facts, f.field, value, 'confirmed', { ...src, excerpt: f.excerpt });
      upd[f.field] = value;
      profileKeys.push(f.field);
    }
    if (profileKeys.length) await db.entities.WorkspaceEvent.create({ org_id: org.id, action: 'profile', entity_type: 'profile', record_name: profileKeys.join(', '), source: 'conversation', detail: 'Stated by owner' });

    const proposals = (out.proposals || []).map((p) => (supported(p.excerpt, msg) ? p : { ...p, needs_confirmation: true, reason: p.reason || "I couldn't match this to your exact words, so please confirm it." }));
    const { applied, queued } = await processProposals(db, org.id, proposals, () => ({ source: 'conversation', source_ref: conversation_id, source_title: 'Web chat', verification: 'confirmed' }));
    const delegations = [];
    for (const d of (out.delegations || []).slice(0, 4)) {
      const status = d.requires_approval ? 'pending_approval' : 'logged';
      await db.entities.AgentAction.create({ org_id: org.id, agent: d.agent, action: String(d.action).slice(0, 300), status, source: 'conversation', note: 'Delegated by AI Manager. No external action is performed.' });
      delegations.push({ agent: d.agent, action: d.action, status });
    }

    let replyText = out.reply;
    const extra = {};
    if (stage === 'services_confirm') {
      const removed = [];
      const offers = (await db.entities.Offering.filter({ org_id: org.id }, { limit: 300, fields: ['name'] })).items;
      for (const s of (out.remove_services || []).slice(0, 10)) {
        const hit = offers.find((o) => normKey(o.name) === normKey(s));
        if (!hit) continue;
        await db.entities.Offering.delete(hit.id);
        removed.push(hit.name);
        await db.entities.WorkspaceEvent.create({ org_id: org.id, action: 'rejected', entity_type: 'offering', record_name: hit.name, source: 'conversation', detail: 'Removed by owner; future scans will not re-add it' });
      }
      if (removed.length) upd.rejected_services = [...new Set([...(org.rejected_services || []), ...removed])];
      if (out.services_confirmed || removed.length || applied.length) {
        await db.entities.Offering.updateMany({ org_id: org.id, source: 'public_web', verification: 'ai_extracted' }, { $set: { verification: 'confirmed' } });
        for (const k of ['description', 'industry']) if (facts[k]?.status === 'discovered') setFact(facts, k, facts[k].value, 'confirmed', { source: facts[k].source, source_url: facts[k].source_url, excerpt: facts[k].excerpt });
        upd.discovery_stage = 'learning';
      }
    }
    upd.profile_facts = facts;
    const filled = PROFILE_KEYS.filter((k) => upd[k] || org[k]).length;
    upd.onboarding_stage = filled >= 5 ? 'established' : 'learning';
    await db.entities.Organization.update(org.id, upd);

    const name = upd.name || org.name;
    if ((stage === 'intro' || stage === 'awaiting_match') && name) {
      const cands = await searchCompany(base44, { name, location: upd.location || org.location, website: upd.website || org.website, latest_owner_message: msg });
      await db.entities.Organization.update(org.id, { discovery_stage: cands.length ? 'awaiting_match' : 'intro', match_candidates: cands });
      if (cands.length) {
        replyText = cands.length > 1 ? 'I searched online and found a few companies that could be yours. Which one is right?' : 'I searched online and found a company that looks like yours. Is this the right one?';
        Object.assign(extra, { candidates: cands, match_status: 'pending', live_search: true });
      } else {
        replyText = `I searched online but couldn't find a reliable match for ${name}. What's your website address, or another detail like your city?`;
      }
    }
    const reply = await db.entities.Message.create({ org_id: org.id, conversation_id, channel: 'web', direction: 'outbound', sender: 'manager', text: replyText, delivery_status: 'delivered_in_app', payload: { applied, queued, delegations, profile: profileKeys, ...extra } });
    await db.entities.Conversation.update(conversation_id, { last_message: replyText.slice(0, 140), last_message_at: new Date().toISOString() });
    return Response.json({ message: reply, facts: profileKeys });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}