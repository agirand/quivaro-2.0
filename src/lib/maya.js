import { base44 } from '@/api/base44Client';
import { today, inDays, money, fdate, daysFrom, label } from '@/lib/format';
import { registrationReminders } from '@/lib/mayaRegistration';

const E = base44.entities;
const log = (agent, action, detail, client_name = '', kind = 'completed') => E.Activity.create({ agent, action, detail, client_name, kind });

export const SUGGESTIONS = [
  'Give me a briefing on the business today.',
  'Show me all clients with outstanding compliance work.',
  'Which clients are missing documents?',
  'Prepare Spanish-language reminders for clients with incomplete filings.',
  'Draft missing-document reminders for clients with at-risk registration matters.',
  'Review our overdue invoices.',
  'Create a new client matter for a Pennsylvania business registration.',
  'How can we increase revenue by 15%?',
];

export async function runCommand(raw) {
  const t = raw.toLowerCase();
  if (t.includes('reminder') && (t.includes('registration') || t.includes('at-risk') || t.includes('at risk'))) return registrationReminders();
  if (t.includes('spanish') || t.includes('español')) return spanishReminders();
  if (t.includes('matter') && (t.includes('new') || t.includes('create'))) return newMatter();
  if (t.includes('revenue') || t.includes('15%') || t.includes('grow')) return revenuePlan();
  if (t.includes('invoice') || t.includes('overdue') || t.includes('receivable')) return overdueInvoices();
  if (t.includes('missing') || t.includes('document')) return missingDocs();
  if (t.includes('compliance')) return compliance();
  if (t.includes('briefing') || t.includes('today') || t.includes('summary')) return briefing();
  return {
    text: "I can't act on that one yet in this demo. I can run briefings, review compliance work, chase missing documents, draft Spanish reminders, review overdue invoices, open new registration matters, and build a growth plan. Pick one of the suggestions below.",
    steps: [],
  };
}

async function briefing() {
  const t = today();
  const [clients, open, late, docs, pending, ar, due] = await Promise.all([
    E.Client.count({ status: 'active' }), E.Matter.count({ status: { $ne: 'completed' } }),
    E.Matter.count({ status: { $ne: 'completed' }, target_date: { $lt: t } }),
    E.DocumentRequest.count({ status: 'outstanding' }), E.Approval.count({ status: 'pending' }),
    E.Invoice.aggregate({ groupBy: 'status', sum: ['amount'] }),
    E.Matter.filter({ status: { $ne: 'completed' }, target_date: { $gte: t, $lte: inDays(7) } }, { sort: 'target_date', limit: 10 }),
  ]);
  const r = (s) => ar.rows.find((x) => x.status === s) || { count: 0, sum_amount: 0 };
  await log('Maya', 'Compiled daily briefing', `${open} open matters · ${r('overdue').count} overdue invoices`);
  return {
    text: `**Here's where the business stands today.**\n\n- **${clients} active clients** with **${open} open matters**, ${late} past their internal target date.\n- **Receivables:** ${money(r('open').sum_amount + r('overdue').sum_amount)} outstanding, of which **${money(r('overdue').sum_amount)}** is overdue across ${r('overdue').count} invoices.\n- **${docs} document requests** are still waiting on clients.\n- **${pending} decisions** are waiting for you in the Decision Center.\n\nThese ${due.items.length} matters reach their internal target in the next 7 days:`,
    steps: [{ agent: 'Ledger', label: 'Pulled accounts receivable' }, { agent: 'Sofia AI', label: 'Checked the compliance calendar' }, { agent: 'Nia', label: 'Reviewed open document requests' }, { agent: 'Maya', label: 'Consolidated the briefing' }],
    table: { columns: ['Client', 'Matter', 'Agent', 'Target'], rows: due.items.map((m) => [m.client_name, m.title, m.agent, fdate(m.target_date)]) },
    actions: ['Briefing logged to activity history'],
    links: [{ to: '/decisions', label: 'Open Decision Center' }, { to: '/workboard', label: 'View Workboard' }],
  };
}

