import { base44 } from '@/api/base44Client';
import { today } from '@/lib/format';

const E = base44.entities;

export async function decide(a, decision, edits) {
  await E.Approval.update(a.id, { status: decision, decided_at: new Date().toISOString(), ...(edits || {}) });
  const ids = a.related_ids || [];
  if (decision === 'approved') {
    if (a.kind === 'invoice_reminder') await E.Invoice.bulkUpdate(ids.map((id) => ({ id, reminder_status: 'approved' })));
    if (a.kind === 'doc_reminder') await E.DocumentRequest.bulkUpdate(ids.map((id) => ({ id, last_reminder: today() })));
    if (a.kind === 'new_matter' && ids[0]) await E.Matter.update(ids[0], { status: 'in_progress', progress: 15 });
    if (a.kind === 'strategy') await E.Task.bulkUpdate(ids.map((id) => ({ id, status: 'in_progress' })));
  } else if (a.kind === 'invoice_reminder') {
    await E.Invoice.bulkUpdate(ids.map((id) => ({ id, reminder_status: 'none' })));
  }
  const sent = ['doc_reminder', 'invoice_reminder', 'client_email', 'new_matter'].includes(a.kind);
  await E.Activity.create({
    agent: a.agent,
    action: decision === 'approved' ? (sent ? `${a.title} approved, simulated delivery logged` : `${a.title} approved`) : `${a.title} rejected`,
    detail: [a.matter_title, edits ? 'Edited by owner' : 'Owner decision recorded', sent && decision === 'approved' ? 'Demo only, nothing sent externally' : ''].filter(Boolean).join(' · '),
    client_name: a.client_name, kind: decision === 'approved' ? 'completed' : 'rejected',
  });
}