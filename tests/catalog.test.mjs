import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureTemplates } from '../src/lib/work.js';
import { leadToProposal } from '../base44/shared/skills/leadToProposal.js';

test('existing organization gets the skill without overwriting custom templates; repeated visits do not recreate it', async () => {
  const records = [{ key: 'custom', name: 'My workflow' }];
  const created = [];
  globalThis.testClient = { entities: { WorkTemplate: {
    filter: async q => { assert.equal(q.org_id, 'org-a'); return { items: [...records] }; },
    create: async data => { created.push(data); const rec = { id: 'tpl-a', ...data }; records.push(rec); return rec; },
  } } };
  await ensureTemplates('org-a'); await ensureTemplates('org-a');
  assert.equal(created.length, 1);
  assert.equal(created[0].org_id, 'org-a');
  assert.deepEqual(created[0].steps, leadToProposal.steps);
  assert.deepEqual(records[0], { key: 'custom', name: 'My workflow' });
});
