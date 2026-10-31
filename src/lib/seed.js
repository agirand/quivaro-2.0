import { base44 } from '@/api/base44Client';
import { inDays as d, today } from '@/lib/format';

const E = base44.entities;

const CLIENTS = [
  ['Keystone Ridge Landscaping LLC', 'Landscaping', 'Tom Brennan', 'en', 'Bristol'],
  ['Panadería La Esperanza', 'Bakery', 'María Gutiérrez', 'es', 'Bristol'],
  ['Delaware River Auto Care', 'Auto Repair', 'Kevin Walsh', 'en', 'Croydon'],
  ['Rivera Construction Group', 'Construction', 'Luis Rivera', 'es', 'Levittown'],
  ['Bucks County Dental Studio', 'Dental Practice', 'Dr. Priya Shah', 'en', 'Langhorne'],
  ['Sabor Latino Restaurant', 'Restaurant', 'Ana Morales', 'es', 'Bristol'],
  ['Fallsington Pet Grooming', 'Pet Services', 'Jenna Kowalski', 'en', 'Fairless Hills'],
  ['Torres Cleaning Services', 'Commercial Cleaning', 'Carmen Torres', 'es', 'Bensalem'],
  ['Mill Street Coffee Roasters', 'Café', 'Ben Hartley', 'en', 'Bristol'],
  ['Ortiz Family Trucking', 'Logistics', 'Javier Ortiz', 'es', 'Morrisville'],
  ['Neshaminy Physical Therapy', 'Healthcare', 'Dr. Lauren Price', 'en', 'Langhorne'],
  ['Belleza Hair Salon', 'Salon', 'Lucía Fernández', 'es', 'Levittown'],
  ['Penn Valley HVAC Solutions', 'HVAC', 'Mark DiNardo', 'en', 'Bensalem'],
  ['Mercado El Sol', 'Grocery', 'Roberto Castillo', 'es', 'Bristol'],
  ['Harbor Point Marina Supply', 'Retail', 'Diane Foster', 'en', 'Bristol'],
  ['Quintero Painting & Drywall', 'Construction', 'Miguel Quintero', 'es', 'Croydon'],
  ['Silver Lake Yoga Collective', 'Fitness', 'Erin Callahan', 'en', 'Bristol'],
  ['Tri-State Tile & Stone', 'Wholesale', 'Anthony Russo', 'en', 'Bensalem'],
  ['Cuidado Home Health Aides', 'Home Care', 'Gabriela Méndez', 'es', 'Levittown'],
  ['Radcliffe Street Books', 'Bookstore', 'Hannah Lee', 'en', 'Bristol'],
  ['Morales Electrical Contractors', 'Electrical', 'Daniel Morales', 'es', 'Fairless Hills'],
  ['Langhorne Family Chiropractic', 'Healthcare', 'Dr. Sam Patel', 'en', 'Langhorne'],
  ['Bristol Bay Seafood Market', 'Food Retail', 'Chris Nguyen', 'en', 'Bristol'],
  ['Estrella Tax & Notary Services', 'Professional Services', 'Patricia Reyes', 'es', 'Bensalem'],
  ['Greenleaf Event Rentals', 'Events', 'Olivia Martin', 'en', 'Yardley'],
];

const TYPES = [
  ['tax', '2025 Business Tax Return (1120-S)', 'Atlas'],
  ['bookkeeping', 'Monthly Bookkeeping — September Close', 'Ledger'],
  ['registration', 'PA Business Registration (DOS Filing)', 'Sofia AI'],
  ['licensing', 'Township Business License Renewal', 'Sofia AI'],
  ['accounting', 'Q3 Financial Statements', 'Ledger'],
  ['compliance', 'PA Annual Report Preparation', 'Sofia AI'],
  ['compliance', 'Q3 Sales Tax Filing (PA-3)', 'Sofia AI'],
  ['tax', 'Quarterly Estimated Tax Review', 'Atlas'],
  ['accounting', 'Payroll Coordination — Q3 Reconciliation', 'Ledger'],
];
const SERVICE = { tax: 'Business Tax Preparation', bookkeeping: 'Bookkeeping', registration: 'Business Registration', licensing: 'Licensing Assistance', accounting: 'Accounting', compliance: 'Regulatory Filing Support' };
const STAFF_BY = { tax: 'Marcus Chen', bookkeeping: 'Isabel Cruz', registration: 'Rosa Delgado', licensing: 'Rosa Delgado', accounting: 'James Whitaker', compliance: 'Rosa Delgado' };
const TASK = { tax: 'Prepare return workpapers', bookkeeping: 'Reconcile bank & card accounts', registration: 'Assemble registration packet', licensing: 'Complete license renewal form', accounting: 'Draft financial statements', compliance: 'Prepare filing worksheet' };
const STAT = ['in_progress', 'waiting_client', 'not_started', 'review', 'completed', 'in_progress', 'waiting_client'];
const PROG = { not_started: 0, in_progress: 40, waiting_client: 30, review: 75, completed: 100 };
const DOCS = ['2025 bank statements (Jan–Dec)', 'Prior-year federal return', 'EIN confirmation letter (CP-575)', 'Payroll registers — Q3', 'Owner government ID', 'Q3 sales receipts summary', 'Certificate of insurance', 'Signed engagement letter'];
const OWNERS = ['James Whitaker', 'Marcus Chen', 'Isabel Cruz', 'Nathan Brooks', 'Carla Vega', 'Rosa Delgado'];

