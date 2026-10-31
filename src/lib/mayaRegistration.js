import { base44 } from '@/api/base44Client';
import { inDays, fdate, label } from '@/lib/format';

const E = base44.entities;

// At-risk = open registration/licensing matter that is waiting on the client or due within 14 days
export async function registrationReminders() {
  const matters = (await E.Matter.filter({
    type: { $in: ['registration', 'licensing'] }, status: { $ne: 'completed' },
    $or: [{ status: 'waiting_client' }, { target_date: { $lte: inDays(14) } }],
  }, { sort: 'target_date', limit: 50 })).items;

  const [docs, existing] = await Promise.all([
    E.DocumentRequest.filter({ status: 'outstanding', client_code: { $in: matters.map((m) => m.client_code) } }, { limit: 200 }),
    E.Approval.filter({ kind: 'doc_reminder', status: 'pending', matter_id: { $in: matters.map((m) => m.id) } }, { limit: 50, fields: ['matter_id'] }),
  ]);
  const skip = new Set(existing.items.map((a) => a.matter_id));
  const due = inDays(7);

  const targets = matters.map((m) => ({ m, list: docs.items.filter((x) => x.client_code === m.client_code && x.matter_title === m.title) }))
    .filter((t) => t.list.length && !skip.has(t.m.id));

  const drafts = targets.map(({ m, list }) => {
    const items = list.map((x) => `• ${x.document}`).join('\n');
    const name = list[0].contact_name;
    return {
      kind: 'doc_reminder', title: 'Bilingual document reminder', client_code: m.client_code, client_name: m.client_name,
      matter_id: m.id, matter_title: m.title, agent: 'Nia', language: list[0].language, status: 'pending', related_ids: list.map((x) => x.id),
      subject: `Documents needed / Documentos pendientes — ${m.title}`,
      body: `ENGLISH\nDear ${name},\n\nTo keep your "${m.title}" on track, we still need:\n${items}\n\nPlease send them by ${fdate(due)}. Reply to this email or call (215) 555-0140.\n\n———\n\nESPAÑOL\nEstimado/a ${name}:\n\nPara continuar con su trámite "${m.title}", todavía necesitamos:\n${items}\n\nLe agradeceríamos enviarlos antes del ${fdate(due)}. Puede responder a este correo o llamarnos al (215) 555-0140.\n\nDelaware Valley Business Services`,
      rationale: `${label(m.status)} · internal target ${fdate(m.target_date)} · ${list.length} document(s) outstanding.`,
    };
  });

  if (drafts.length) {
    await Promise.all([
      E.Approval.bulkCreate(drafts),
      E.Task.bulkCreate(targets.map(({ m }) => ({ title: 'Send document reminder once approved', client_code: m.client_code, client_name: m.client_name, matter_title: m.title, agent: 'Nia', staff: 'Sofía Herrera', status: 'in_progress', priority: 'high', due_date: inDays(2), source: 'maya' }))),
      E.Activity.bulkCreate(targets.map(({ m, list }) => ({ agent: 'Nia', action: 'Drafted bilingual document reminder', detail: `${m.title} · ${list.length} item(s) · awaiting approval`, client_name: m.client_name, kind: 'approval' }))),
      E.Activity.create({ agent: 'Sofia AI', action: 'Flagged at-risk registration matters', detail: `${matters.length} at risk · ${targets.length} with missing documents`, client_name: '', kind: 'completed' }),
    ]);
  }

  return {
    text: drafts.length
      ? `Sofia AI flagged **${matters.length} at-risk registration & licensing matters**. **${drafts.length}** of them are blocked on missing documents. Nia drafted a separate **English/Spanish reminder** for each one, logged the work, and opened a follow-up task. All ${drafts.length} drafts are waiting for your approval. Nothing has been sent.`
      : `Sofia AI checked ${matters.length} at-risk registration & licensing matters. None need a new reminder: they either have no missing documents or already have a draft waiting for approval.`,
    steps: [{ agent: 'Sofia AI', label: `Flagged ${matters.length} at-risk matters` }, { agent: 'Nia', label: `Drafted ${drafts.length} bilingual reminders` }, { agent: 'Maya', label: 'Queued approval cards' }],
    table: { columns: ['Client', 'Matter', 'Missing documents', 'Target'], rows: drafts.map((a) => [a.client_name, a.matter_title, String(a.related_ids.length), fdate(matters.find((m) => m.id === a.matter_id).target_date)]) },
    actions: drafts.length ? [`${drafts.length} drafts · ${drafts.length} tasks · ${drafts.length + 1} log entries created`] : [],
    links: [...drafts.slice(0, 4).map((a) => ({ to: `/clients/${a.client_code}`, label: a.client_name })), { to: '/decisions', label: 'Review drafts' }],
  };
}