async function compliance() {
  const q = { compliance: true, status: { $ne: 'completed' } };
  const [n, page] = await Promise.all([E.Matter.count(q), E.Matter.filter(q, { sort: 'target_date', limit: 50 })]);
  const late = page.items.filter((m) => m.target_date < today()).length;
  await E.Task.create({ title: `Review compliance pipeline (${n} matters)`, client_name: 'Multiple clients', agent: 'Sofia AI', staff: 'Rosa Delgado', status: 'todo', priority: 'high', due_date: inDays(2), source: 'maya' });
  await log('Sofia AI', 'Assigned compliance pipeline review', `${n} open compliance matters, ${late} past target`, '', 'assigned');
  return {
    text: `Sofia AI found **${n} open compliance matters** (registrations, licensing, annual reports and sales tax), **${late}** of them past their internal target. I've assigned her a pipeline review due ${fdate(inDays(2))}.\n\n_Dates are internal demo targets, not verified statutory deadlines._`,
    steps: [{ agent: 'Sofia AI', label: 'Scanned the compliance calendar' }, { agent: 'Maya', label: 'Created a review task for Sofia AI' }],
    table: { columns: ['Client', 'Matter', 'Status', 'Target'], rows: page.items.map((m) => [m.client_name, m.title, label(m.status), fdate(m.target_date)]) },
    actions: ['Task created: compliance pipeline review (Sofia AI)'],
    links: [{ to: '/workboard', label: 'View on Workboard' }],
  };
}

async function missingDocs() {
  const [page, groups] = await Promise.all([
    E.DocumentRequest.filter({ status: 'outstanding' }, { sort: 'requested_date', limit: 50 }),
    E.DocumentRequest.aggregate({ query: { status: 'outstanding' }, groupBy: 'client_name' }),
  ]);
  const clients = groups.rows.length;
  await E.Task.create({ title: `Follow up on outstanding documents (${clients} clients)`, client_name: 'Multiple clients', agent: 'Nia', staff: 'Sofía Herrera', status: 'todo', priority: 'medium', due_date: inDays(3), source: 'maya' });
  await log('Nia', 'Assigned document follow-up', `${page.items.length} items across ${clients} clients`, '', 'assigned');
  return {
    text: `**${clients} clients** owe us **${page.items.length} documents**. Nia now has a follow-up task. If you want letters drafted for the Spanish-speaking clients, ask me to *prepare Spanish-language reminders*.`,
    steps: [{ agent: 'Nia', label: 'Pulled open document requests' }, { agent: 'Maya', label: 'Assigned follow-up to Nia' }],
    table: { columns: ['Client', 'Document', 'Matter', 'Requested'], rows: page.items.map((x) => [x.client_name, x.document, x.matter_title, `${-daysFrom(x.requested_date)} days ago`]) },
    actions: ['Task created: document follow-up (Nia)'],
    links: [{ to: '/workboard', label: 'View on Workboard' }],
  };
}

