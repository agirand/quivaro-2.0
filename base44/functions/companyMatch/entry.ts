import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getOrg, applyProposal } from '../../shared/workspace.ts';
import { crawlSite, extractSite } from '../../shared/companyResearch.ts';
import { setFact, stageDiscovered, queueProfileReview, normKey, norm } from '../../shared/facts.ts';

const list = (a) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const CONTACT = { addresses: 'address', phones: 'public_phone', emails: 'public_email' };

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { message_id, index, decision } = await req.json();
    const org = await getOrg(base44, user.id);
    const msg = message_id && await base44.entities.Message.get(message_id).catch(() => null);
    if (!org || !msg || msg.org_id !== org.id || msg.payload?.match_status !== 'pending') return Response.json({ error: 'Not found' }, { status: 404 });
    const E = base44.entities;
    const post = async (text, payload = {}) => {
      await E.Message.create({ org_id: org.id, conversation_id: msg.conversation_id, channel: 'web', direction: 'outbound', sender: 'manager', text, delivery_status: 'delivered_in_app', payload });
      await E.Conversation.update(msg.conversation_id, { last_message: text.slice(0, 140), last_message_at: new Date().toISOString() });
    };

    if (decision !== 'yes') {
      await E.Message.update(msg.id, { payload: { ...msg.payload, match_status: 'rejected' } });
      await E.Organization.update(org.id, { discovery_stage: 'intro', match_candidates: [] });
      await post("No problem, thanks for telling me. I won't use anything from that listing. What's your website address? Or share your city or street and I'll look again.");
      return Response.json({ ok: true });
    }

    const cand = msg.payload.candidates?.[index];
    if (!cand) return Response.json({ error: 'Invalid choice' }, { status: 400 });
    await E.Message.update(msg.id, { payload: { ...msg.payload, match_status: 'confirmed', chosen: index } });

    const crawl = await crawlSite(cand.website);
    const info = crawl.pages.length ? await extractSite(base44, crawl.pages) : null;
    const retrieved = new Date().toISOString();
    const facts = { ...(org.profile_facts || {}) };
    const upd = { profile_source_url: cand.website, profile_retrieved_at: retrieved, profile_verification: 'match_confirmed', match_candidates: [], crawl_report: { at: retrieved, pages: crawl.log } };
    // The owner picked this listing, so the website itself is confirmed.
    if (facts.website?.status !== 'confirmed') { upd.website = cand.website; setFact(facts, 'website', cand.website, 'confirmed', { source: 'match_confirmed', source_url: cand.website, excerpt: cand.name }); }
    if (!org.name) { upd.name = cand.name; setFact(facts, 'name', cand.name, 'discovered', { source: 'search_result', source_url: cand.website, excerpt: cand.name }); }
    const view = { ...org, ...upd };
    const conflicts = [];

    for (const k of ['description', 'industry']) {
      const opt = info?.[k];
      if (!opt) continue;
      const r = stageDiscovered(view, facts, k, opt);
      if (r === 'set') upd[k] = opt.value;
      if (r === 'conflict') { conflicts.push(k); await queueProfileReview(base44, org, k, [{ value: view[k], source: facts[k]?.source || 'existing', source_url: facts[k]?.source_url || '', excerpt: facts[k]?.excerpt || '' }, opt], 'Your website says something different from what is already in your profile.'); }
    }

    // Contact details: a search-result address counts as a separate, attributed source.
    const opts = { addresses: [...(info?.addresses || [])], phones: info?.phones || [], emails: info?.emails || [] };
    if (cand.location && /\d/.test(cand.location) && !opts.addresses.some((a) => norm(a.value).split(' ').slice(0, 3).join(' ') === norm(cand.location).split(' ').slice(0, 3).join(' '))) {
      opts.addresses.push({ value: cand.location, source: 'search_result', source_url: cand.website, excerpt: cand.location, label: 'Search result' });
    }
    const contactNotes = [];
    for (const [kind, field] of Object.entries(CONTACT)) {
      const list2 = opts[kind];
      if (!list2.length) continue; // nothing found: field stays empty
      const confirmedVal = facts[field]?.status === 'confirmed' ? facts[field].value : '';
      if (confirmedVal && list2.some((o) => norm(o.value) === norm(confirmedVal))) continue;
      if (list2.length === 1 && !confirmedVal) {
        const r = stageDiscovered(view, facts, field, list2[0]);
        if (r === 'set') { upd[field] = list2[0].value; contactNotes.push(field); continue; }
        if (r !== 'conflict') continue;
      }
      const current = view[field] ? [{ value: view[field], source: facts[field]?.source || 'existing', source_url: facts[field]?.source_url || '', excerpt: facts[field]?.excerpt || '' }] : [];
      conflicts.push(field);
      await queueProfileReview(base44, org, field, [...current, ...list2], list2.length > 1 ? 'Several different values were found. Which one is current?' : 'This differs from what is already in your profile.');
    }
    upd.profile_facts = facts;
    upd.discovery_stage = info?.services.length ? 'services_confirm' : 'learning';
    await E.Organization.update(org.id, upd);
    const okPages = crawl.log.filter((p) => p.ok).length;
    const failed = crawl.log.filter((p) => !p.ok);
    await E.WorkspaceEvent.create({ org_id: org.id, action: 'profile', entity_type: 'profile', record_name: `Website research: ${okPages} pages read`, source: 'public_web', detail: `${cand.website}${failed.length ? ` · ${failed.length} could not be inspected` : ''}` });

    const applied = [];
    const rejected = new Set((org.rejected_services || []).map(normKey));
    for (const s of (info?.services || []).filter((x) => !rejected.has(normKey(x.name))).slice(0, 15)) {
      const r = await applyProposal(base44, org.id, { entity_type: 'offering', name: s.name, fields: { description: s.description }, confidence: 0.9, excerpt: s.excerpt }, { source: 'public_web', source_ref: s.source_url, source_title: s.source_url });
      if (r && r.action !== 'unchanged') applied.push(r);
    }

    const names = (info?.services || []).filter((x) => !rejected.has(normKey(x.name))).map((s) => s.name).slice(0, 8);
    const pagesLine = okPages ? `I read ${okPages} page${okPages > 1 ? 's' : ''} of your website${failed.length ? ` (${failed.length} couldn't be opened)` : ''}.` : `I tried to open your website, but it couldn't be read (${failed[0]?.error || 'no response'}).`;
    const parts = [`Thanks for confirming! ${pagesLine}`];
    if (info?.description) parts.push(`From what I can see, you describe the business this way: “${info.description.value}”`);
    if (names.length) parts.push(`Your website lists **${list(names)}**. I've noted these as advertised on the site; I haven't checked whether each is still current.`);
    if (contactNotes.length || conflicts.some((c) => CONTACT[c] || Object.values(CONTACT).includes(c))) parts.push(`I also found contact details, which are waiting for your confirmation in your Company Profile${conflicts.length ? ' and Review queue' : ''}.`);
    parts.push(names.length ? 'Does that sound right?' : okPages ? "I couldn't find a clear list of services there. What are the main services you offer?" : 'What are the main services you offer?');
    await post(parts.join('\n\n'), { applied, source_url: cand.website, retrieved_at: retrieved, fetched: okPages > 0, pages: crawl.log, conflicts });
    return Response.json({ ok: true, pages: crawl.log, services: names, conflicts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}