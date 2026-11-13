import test from 'node:test';
import assert from 'node:assert/strict';
import scopeWork from '../base44/functions/scopeWork/entry.ts';
import workAction from '../base44/functions/workAction/entry.ts';
import { leadToProposal, validSkillPlan, skillInstructions } from '../base44/shared/skills/leadToProposal.js';

function setup() {
  let record;
  const calls = [], writes = [], deliveries = [];
  const org = { id: 'org-a' };
  const entity = { filter: async () => ({ items: [] }) };
  const entities = new Proxy({
    Organization: { filter: async () => ({ items: [org] }) },
    WorkOrder: {
      create: async data => (record = { id: 'order-a', ...structuredClone(data) }),
      get: async () => structuredClone(record),
      update: async (id, data) => { writes.push({ id, data }); record = { id, ...structuredClone(data) }; },
    },
    Deliverable: {
      create: async data => { deliveries.push(data); },
      filter: async query => { assert.equal(query.org_id, 'org-a'); return { items: [] }; },
    },
  }, { get: (target, key) => target[key] || entity });
  const responses = [];
  globalThis.testClient = {
    auth: { me: async () => ({ id: 'user-a' }) }, entities,
    asServiceRole: { integrations: { Core: { InvokeLLM: async args => {
      calls.push(args);
      return responses.shift() || { output: 'Evidence-backed draft', checks: leadToProposal.acceptance_criteria.map(text => ({ text, met: true, evidence: 'approved work' })) };
    } } } },
  };
  return { calls, writes, deliveries, responses, get record() { return record; }, set record(r) { record = r; } };
}
const request = body => new Request('http://local.test', { method: 'POST', body: JSON.stringify(body) });
async function scope() { return scopeWork(request({ request: 'Qualify Acme and draft a proposal', template_key: 'lead_to_proposal' })); }
const act = body => workAction(request({ id: 'order-a', ...body }));

test('canonical skill scopes without AI or a seeded template, preserving org and initial approval', async () => {
  const f = setup();
  assert.equal((await scope()).status, 200);
  assert.equal(f.calls.length, 0);
  assert.equal(f.record.org_id, 'org-a');
  assert.equal(f.record.status, 'scoped');
  assert.equal(f.record.actual_cost, 0);
  assert.ok(validSkillPlan(f.record));
  assert.ok(f.record.steps.every(s => s.needs_approval && s.status === 'pending'));
});

test('full workflow pauses at every review and requires approved manual communication delivery', async () => {
  const f = setup(); await scope();
  await act({ action: 'approve_scope' });
  assert.equal(f.calls.length, 1);
  assert.equal(f.record.status, 'awaiting_approval');
  await act({ action: 'run' });
  assert.equal(f.calls.length, 1);
  await act({ action: 'approve_step', index: 0, output: 'Qualified by owner' });
  assert.equal(f.calls.length, 2);
  assert.match(f.calls[1].prompt, /Qualified by owner/);
  await act({ action: 'approve_step', index: 1, output: 'Approved proposal USD 100' });
  assert.match(f.calls[2].prompt, /Approved proposal USD 100/);
  assert.equal(f.record.steps[2].status, 'awaiting_approval');
  assert.equal((await act({ action: 'manual_complete', index: 2, note: 'Delivered' })).status, 400);
  await act({ action: 'approve_step', index: 2 });
  assert.equal(f.record.status, 'blocked');
  assert.equal((await act({ action: 'manual_complete', index: 2 })).status, 400);
  await act({ action: 'manual_complete', index: 2, note: 'Owner emailed jane@acme.test; message ref 123' });
  assert.equal(f.record.status, 'delivered');
  assert.equal(f.deliveries.length, 1);
  assert.equal(f.deliveries[0].org_id, 'org-a');
  assert.ok(f.deliveries[0].evidence.every(e => e.approved));
});

test('missing information pauses drafting; owner information resumes only that step', async () => {
  const f = setup(); await scope();
  f.responses.push({ output: '', missing_info: 'Supply ideal client criteria' });
  await act({ action: 'approve_scope' });
  assert.equal(f.record.status, 'needs_input');
  assert.equal(f.calls.length, 1);
  await act({ action: 'provide_info', note: 'Ideal clients need monthly bookkeeping' });
  assert.equal(f.record.status, 'awaiting_approval');
  assert.match(f.calls[1].prompt, /monthly bookkeeping/);
  assert.equal(f.record.steps[1].status, 'pending');
});

test('rejection redrafts with feedback and never approves or advances the rejected step', async () => {
  const f = setup(); await scope(); await act({ action: 'approve_scope' });
  await act({ action: 'reject_step', index: 0, note: 'Show source evidence' });
  assert.match(f.calls[1].prompt, /Show source evidence/);
  assert.equal(f.record.steps[0].approved, false);
  assert.equal(f.record.steps[1].status, 'pending');
});

test('rework invalidates downstream communication and approvals', async () => {
  const f = setup(); await scope();
  f.record.status = 'delivered';
  f.record.steps.forEach(s => Object.assign(s, { status: 'done', approved: true, output: 'stale', mode: 'manual' }));
  await act({ action: 'rework', note: 'Change proposal scope' });
  assert.equal(f.record.status, 'awaiting_approval');
  assert.equal(f.record.steps[1].output, '');
  assert.equal(f.record.steps[2].status, 'pending');
  assert.equal(f.record.steps[2].approved, false);
  assert.equal(f.record.steps[2].output, '');
});