async function spanishReminders() {
  const [docs, existing] = await Promise.all([
    E.DocumentRequest.filter({ status: 'outstanding', language: 'es' }, { limit: 50 }),
    E.Approval.filter({ kind: 'doc_reminder', status: 'pending' }, { limit: 50, fields: ['client_code'] }),
  ]);
  const skip = new Set(existing.items.map((a) => a.client_code));
  const by = {};
  docs.items.forEach((x) => { if (!skip.has(x.client_code)) (by[x.client_code] ||= []).push(x); });
  const due = fdate(inDays(7));
  const drafts = Object.values(by).map((list) => {
    const c = list[0];
    return {
      kind: 'doc_reminder', title: 'Spanish document reminder', client_code: c.client_code, client_name: c.client_name, agent: 'Nia', language: 'es', status: 'pending',
      subject: `Recordatorio: documentos pendientes — ${c.matter_title}`,
      body: `Estimado/a ${c.contact_name}:\n\nLe saludamos de Delaware Valley Business Services. Para continuar con su trámite "${c.matter_title}", todavía necesitamos los siguientes documentos:\n\n${list.map((x) => `• ${x.document}`).join('\n')}\n\nLe agradeceríamos enviarlos antes del ${due}. Puede responder a este correo o llamarnos al (215) 555-0140.\n\nAtentamente,\nEquipo de Servicios al Cliente\nDelaware Valley Business Services`,
      rationale: `${list.length} document(s) outstanding on an incomplete filing.`, related_ids: list.map((x) => x.id),
    };
  });
  if (drafts.length) {
    await E.Approval.bulkCreate(drafts);
    await E.Activity.bulkCreate(drafts.map((a) => ({ agent: 'Nia', action: 'Drafted Spanish reminder', detail: 'Awaiting owner approval', client_name: a.client_name, kind: 'approval' })));
  }
  return {
    text: drafts.length
      ? `Nia drafted **${drafts.length} Spanish-language reminders** for clients with incomplete filings. Sofia AI checked each document list against its matter. Every letter is waiting for your approval in the Decision Center. Nothing has been sent.`
      : 'All Spanish-speaking clients with outstanding documents already have reminders waiting for your approval.',
    steps: [{ agent: 'Sofia AI', label: 'Identified incomplete filings' }, { agent: 'Nia', label: `Drafted ${drafts.length} letters in Spanish` }, { agent: 'Maya', label: 'Queued drafts for approval' }],
    table: { columns: ['Client', 'Documents requested'], rows: drafts.map((a) => [a.client_name, String(a.related_ids.length)]) },
    actions: drafts.length ? [`${drafts.length} approval cards created`] : [],
    links: [{ to: '/decisions', label: 'Review drafts' }],
  };
}

async function overdueInvoices() {
  const [page, agg] = await Promise.all([
    E.Invoice.filter({ status: 'overdue' }, { sort: 'due_date', limit: 50 }),
    E.Invoice.aggregate({ query: { status: 'overdue' }, sum: ['amount'] }),
  ]);
  const total = agg.rows[0]?.sum_amount || 0;
  const fresh = page.items.filter((i) => i.reminder_status === 'none');
  const drafts = fresh.map((i) => {
    const es = i.language === 'es';
    return {
      kind: 'invoice_reminder', title: 'Payment reminder', client_code: i.client_code, client_name: i.client_name, agent: 'Ledger', language: i.language, status: 'pending',
      subject: es ? `Recordatorio de pago — Factura ${i.number}` : `Friendly reminder — Invoice ${i.number}`,
      body: es
        ? `Estimado/a ${i.contact_name}:\n\nLe recordamos que la factura ${i.number} por ${money(i.amount)}, con vencimiento el ${fdate(i.due_date)}, sigue pendiente. Si ya realizó el pago, por favor ignore este mensaje.\n\nGracias por su confianza,\nDelaware Valley Business Services`
        : `Hi ${i.contact_name},\n\nThis is a friendly reminder that invoice ${i.number} for ${money(i.amount)}, due ${fdate(i.due_date)}, is still open. If you've already sent payment, please disregard this note.\n\nThank you,\nDelaware Valley Business Services`,
      rationale: `${-daysFrom(i.due_date)} days past due.`, related_ids: [i.id],
    };
  });
  if (drafts.length) {
    await E.Approval.bulkCreate(drafts);
    await E.Invoice.bulkUpdate(fresh.map((i) => ({ id: i.id, reminder_status: 'drafted' })));
  }
  await E.Task.create({ title: `Collections review — ${money(total)} overdue`, client_name: 'Multiple clients', agent: 'Ledger', staff: 'Isabel Cruz', status: 'in_progress', priority: 'high', due_date: inDays(2), source: 'maya' });
  await log('Ledger', 'Reviewed overdue receivables', `${page.items.length} invoices · ${money(total)} · ${drafts.length} reminders drafted`);
  return {
    text: `There are **${page.items.length} overdue invoices** totaling **${money(total)}**. Ledger drafted **${drafts.length} payment reminders**, each in the client's preferred language, and opened a collections review. Nothing goes out until you approve it.`,
    steps: [{ agent: 'Ledger', label: 'Aged the receivables' }, { agent: 'Ledger', label: `Drafted ${drafts.length} reminders` }, { agent: 'Maya', label: 'Queued reminders for approval' }],
    table: { columns: ['Invoice', 'Client', 'Amount', 'Days late'], rows: page.items.map((i) => [i.number, i.client_name, money(i.amount), String(-daysFrom(i.due_date))]) },
    actions: [`${drafts.length} approval cards created`, 'Task created: collections review (Ledger)'],
    links: [{ to: '/decisions', label: 'Review reminders' }],
  };
}

