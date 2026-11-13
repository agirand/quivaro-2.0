import { isLeadToProposal, skillInstructions, validSkillPlan, resetSkillForRework } from '../../shared/skills/leadToProposal.js';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { getOrg } from '../../shared/workspace.ts';
import { INTERNAL, AI_COST, isLive, addHistory, progressOf, businessContext } from '../../shared/work.ts';

const TOOL_NAMES = { google_workspace: 'Google Workspace', microsoft_365: 'Microsoft 365', quickbooks: 'QuickBooks', hubspot: 'HubSpot', dropbox: 'Dropbox' };
const RUNNABLE = ['executing', 'needs_input', 'awaiting_approval', 'blocked', 'quality_review'];

// Derive order status from the first unfinished step (no AI calls).
function settle(o) {
  for (const s of o.steps) {
    if (s.status === 'done') continue;
    if (s.status === 'awaiting_approval') return Object.assign(o, { status: 'awaiting_approval', needs_from_customer: `Approve the draft for "${s.title}".` });
    if (s.status === 'needs_connection') return Object.assign(o, { status: 'blocked', needs_from_customer: `"${s.title}" happens in ${TOOL_NAMES[s.tool] || s.tool}, which isn't connected for live work. Connect it, or mark the step as completed by your team.` });
    if (s.status === 'needs_input') return Object.assign(o, { status: 'needs_input', needs_from_customer: s.missing || 'More information is needed.' });
    return Object.assign(o, { status: 'executing', needs_from_customer: '' });
  }
  return o;
}