test('cross-organization work order cannot be read through actions or mutated', async () => {
  const f = setup(); await scope(); f.record.org_id = 'org-b';
  assert.equal((await act({ action: 'approve_scope' })).status, 404);
  assert.equal(f.calls.length, 0); assert.equal(f.writes.length, 0);
});

test('unauthenticated endpoints do no work', async () => {
  const f = setup(); globalThis.testClient.auth.me = async () => { throw { status: 401 }; };
  assert.equal((await scope()).status, 401);
  assert.equal((await act({ action: 'run' })).status, 401);
  assert.equal(f.calls.length, 0);
});

test('tampered gates, out of sequence actions and cancelled orders fail closed', async () => {
  const f = setup(); await scope();
  f.record.steps[0].needs_approval = false;
  assert.equal((await act({ action: 'approve_scope' })).status, 400);
  f.record.steps[0].needs_approval = true;
  await act({ action: 'approve_scope' });
  assert.equal((await act({ action: 'approve_step', index: 2 })).status, 400);
  await act({ action: 'cancel' });
  assert.equal((await act({ action: 'approve_step', index: 0 })).status, 400);
  assert.equal((await act({ action: 'provide_info', note: 'resume' })).status, 400);
  assert.equal(f.calls.length, 1);
});

test('skill prompts require qualification evidence, verified terms and permission', () => {
  const order = { template_key: leadToProposal.key, steps: structuredClone(leadToProposal.steps) };
  assert.match(skillInstructions(order, order.steps[0]), /disqualified lead must set missing_info/);
  assert.match(skillInstructions(order, order.steps[1]), /Missing or unverified commercial terms must set missing_info/);
  assert.match(skillInstructions(order, order.steps[2]), /permission to contact/);
  assert.equal(skillInstructions({ template_key: 'other' }, {}), '');
});

test('model-selected lead skill also receives canonical gates', async () => {
  const f = setup();
  f.responses.push({ title: 'Unsafe shortcut', template_key: leadToProposal.key, steps: [{ title: 'Send now', tool: 'ai', needs_approval: false }] });
  const response = await scopeWork(request({ request: 'Prepare a proposal for Acme' }));
  assert.equal(response.status, 200);
  assert.ok(validSkillPlan(f.record));
  assert.equal(f.record.template_key, leadToProposal.key);
});

test('empty skill output cannot become an approvable draft', async () => {
  const f = setup(); await scope(); f.responses.push({ output: '' });
  await act({ action: 'approve_scope' });
  assert.equal(f.record.status, 'needs_input');
  assert.equal(f.record.steps[0].approved, undefined);
});

test('failed quality check stays in Review without a deliverable', async () => {
  const f = setup(); await scope();
  f.record.status = 'blocked';
  f.record.steps.forEach(s => Object.assign(s, { status: 'done', approved: true, output: 'draft' }));
  f.record.steps[2].status = 'needs_connection';
  f.responses.push({ checks: leadToProposal.acceptance_criteria.map(text => ({ text, met: false, evidence: 'Missing evidence' })) });
  await act({ action: 'manual_complete', index: 2, note: 'Email to jane@acme.test, ref 123' });
  assert.equal(f.record.status, 'quality_review');
  assert.equal(f.deliveries.length, 0);
});

test('a connected integration still requires manual delivery after approval', async () => {
  const f = setup(); await scope();
  globalThis.testClient.entities.Integration = { filter: async q => { assert.equal(q.org_id, 'org-a'); return { items: [{ provider: 'google_workspace', status: 'connected', mode: 'live' }] }; } };
  await act({ action: 'approve_scope' });
  await act({ action: 'approve_step', index: 0 });
  await act({ action: 'approve_step', index: 1 });
  await act({ action: 'approve_step', index: 2 });
  assert.equal(f.record.steps[2].mode, 'connected');
  assert.equal(f.record.steps[2].status, 'needs_connection');
  assert.equal(f.record.status, 'blocked');
});

test('AI Manager hands lead work to the existing Work Engine without parallel delegations', async () => {
  const { default: managerTurn } = await import('../base44/functions/managerTurn/entry.ts');
  const f = setup(), messages = [];
  globalThis.testClient.entities.Organization = {
    filter: async () => ({ items: [{ id: 'org-a', discovery_stage: 'learning' }] }),
    update: async () => {},
  };
  globalThis.testClient.entities.Conversation = { get: async () => ({ org_id: 'org-a' }), update: async () => {} };
  globalThis.testClient.entities.Message = {
    filter: async () => ({ items: [] }),
    create: async m => { messages.push(m); return m; },
  };
  globalThis.testClient.entities.AgentAction = { create: async () => assert.fail('Must not create a second delegation') };
  f.responses.push({ reply: 'Scope a lead to proposal Work Order for approval.', work_skill: 'lead_to_proposal', delegations: [{ agent: 'Sales', action: 'Draft proposal', requires_approval: false }] });
  const response = await managerTurn(request({ conversation_id: 'conversation-a', text: 'Qualify Acme and draft a proposal' }));
  assert.equal(response.status, 200);
  assert.equal(messages.at(-1).payload.work_skill, 'lead_to_proposal');
  assert.equal(messages.at(-1).org_id, 'org-a');
  assert.equal(f.record, undefined);
  assert.deepEqual(messages.at(-1).payload.delegations, []);
});