export function buildSeed() {
  const clients = [], matters = [], invoices = [], docs = [], tasks = [];
  let inv = 1001;
  CLIENTS.forEach(([name, industry, contact, lang, city], i) => {
    const code = `DV-${101 + i}`;
    const mts = [TYPES[i % 9]];
    const second = TYPES[(i * 4 + 3) % 9];
    if (i % 3 !== 2 && second !== mts[0]) mts.push(second);
    const fee = 300 + ((i * 137) % 36) * 25;
    const services = [...new Set(['Bookkeeping', ...mts.map((m) => SERVICE[m[0]])])];
    if (i % 4 === 0 || mts.some((m) => m[1].startsWith('Payroll'))) services.push('Payroll Coordination');
    clients.push({
      code, name, industry, contact_name: contact, language: lang, city: `${city}, PA`, services,
      email: `${contact.split(' ').slice(-1)[0].toLowerCase()}@${name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}.example`,
      phone: `(215) 555-${String(1200 + i * 37).slice(-4)}`, status: i >= 23 ? 'onboarding' : 'active',
      monthly_fee: fee, owner_staff: OWNERS[i % 6], since: String(2015 + (i % 10)),
      notes: lang === 'es' ? 'Prefers Spanish-language correspondence.' : 'Prefers email; quarterly check-in call.',
    });
    mts.forEach(([type, title, agent], j) => {
      const k = i * 2 + j;
      const status = STAT[k % STAT.length];
      const off = ((k * 11) % 45) - 10;
      const staff = STAFF_BY[type];
      matters.push({ client_code: code, client_name: name, title, type, status, target_date: d(off), agent, staff,
        progress: status === 'completed' ? 100 : PROG[status] + ((k * 7) % 15), compliance: ['compliance', 'registration', 'licensing'].includes(type) });
      tasks.push({ title: TASK[type], client_code: code, client_name: name, matter_title: title, agent, staff,
        status: status === 'completed' ? 'done' : status === 'not_started' || status === 'waiting_client' ? 'todo' : 'in_progress',
        priority: off < 3 ? 'high' : off < 14 ? 'medium' : 'low', due_date: d(off - 2), source: 'seed' });
      const dbase = { client_code: code, client_name: name, contact_name: contact, language: lang, matter_title: title };
      // Documents are tied to matter status: waiting on client => outstanding docs; completed => received
      if (status === 'waiting_client') {
        docs.push({ ...dbase, document: DOCS[k % 8], requested_date: d(-(5 + (k % 12))), status: 'outstanding' });
        if (k % 2) docs.push({ ...dbase, document: DOCS[(k + 3) % 8], requested_date: d(-(3 + (k % 9))), status: 'outstanding' });
      }
      if (status === 'completed') docs.push({ ...dbase, document: DOCS[(k + 5) % 8], requested_date: d(off - 20), status: 'received' });
    });
    const base = { client_code: code, client_name: name, contact_name: contact, language: lang, reminder_status: 'none' };
    invoices.push({ ...base, number: `INV-2026-${inv++}`, amount: fee, issue_date: d(-44), due_date: d(-14), status: 'paid' });
    if (i % 4 === 0) invoices.push({ ...base, number: `INV-2026-${inv++}`, amount: fee + (i % 3) * 150, issue_date: d(-62 - i), due_date: d(-32 - i), status: 'overdue' });
    if (i % 4 === 1) invoices.push({ ...base, number: `INV-2026-${inv++}`, amount: fee, issue_date: d(-6), due_date: d(24), status: 'open' });
    if (i % 7 === 3) invoices.push({ ...base, number: `INV-2026-${inv++}`, amount: fee + 425, issue_date: d(-50), due_date: d(-20), status: 'overdue' });
  });

  // Seed activity, derived from the records above so every number matches
  const done = (a) => tasks.filter((t) => t.agent === a && t.status === 'done');
  const activities = ['Atlas', 'Sofia AI', 'Ledger'].flatMap((a) => done(a).slice(0, 2).map((t) => ({ agent: a, action: `Completed: ${t.title}`, detail: t.matter_title, client_name: t.client_name, kind: 'completed' })));
  activities.push({ agent: 'Maya', action: 'Assigned weekly priorities', detail: `${tasks.filter((t) => t.status !== 'done').length} open tasks across the AI team`, client_name: '', kind: 'assigned' });

  const onboard = clients.find((c) => c.status === 'onboarding');
  const atRisk = matters.find((m) => m.type === 'tax' && m.status === 'waiting_client') || matters.find((m) => m.status === 'waiting_client');
  const atRiskDocs = docs.filter((x) => x.client_code === atRisk.client_code && x.matter_title === atRisk.title && x.status === 'outstanding');
  const oldest = invoices.filter((x) => x.status === 'overdue').sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
  const approvals = [
    { kind: 'client_email', title: 'Welcome email to new client', client_code: onboard.code, client_name: onboard.name, agent: 'Nia', language: onboard.language,
      subject: 'Welcome to Delaware Valley Business Services', body: `Hi ${onboard.contact_name.split(' ')[0]},\n\nWelcome aboard! Your engagement lead is ${onboard.owner_staff}. Over the next week we will set up your files for: ${onboard.services.join(', ')}.\n\nPlease reply with a good time for a 20-minute kickoff call.\n\nWarm regards,\nDelaware Valley Business Services`,
      rationale: 'Onboarding client has not received a kickoff message.', status: 'pending', related_ids: [] },
    { kind: 'exception', title: 'Recommend filing extension', client_code: atRisk.client_code, client_name: atRisk.client_name, agent: 'Atlas', language: 'en',
      subject: `Internal recommendation — ${atRisk.title}`, body: `${atRisk.client_name} is still missing: ${atRiskDocs.map((x) => x.document).join('; ')}. Atlas recommends preparing an extension request internally so the team is not working against the current internal target.\n\nRequires owner judgment before any client communication.`,
      rationale: `${atRiskDocs.length} document(s) outstanding; internal target at risk.`, status: 'pending', related_ids: [] },
    { kind: 'exception', title: 'Pause work for oldest overdue balance?', client_code: oldest.client_code, client_name: oldest.client_name, agent: 'Ledger', language: 'en',
      subject: `Internal recommendation — ${oldest.number}`, body: `Invoice ${oldest.number} for $${oldest.amount.toLocaleString()} is the oldest unpaid balance. Ledger recommends a personal call from the owner before any further work is scheduled for this client.`,
      rationale: 'Oldest overdue receivable; relationship decision.', status: 'pending', related_ids: [] },
  ];

  const chat = [{ role: 'maya', text: "Good morning, Elena. I'm **Maya**, your AI Chief of Staff. The team is standing by: Atlas (tax), Sofia AI (compliance), Ledger (books & receivables), Nia (client services) and Scout (growth).\n\nGive me an objective and I'll take it from there. Try one of the suggestions below.", payload: {} }];

  return { clients, matters, invoices, docs, tasks, activities, approvals, chat };
}