async function stepLLM(base44, ctx, o, s) {
  const prev = o.steps.filter((x) => x.status === 'done' && x.output).map((x) => `## ${x.title}\n${x.output.slice(0, 1500)}`).join('\n\n');
  return base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are the ${s.agent} agent in the Quivaro Work Engine, completing one step of a Work Order for a small business.
${ctx}
Work Order: ${o.title}
Requested outcome: ${o.request}
Scope: ${o.scope}
Exclusions: ${o.exclusions}
Information provided by the owner: ${JSON.stringify(o.provided_info || [])}
Completed steps so far:
${prev || 'none'}

${skillInstructions(o, s)}

Current step: "${s.title}" (tool: ${s.tool}).${s.feedback ? `\nReviewer feedback to address: ${s.feedback}` : ''}

Produce the actual work product for this step in concise markdown (checklists, tables, drafts). Never invent client names, amounts, dates or facts that are not in the context or provided information. If the step genuinely cannot be completed without information you do not have, set missing_info to exactly what is needed and leave output short. If the step happens in an external system, prepare the exact content or action to perform there; it will not be sent until approved and executed.`,
    response_json_schema: { type: 'object', properties: { output: { type: 'string' }, missing_info: { type: 'string' } }, required: ['output'] },
  });
}

async function runEngine(base44, org, o) {
  const ctx = await businessContext(base44, org);
  let calls = 0;
  for (const s of o.steps) {
    if (s.status !== 'pending') { if (s.status === 'done') continue; return settle(o); }
    if (calls >= 3) return settle(o);
    const r = await stepLLM(base44, ctx, o, s);
    calls++;
    o.actual_cost = +((o.actual_cost || 0) + AI_COST).toFixed(2);
    if (isLeadToProposal(o) && !String(r.output || '').trim() && !r.missing_info) r.missing_info = 'No work product was generated. Add the missing lead or proposal details and retry.';
    if (r.missing_info) {
      Object.assign(s, { status: 'needs_input', missing: String(r.missing_info).slice(0, 500), output: r.output || '' });
      o.history = addHistory(o, 'Needs information', `${s.title}: ${s.missing}`);
      return settle(o);
    }
    s.output = String(r.output || '').slice(0, 8000);
    s.status = s.needs_approval ? 'awaiting_approval' : 'done';
    o.history = addHistory(o, s.needs_approval ? 'Draft ready for approval' : 'Step completed', `${s.agent}: ${s.title}`);
    if (s.needs_approval) return settle(o);
  }
  await verify(base44, o);
  return o;
}

// Completion requires every acceptance criterion to be met by evidence in the step outputs.
async function verify(base44, o) {
  const work = o.steps.map((s) => `## ${s.title} [${s.mode === 'manual' ? 'completed by owner team' : s.tool}]\n${(s.output || '').slice(0, 2000)}`).join('\n\n');
  const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are Quivaro's quality reviewer. Strictly check each acceptance criterion against the completed work below. A criterion is met only if the work clearly demonstrates it. Quote or cite the specific evidence.\n\nCriteria: ${JSON.stringify(o.acceptance_criteria.map((c) => c.text))}\n\nCompleted work:\n${work}\n\nAlso write a 2-3 sentence summary of the delivered outcome.`,
    response_json_schema: { type: 'object', properties: { summary: { type: 'string' }, checks: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' }, met: { type: 'boolean' }, evidence: { type: 'string' } }, required: ['text', 'met'] } } }, required: ['checks'] },
  });
  o.actual_cost = +((o.actual_cost || 0) + AI_COST).toFixed(2);
  o.acceptance_criteria = o.acceptance_criteria.map((c, i) => ({ text: c.text, met: !!r.checks?.[i]?.met, evidence: r.checks?.[i]?.evidence || '' }));
  const unmet = o.acceptance_criteria.filter((c) => !c.met);
  if (unmet.length) {
    Object.assign(o, { status: 'quality_review', needs_from_customer: `Quality check found ${unmet.length} unmet criteria. Send it back for rework or add the missing information.` });
    o.history = addHistory(o, 'Quality check failed', unmet.map((c) => c.text).join('; '));
    return;
  }
  await base44.entities.Deliverable.create({
    org_id: o.org_id, work_order_id: o.id, title: o.title, summary: r.summary || '', status: 'ready',
    content: o.steps.filter((s) => s.output).map((s) => `## ${s.title}\n\n${s.output}`).join('\n\n'),
    evidence: o.steps.map((s) => ({ step: s.title, agent: s.agent, tool: s.tool, mode: s.mode, approved: !!s.approved })),
    quality_checks: o.acceptance_criteria,
  });
  Object.assign(o, { status: 'delivered', needs_from_customer: 'Review the deliverable and accept it, or request a revision.' });
  o.history = addHistory(o, 'Verified and delivered', 'All acceptance criteria met');
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { id, action, index, note, output, amount } = await req.json().catch(() => ({}));
    const org = await getOrg(base44, user.id);
    const rec = id && await base44.entities.WorkOrder.get(id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!org || !rec || rec.org_id !== org.id) return Response.json({ error: 'Not found' }, { status: 404 });
    const o = { ...rec, steps: (rec.steps || []).map((s) => ({ ...s })) };
    if (!validSkillPlan(o)) return Response.json({ error: 'Invalid skill plan; create a new Work Order' }, { status: 400 });
    const s = Number.isInteger(index) ? o.steps[index] : null;
    const bad = (m) => Response.json({ error: m }, { status: 400 });
    const live = !o.is_demo;
    if (isLeadToProposal(o)) {
      if (o.is_demo) return bad('Lead to proposal requires a real Work Order');
      if (['approve_step', 'reject_step', 'manual_complete'].includes(action) && (!RUNNABLE.includes(o.status) || o.steps.find((x) => x.status !== 'done') !== s)) return bad('Only the current active step can be changed');
      if (action === 'manual_complete' && (!s?.approved || !String(note || '').trim())) return bad('Approve the communication first and record recipient, channel and delivery evidence');
      if (action === 'provide_info' && !['executing', 'needs_input'].includes(o.status)) return bad('Information can only be added before drafting or when requested');
    }
    let run = false;

    if (action === 'approve_scope') {
      if (o.status !== 'scoped') return bad('Already approved');
      o.status = 'executing'; o.history = addHistory(o, 'Scope approved', 'Execution started'); run = live;
    } else if (action === 'run') {
      if (!RUNNABLE.includes(o.status) || !live) return bad('Nothing to run');
      run = true;
    } else if (action === 'approve_step') {
      if (!s || s.status !== 'awaiting_approval') return bad('Step is not awaiting approval');
      if (typeof output === 'string' && output.trim()) s.output = output.slice(0, 8000);
      const ints = (await base44.entities.Integration.filter({ org_id: org.id }, { limit: 50 })).items;
      s.approved = true;
      s.status = INTERNAL.includes(s.tool) ? 'done' : 'needs_connection';
      s.mode = isLive(s.tool, ints) ? 'connected' : 'not_connected';
      o.review_minutes = (o.review_minutes || 0) + 3;
      o.history = addHistory(o, 'Approved by owner', s.title); run = live;
    } else if (action === 'reject_step') {
      if (!s || s.status !== 'awaiting_approval') return bad('Step is not awaiting approval');
      Object.assign(s, { status: 'pending', output: '', approved: false, feedback: String(note || 'Please redo').slice(0, 500) });
      o.review_minutes = (o.review_minutes || 0) + 2; o.rework_cost = +((o.rework_cost || 0) + AI_COST).toFixed(2);
      o.history = addHistory(o, 'Sent back by owner', `${s.title}: ${s.feedback}`); run = live;
    } else if (action === 'manual_complete') {
      if (!s || s.status !== 'needs_connection') return bad('Step cannot be completed manually');
      Object.assign(s, { status: 'done', mode: 'manual', output: `${s.output || ''}\n\n**Completed by your team:** ${String(note || 'Done').slice(0, 500)}` });
      o.history = addHistory(o, 'Completed by owner team', s.title); run = live;
    } else if (action === 'provide_info') {
      const t = String(note || '').trim().slice(0, 2000);
      if (!t) return bad('Add the information');
      o.provided_info = [...(o.provided_info || []), t];
      o.steps.forEach((x) => { if (x.status === 'needs_input') x.status = 'pending'; });
      o.history = addHistory(o, 'Information provided', t); run = live;
    } else if (action === 'rework') {
      if (!['quality_review', 'delivered', 'accepted'].includes(o.status) || !live) return bad('Cannot rework');
      const fb = String(note || 'Address unmet acceptance criteria').slice(0, 500);
      let n = 0;
      o.steps.forEach((x) => { if (x.mode !== 'manual' && INTERNAL.includes(x.tool)) { Object.assign(x, { status: 'pending', feedback: fb, approved: false }); n++; } });
      if (isLeadToProposal(o)) resetSkillForRework(o, fb);
      o.acceptance_criteria = o.acceptance_criteria.map((c) => ({ text: c.text, met: null, evidence: '' }));
      o.rework_cost = +((o.rework_cost || 0) + n * AI_COST).toFixed(2);
      const del = (await base44.entities.Deliverable.filter({ org_id: org.id, work_order_id: o.id, status: { $ne: 'revision_requested' } }, { limit: 5 })).items;
      for (const d of del) await base44.entities.Deliverable.update(d.id, { status: 'revision_requested' });
      o.history = addHistory(o, o.status === 'accepted' ? 'Reopened' : 'Revision requested', fb);
      o.status = 'executing'; run = true;
    } else if (action === 'accept') {
      if (o.status !== 'delivered') return bad('Nothing to accept');
      const del = (await base44.entities.Deliverable.filter({ org_id: org.id, work_order_id: o.id, status: 'ready' }, { limit: 5 })).items;
      for (const d of del) await base44.entities.Deliverable.update(d.id, { status: 'accepted', accepted_at: new Date().toISOString() });
      Object.assign(o, { status: 'accepted', needs_from_customer: '' }); o.history = addHistory(o, 'Accepted by owner');
    } else if (action === 'cancel') {
      if (['accepted', 'closed', 'cancelled'].includes(o.status)) return bad('Cannot cancel');
      Object.assign(o, { status: 'cancelled', needs_from_customer: '' }); o.history = addHistory(o, 'Cancelled by owner', note || '');
    } else if (action === 'bonus') {
      const a = Number(amount);
      if (!['delivered', 'accepted'].includes(o.status) || !(a >= 0 && a <= 500)) return bad('Invalid bonus');
      Object.assign(o, { bonus_amount: a, bonus_status: a > 0 ? 'pledged' : 'declined' });
      o.history = addHistory(o, a > 0 ? 'Bonus pledged' : 'Bonus declined', a > 0 ? `$${a} pledged by owner. No payment was collected; billing is not active yet.` : '');
    } else return bad('Unknown action');

    if (o.is_demo && ['approve_step', 'reject_step', 'manual_complete', 'provide_info'].includes(action)) {
      // Demo orders never call AI or external tools: remaining internal steps are simulated and labeled as such.
      settle(o);
      if (o.status === 'executing') {
        o.steps.forEach((x) => { if (x.status === 'pending') Object.assign(x, { status: 'done', output: 'Demo only: simulated completion. 12 synthetic files summarized for review.' }); });
        o.acceptance_criteria = o.acceptance_criteria.map((c) => ({ ...c, met: true, evidence: c.evidence || 'Demo: simulated' }));
        Object.assign(o, { status: 'delivered', needs_from_customer: 'Review the deliverable and accept it, or request a revision.' });
        o.history = addHistory(o, 'Verified and delivered', 'Demo only: simulated');
        const del = (await base44.entities.Deliverable.filter({ work_order_id: o.id }, { limit: 1 })).items[0];
        if (del) await base44.entities.Deliverable.update(del.id, { title: 'DEMO · Review-ready client files', summary: '12 synthetic client files onboarded; 3 follow-ups approved. Demo only, nothing was sent.', quality_checks: o.acceptance_criteria, status: 'ready' });
      }
    } else if (run) await runEngine(base44, org, o); else if (!['scoped', 'delivered', 'accepted', 'cancelled', 'closed', 'quality_review'].includes(o.status)) settle(o);
    o.progress = progressOf(o.steps);
    const { id: _i, created_date, updated_date, created_by_id, created_by, ...data } = o;
    await base44.entities.WorkOrder.update(rec.id, data);
    return Response.json({ ok: true, status: o.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}