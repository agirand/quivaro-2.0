import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { PROPOSAL_SCHEMA, knownNames, processProposals, getOrg } from '../../shared/workspace.ts';
import { searchCompany } from '../../shared/companyResearch.ts';
import { PROFILE_KEYS, setFact, supported, normKey, norm } from '../../shared/facts.ts';
import { scopeOrder } from '../../shared/scope.ts';

const WORK_INTENTS = ['none', 'gathering', 'ready', 'confirm', 'cancel'];

const setDraft = (db, m, patch) => db.entities.Message.update(m.id, { payload: { ...m.payload, work_draft: { ...m.payload.work_draft, ...patch } } });

// Scopes the pending draft into a Work Order and returns the manager's reply for it.
async function scopeDraft(base44, org, draftMsg) {
  const d = draftMsg.payload.work_draft;
  const rec = await scopeOrder(base44, org, { request: d.request, template_key: d.template_key, due_date: d.due_date });
  await setDraft(base44, draftMsg, { status: 'created', order_id: rec.id });
  const approvals = rec.steps.filter((s) => s.needs_approval).length;
  const text = `I've scoped **${rec.title}**: ${rec.steps.length} steps, ${approvals} of them need your approval. Nothing starts until you approve the plan.${rec.inputs?.length ? ' A few details are still needed from you; they are listed on the work order.' : ''}`;
  return { text, payload: { work_order: { id: rec.id, title: rec.title, steps: rec.steps.length, approvals, inputs: rec.inputs || [] } } };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { conversation_id, text, action, draft_id } = await req.json();
    const msg = String(text || '').trim().slice(0, 4000);
    if (!conversation_id || !msg) return Response.json({ error: 'Missing message' }, { status: 400 });
    const db = base44;
    const org = await getOrg(db, user.id);
    const convo = await db.entities.Conversation.get(conversation_id).catch(() => null);
    if (!org || !convo || convo.org_id !== org.id) return Response.json({ error: 'Not found' }, { status: 404 });

    await db.entities.Message.create({ org_id: org.id, conversation_id, channel: 'web', direction: 'inbound', sender: 'owner', text: msg, delivery_status: 'delivered_in_app' });
    const [hist, known, tplPage] = await Promise.all([
      db.entities.Message.filter({ conversation_id }, { sort: '-created_date', limit: 14, fields: ['id', 'sender', 'text', 'payload'] }),
      knownNames(db, org.id),
      db.entities.WorkTemplate.filter({ org_id: org.id }, { limit: 50, fields: ['key', 'name', 'description', 'inputs'] }),
    ]);
    const tpls = tplPage.items;
    // A specific request (e.g. from the Work Center) can be targeted by id; otherwise the latest pending one in this chat.
    const picked = draft_id ? await db.entities.Message.get(draft_id).catch(() => null) : null;
    const draftMsg = picked
      ? (picked.conversation_id === conversation_id && picked.payload?.work_draft?.status === 'proposed' ? picked : null)
      : hist.items.find((m) => m.sender === 'manager' && m.payload?.work_draft?.status === 'proposed');
    const say = async (replyText, payload = {}) => {
      const reply = await db.entities.Message.create({ org_id: org.id, conversation_id, channel: 'web', direction: 'outbound', sender: 'manager', text: replyText, delivery_status: 'delivered_in_app', payload });
      await db.entities.Conversation.update(conversation_id, { last_message: replyText.slice(0, 140), last_message_at: new Date().toISOString() });
      return Response.json({ message: reply });
    };

    // Button actions on a work request card: no LLM turn needed.
    if (action === 'confirm_work' || action === 'discard_work') {
      if (!draftMsg) return say('That work request is no longer pending. Tell me what you need and I will put a new one together.');
      if (action === 'discard_work') {
        await setDraft(db, draftMsg, { status: 'discarded' });
        return say('No problem, I set that request aside. Just tell me whenever you want something done.');
      }
      const r = await scopeDraft(base44, org, draftMsg);
      return say(r.text, r.payload);
    }

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
3. reply: if this turn is about requested work (see WORK REQUESTS), the reply follows those rules only and asks NO onboarding question. Otherwise: 2-4 short, warm, natural sentences. Acknowledge specifically what you learned, then ask exactly ONE next question. Priorities, skipping anything already in the profile (any status) or answered in the conversation: company name and what they do; how many employees and who handles what; how they work with customers; communication tools (email, WhatsApp, phone...); software they use; what operational work takes the owner's time; then deeper (key clients, projects, deadlines, preferences). Never repeat an answered question. Only ask about a discovered value if verifying it matters.
WORK REQUESTS (takes priority over onboarding questions in this turn):
Today is ${new Date().toISOString().slice(0, 10)}.
Work templates (standard services) with the inputs each needs: ${JSON.stringify(tpls.map((t) => ({ key: t.key, name: t.name, description: t.description, inputs: t.inputs || [] })))}
Pending work request awaiting the owner's confirmation: ${draftMsg ? JSON.stringify(draftMsg.payload.work_draft) : 'none'}
When the owner asks Quivaro to get something done (an outcome to deliver, e.g. "follow up with these leads", "chase overdue invoices"), act as a work intake, filling "work":
- Essential = who or what the work covers and the goal. Anything else (contact details, tone, deadline) is non-essential: put it in "missing" instead of asking. As soon as the essentials are known, use "ready".
- intent "gathering": essential details are missing. Ask exactly ONE short question about the most important missing detail (who/what it covers, the goal, any deadline). Ask at most 2 such questions over the conversation; after that, move on with what you have.
- intent "ready": you know enough to scope it. "request" = one complete description of the outcome combining every detail the owner gave across the conversation (names, contact details, goals, tone, deadline), without inventing anything. Pick the best template_key (or ""), title (short), due_date as YYYY-MM-DD only if the owner gave a deadline, and "missing" = non-essential inputs still unknown. Your reply briefly summarises what you will do and asks them to confirm so you can scope it. If the owner changes a pending request, return "ready" again with the updated request.
- intent "confirm": a request is pending and the owner clearly agrees to go ahead. Reply with one short sentence.
- intent "cancel": a request is pending and the owner declines or drops it.
- intent "none": the message is not about requested work.
Quivaro never sends emails, messages or payments from chat; scoped work runs only after the owner approves the plan, and outward-facing steps need their approval too. Never say work is done or sent.
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
          work: { type: 'object', properties: { intent: { type: 'string', enum: WORK_INTENTS }, request: { type: 'string' }, title: { type: 'string' }, template_key: { type: 'string' }, due_date: { type: 'string' }, missing: { type: 'array', items: { type: 'string' } } }, required: ['intent'] },
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
    let replyText = out.reply;
    const extra = {};

    // Conversational work intake.
    const w = out.work || { intent: 'none' };
    // A plain "yes / go ahead" to a pending request is always a confirmation.
    if (draftMsg && w.intent !== 'ready' && /^(yes|yep|yeah|sure|ok(ay)?|go ahead|do it|sounds good|confirm(ed)?|please do|let'?s do it)\b/i.test(msg) && msg.length < 80) w.intent = 'confirm';
    const working = WORK_INTENTS.includes(w.intent) && w.intent !== 'none';
    if (w.intent === 'confirm' && draftMsg) {
      const r = await scopeDraft(base44, org, draftMsg);
      replyText = r.text;
      Object.assign(extra, r.payload);
    } else if (w.intent === 'cancel' && draftMsg) {
      await setDraft(db, draftMsg, { status: 'discarded' });
    } else if (w.intent === 'ready' && String(w.request || '').trim()) {
      if (draftMsg) await setDraft(db, draftMsg, { status: 'superseded' });
      const t = tpls.find((x) => x.key === w.template_key);
      replyText = `Here's the work request I put together${t ? ` using our **${t.name}** service` : ''}. Check it over, then press **Scope this work** or just say yes, and I'll build the plan for your approval. Tell me if anything should change.`;
      extra.work_draft = {
        status: 'proposed', request: String(w.request).trim().slice(0, 2000), title: String(w.title || 'Work request').slice(0, 120),
        template_key: t?.key || '', template_name: t?.name || '', due_date: /^\d{4}-\d{2}-\d{2}$/.test(w.due_date || '') ? w.due_date : '',
        missing: (w.missing || []).slice(0, 6).map((x) => String(x).slice(0, 200)),
      };
    }
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
    if ((stage === 'intro' || stage === 'awaiting_match') && name && !working) {
      const cands = await searchCompany(base44, { name, location: upd.location || org.location, website: upd.website || org.website, latest_owner_message: msg });
      await db.entities.Organization.update(org.id, { discovery_stage: cands.length ? 'awaiting_match' : 'intro', match_candidates: cands });
      if (cands.length) {
        replyText = cands.length > 1 ? 'I searched online and found a few companies that could be yours. Which one is right?' : 'I searched online and found a company that looks like yours. Is this the right one?';
        Object.assign(extra, { candidates: cands, match_status: 'pending', live_search: true });
      } else {
        replyText = `I searched online but couldn't find a reliable match for ${name}. What's your website address, or another detail like your city?`;
      }
    }
    return say(replyText, { applied, queued, profile: profileKeys, ...extra });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}