async function newMatter() {
  let c = (await E.Client.filter({ status: 'onboarding' }, { limit: 1 })).items[0];
  if (!c) c = (await E.Client.filter({}, { limit: 1 })).items[0];
  const title = 'PA Business Registration — LLC Formation';
  const m = await E.Matter.create({ client_code: c.code, client_name: c.name, title, type: 'registration', status: 'not_started', progress: 5, target_date: inDays(21), agent: 'Sofia AI', staff: 'Rosa Delgado', compliance: true });
  const base = { client_code: c.code, client_name: c.name, matter_title: title, source: 'maya' };
  await Promise.all([
    E.Task.bulkCreate([
      { ...base, title: 'Run entity name availability search', agent: 'Sofia AI', staff: 'Rosa Delgado', status: 'in_progress', priority: 'high', due_date: inDays(3) },
      { ...base, title: 'Prepare Certificate of Organization checklist', agent: 'Sofia AI', staff: 'Rosa Delgado', status: 'todo', priority: 'medium', due_date: inDays(7) },
      { ...base, title: 'Collect member & registered office details', agent: 'Nia', staff: 'Sofía Herrera', status: 'todo', priority: 'medium', due_date: inDays(5) },
    ]),
    E.DocumentRequest.bulkCreate(['Owner government ID', 'Registered office address confirmation'].map((document) => ({ client_code: c.code, client_name: c.name, contact_name: c.contact_name, matter_title: title, language: c.language, document, requested_date: today(), status: 'outstanding' }))),
    E.Approval.create({ kind: 'new_matter', title: 'Engagement letter for new matter', client_code: c.code, client_name: c.name, agent: 'Nia', language: c.language, status: 'pending', related_ids: [m.id],
      subject: `Engagement: ${title}`, body: `Dear ${c.contact_name},\n\nThank you for choosing Delaware Valley Business Services to assist with your Pennsylvania business registration. Our team will run a name availability search, prepare your formation documents for your review, and coordinate the filing.\n\nTo get started, please send a government-issued ID and confirm your registered office address.\n\nSincerely,\nRosa Delgado, Compliance Specialist`,
      rationale: 'Approve to activate the matter and start work.' }),
    log('Sofia AI', 'Opened new registration matter', title, c.name, 'assigned'),
  ]);
  return {
    text: `I opened **${title}** for **${c.name}**, internal target ${fdate(inDays(21))}. Sofia AI owns the filing work and Nia is collecting the client information. An engagement letter is waiting for your approval. Approving it moves the matter to *In Progress*.`,
    steps: [{ agent: 'Maya', label: 'Created the matter record' }, { agent: 'Sofia AI', label: 'Built the registration workplan (2 tasks)' }, { agent: 'Nia', label: 'Requested 2 documents & drafted engagement letter' }],
    table: { columns: ['Workstream', 'Owner', 'Due'], rows: [['Name availability search', 'Sofia AI', fdate(inDays(3))], ['Certificate of Organization checklist', 'Sofia AI', fdate(inDays(7))], ['Collect member details', 'Nia', fdate(inDays(5))]] },
    actions: ['1 matter, 3 tasks, 2 document requests, 1 approval created'],
    links: [{ to: `/clients/${c.code}`, label: `Open ${c.name}` }, { to: '/decisions', label: 'Review engagement letter' }],
  };
}

