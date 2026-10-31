import { base44 } from '@/api/base44Client';

// Fully synthetic, clearly labeled demonstration. No real clients, documents or sends.
const CLIENTS = ['Alder & Finch Studio', 'Bluebay Landscaping', 'Casa Mirador Café', 'Delta Ridge Plumbing', 'Evergreen Dental Group', 'Fable Print Co.', 'Granite Peak Fitness', 'Harbor Lane Realty', 'Iris Moon Boutique', 'Juniper Tech Repair', 'Kestrel Auto Body', 'Lumen Yoga Loft'];
const MISSING = { 'Bluebay Landscaping': 'Prior-year return', 'Delta Ridge Plumbing': 'EIN letter', 'Harbor Lane Realty': '1099 forms' };
const at = (h) => new Date(Date.now() - h * 3600e3).toISOString();

export async function seedDemoOrder(orgId) {
  const checklist = CLIENTS.map((c) => `| ${c} | ${MISSING[c] ? `Missing: ${MISSING[c]}` : 'Complete'} |`).join('\n');
  const steps = [
    { title: 'Build onboarding checklist for 12 clients', agent: 'Operations', tool: 'workspace', mode: 'demo', status: 'done', output: `| Client | Documents |\n|---|---|\n${checklist}` },
    { title: 'Draft bilingual document requests', agent: 'Sales', tool: 'ai', mode: 'demo', status: 'done', approved: true, needs_approval: true, output: 'Drafted 12 welcome + request emails (6 English, 6 Spanish). Approved by owner.' },
    { title: 'Send requests to clients', agent: 'Administration', tool: 'google_workspace', mode: 'demo', status: 'done', approved: true, needs_approval: true, output: 'Demo only: no emails were sent.' },
    { title: 'Track received and missing documents', agent: 'Administration', tool: 'workspace', mode: 'demo', status: 'done', output: '9 of 12 files complete. 3 clients missing documents (flagged).' },
    { title: 'Approve follow-up for 3 incomplete files', agent: 'Administration', tool: 'ai', mode: 'demo', status: 'awaiting_approval', needs_approval: true, output: Object.entries(MISSING).map(([c, d]) => `**${c}**: Friendly reminder that we still need your ${d} to finish onboarding.`).join('\n\n') },
    { title: 'Prepare files for professional review', agent: 'Operations', tool: 'ai', mode: 'demo', status: 'pending', output: '' },
  ];
  const order = await base44.entities.WorkOrder.create({
    org_id: orgId, is_demo: true, title: 'DEMO · Onboard 12 new clients', template_key: 'client_onboarding', status: 'awaiting_approval',
    request: 'Onboard 12 new clients, collect all required documents, identify incomplete files, and prepare everything for professional review.',
    scope: 'Open 12 client files, request and track documents, flag incomplete files, prepare review-ready files.', exclusions: 'No tax, legal or accounting advice. Demo only: synthetic clients, nothing is sent.',
    inputs: ['Client list', 'Service per client'], provided_info: [], steps, progress: 67,
    acceptance_criteria: [{ text: 'All 12 clients have a checklist', met: true, evidence: 'Checklist table, step 1' }, { text: 'Every missing document is flagged', met: true, evidence: '3 flagged in step 4' }, { text: 'Files prepared for professional review', met: null, evidence: '' }],
    needs_from_customer: 'Approve the draft for "Approve follow-up for 3 incomplete files".', due_date: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10),
    price_mode: 'package', package_price: 40, est_cost: 9.4, actual_cost: 0.18, review_minutes: 6, rework_cost: 0, hours_saved: 6, bonus_status: 'none',
    history: [{ at: at(30), event: 'Requested', detail: 'Demo request' }, { at: at(29), event: 'Scope approved', detail: '' }, { at: at(20), event: 'Approved by owner', detail: 'Draft bilingual document requests' }, { at: at(2), event: 'Draft ready for approval', detail: 'Follow-up for 3 incomplete files' }],
  });
  await base44.entities.Deliverable.create({ org_id: orgId, work_order_id: order.id, is_demo: true, title: 'DEMO · Client onboarding status (interim)', status: 'ready', summary: '9 of 12 synthetic client files are complete; 3 are flagged for missing documents.', content: `## Document status\n\n| Client | Documents |\n|---|---|\n${checklist}`, evidence: steps.slice(0, 4).map((s) => ({ step: s.title, agent: s.agent, tool: s.tool, mode: 'demo', approved: !!s.approved })), quality_checks: [{ text: 'All 12 clients have a checklist', met: true, evidence: 'Checklist table' }] });
  return order;
}