const ENTITIES = ['Client', 'Matter', 'Invoice', 'DocumentRequest', 'Task', 'Approval', 'Activity', 'ChatMessage'];

// Keep stored invoice status consistent with due dates (open + past due => overdue)
export async function syncInvoiceStatuses() {
  for (let g = 0; g < 5; g++) {
    const r = await E.Invoice.updateMany({ status: 'open', due_date: { $lt: today() } }, { $set: { status: 'overdue' } });
    if (!r?.has_more) break;
  }
}

let resetting = null;
export function resetDemo() {
  if (!resetting) resetting = doReset().finally(() => { resetting = null; });
  return resetting;
}

async function doReset() {
  await Promise.all(ENTITIES.map(async (n) => {
    for (let g = 0; g < 10; g++) {
      const r = await E[n].deleteMany({});
      if (!r?.has_more) break;
    }
  }));
  const s = buildSeed();
  await Promise.all([
    E.Client.bulkCreate(s.clients), E.Matter.bulkCreate(s.matters), E.Invoice.bulkCreate(s.invoices),
    E.DocumentRequest.bulkCreate(s.docs), E.Task.bulkCreate(s.tasks), E.Activity.bulkCreate(s.activities),
    E.Approval.bulkCreate(s.approvals), E.ChatMessage.bulkCreate(s.chat),
  ]);
}