async function revenuePlan() {
  const [fees, noPayroll, overdue] = await Promise.all([
    E.Client.aggregate({ query: { status: { $ne: 'inactive' } }, sum: ['monthly_fee'], avg: ['monthly_fee'] }),
    E.Client.count({ status: 'active', services: { $nin: ['Payroll Coordination'] } }),
    E.Invoice.aggregate({ query: { status: 'overdue' }, sum: ['amount'] }),
  ]);
  const annual = (fees.rows[0]?.sum_monthly_fee || 0) * 12;
  const avg = fees.rows[0]?.avg_monthly_fee || 0;
  const target = annual * 0.15;
  const payroll = Math.round(noPayroll * 0.35) * 250 * 12;
  const pricing = annual * 0.04;
  const referrals = 3 * avg * 12;
  const total = payroll + pricing + referrals;
  const tasks = await E.Task.bulkCreate([
    { title: `Build payroll cross-sell list (${noPayroll} candidates)`, client_name: 'Multiple clients', agent: 'Scout', staff: 'Ryan Mitchell', status: 'todo', priority: 'medium', due_date: inDays(7), source: 'maya' },
    { title: 'Design client referral program', client_name: 'Firm-wide', agent: 'Scout', staff: 'Ryan Mitchell', status: 'todo', priority: 'medium', due_date: inDays(10), source: 'maya' },
  ]);
  const body = `Target: +${money(target)} recurring revenue (15% of ${money(annual)}).\n\n1. Payroll cross-sell: convert ~35% of ${noPayroll} clients without payroll at $250/mo → ${money(payroll)}\n2. Pricing review: 4% fee adjustment at renewal → ${money(pricing)}\n3. Referral program: 3 new clients at the ${money(avg)}/mo average → ${money(referrals)}\n\nProjected: ${money(total)} (${Math.round((total / target) * 100)}% of target). Separately, collecting ${money(overdue.rows[0]?.sum_amount || 0)} in overdue receivables improves cash flow.`;
  await E.Approval.create({ kind: 'strategy', title: '15% revenue growth plan', client_name: 'Firm-wide', agent: 'Scout', language: 'en', subject: 'Growth plan for approval', body, rationale: 'Approve to start the Scout workstreams.', status: 'pending', related_ids: tasks.map((t) => t.id) });
  await log('Scout', 'Built revenue growth plan', `Projected ${money(total)} vs ${money(target)} target`, '', 'approval');
  return {
    text: `Current recurring revenue is **${money(annual)}/yr**, so 15% growth means **+${money(target)}**. Scout and Ledger built a three-part plan projected at **${money(total)}** (${Math.round((total / target) * 100)}% of target). Approving it starts Scout's two workstreams.`,
    steps: [{ agent: 'Ledger', label: 'Calculated the recurring revenue base' }, { agent: 'Scout', label: 'Analyzed cross-sell gaps' }, { agent: 'Scout', label: 'Modeled pricing & referrals' }, { agent: 'Maya', label: 'Packaged the plan for approval' }],
    table: { columns: ['Lever', 'Annual impact'], rows: [['Payroll cross-sell', money(payroll)], ['4% pricing review', money(pricing)], ['Referral program (3 clients)', money(referrals)], ['Total projected', money(total)]] },
    actions: ['2 Scout tasks created', 'Growth plan sent to Decision Center'],
    links: [{ to: '/decisions', label: 'Review growth plan' }],
  };
}