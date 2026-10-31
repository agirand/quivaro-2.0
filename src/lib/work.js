import { base44 } from '@/api/base44Client';

export const STATUS = {
  scoped: ['Awaiting your approval', 'bg-amber-50 text-amber-700'],
  executing: ['In progress', 'bg-sky-50 text-sky-700'],
  needs_input: ['Needs information', 'bg-amber-50 text-amber-700'],
  awaiting_approval: ['Needs approval', 'bg-amber-50 text-amber-700'],
  blocked: ['Blocked', 'bg-rose-50 text-rose-700'],
  quality_review: ['Quality review', 'bg-violet-50 text-violet-700'],
  delivered: ['Delivered', 'bg-teal-50 text-teal-700'],
  accepted: ['Accepted', 'bg-emerald-50 text-emerald-700'],
  revision_requested: ['Revision', 'bg-violet-50 text-violet-700'],
  cancelled: ['Cancelled', 'bg-slate-100 text-slate-500'],
  closed: ['Closed', 'bg-slate-100 text-slate-500'],
};
export const NEEDS_YOU = ['scoped', 'needs_input', 'awaiting_approval', 'blocked', 'quality_review', 'delivered'];
export const ACTIVE = ['executing', 'needs_input', 'awaiting_approval', 'blocked', 'quality_review', 'revision_requested'];

export const TOOL_LABEL = { workspace: 'Quivaro records', ai: 'Quivaro AI', google_workspace: 'Google Workspace', microsoft_365: 'Microsoft 365', quickbooks: 'QuickBooks', hubspot: 'HubSpot', dropbox: 'Dropbox' };
export const MODE_LABEL = { connected: ['Connected', 'text-emerald-700 bg-emerald-50'], not_connected: ['Not connected', 'text-rose-700 bg-rose-50'], manual: ['Done by your team', 'text-slate-700 bg-slate-100'], demo: ['Demo only', 'text-violet-700 bg-violet-50'] };

// Illustrative plans; billing is not active.
export const PLANS = [
  { id: 'starter', name: 'Starter', price: 299, included: 10, about: 'Core admin work for owner-led firms.' },
  { id: 'growth', name: 'Growth', price: 599, included: 30, about: 'Recurring client operations every month.' },
  { id: 'scale', name: 'Scale', price: 1199, included: 80, about: 'High-volume work across service lines.' },
];
export const BONUS_OPTIONS = [10, 25, 50, 100];
export const HOURLY_VALUE = 45; // illustrative value of an owner/staff hour

const step = (title, agent, tool, needs_approval = false) => ({ title, agent, tool, needs_approval });
export const DEFAULT_TEMPLATES = [
  { key: 'client_onboarding', name: 'New client onboarding', category: 'Client Operations', description: 'Open the client file, prepare the engagement checklist, request documents and deliver an organized file for review.', inputs: ['Client names and contacts', 'Service each client signed up for'], steps: [step('Build onboarding checklist per client', 'Operations', 'workspace'), step('Draft welcome and document request emails', 'Sales', 'ai', true), step('Send requests to clients', 'Administration', 'google_workspace', true), step('Track received and missing documents', 'Administration', 'workspace'), step('Prepare client files for professional review', 'Operations', 'ai')], deliverables: ['Onboarding checklist', 'Document status report', 'Review-ready client files'], acceptance_criteria: ['Every client has a checklist', 'Every missing document is listed per client', 'Files are summarized for professional review'], price_mode: 'package', package_price: 40, hours_saved: 6 },
  { key: 'document_collection', name: 'Missing document collection', category: 'Client Operations', description: 'Find what is missing, request it politely in English or Spanish, and follow up until complete.', inputs: ['Clients and required documents'], steps: [step('Identify missing documents', 'Administration', 'workspace'), step('Draft bilingual reminders', 'Administration', 'ai', true), step('Send reminders', 'Administration', 'google_workspace', true), step('Summarize collection status', 'Operations', 'ai')], deliverables: ['Missing-document list', 'Approved reminders', 'Status summary'], acceptance_criteria: ['Each missing item is tied to a client', 'Reminders are drafted for each client', 'A status summary is produced'], price_mode: 'included', hours_saved: 3 },
  { key: 'ar_followup', name: 'Accounts receivable follow-up', category: 'Finance Operations', description: 'Review overdue invoices, draft reminders and prepare a collections summary.', inputs: ['Open and overdue invoices'], steps: [step('Pull overdue invoices', 'Finance', 'quickbooks'), step('Prioritize by amount and age', 'Finance', 'ai'), step('Draft reminder messages', 'Finance', 'ai', true), step('Prepare collections summary', 'Finance', 'ai')], deliverables: ['Prioritized overdue list', 'Approved reminders', 'Collections summary'], acceptance_criteria: ['Every overdue invoice is listed with age', 'Reminders are drafted', 'Summary states total outstanding'], price_mode: 'package', package_price: 35, hours_saved: 4 },
  { key: 'client_reporting', name: 'Monthly client status report', category: 'Client Operations', description: 'Compile what was done for each client this month into a clear status report.', inputs: ['Reporting month', 'Clients to include'], steps: [step('Gather engagement and task status', 'Operations', 'workspace'), step('Draft client-ready reports', 'Operations', 'ai', true), step('Prepare delivery package', 'Administration', 'ai')], deliverables: ['One status report per client'], acceptance_criteria: ['Each included client has a report', 'Reports list completed and open items'], price_mode: 'included', hours_saved: 5 },
  { key: 'lead_qualification', name: 'Lead qualification & CRM prep', category: 'Sales Operations', description: 'Qualify new leads against your ideal client and prepare CRM-ready records.', inputs: ['New leads', 'Ideal client description'], steps: [step('Score leads against ideal client', 'Sales', 'ai'), step('Draft follow-up for qualified leads', 'Sales', 'ai', true), step('Prepare CRM updates', 'Sales', 'hubspot', true)], deliverables: ['Qualified lead list', 'Follow-up drafts', 'CRM update sheet'], acceptance_criteria: ['Each lead has a score and reason', 'Qualified leads have a follow-up draft'], price_mode: 'included', hours_saved: 3 },
  { key: 'admin_documents', name: 'Administrative document prep', category: 'Administration', description: 'Prepare letters, forms and internal documents from your records.', inputs: ['Document type and purpose'], steps: [step('Collect required details', 'Administration', 'workspace'), step('Draft documents', 'Administration', 'ai', true), step('Final formatting check', 'Administration', 'ai')], deliverables: ['Review-ready documents'], acceptance_criteria: ['Documents contain all required details', 'No placeholder text remains'], price_mode: 'included', hours_saved: 2 },
];

export async function ensureTemplates(orgId) {
  const page = await base44.entities.WorkTemplate.filter({ org_id: orgId }, { limit: 50 });
  if (page.items.length) return page.items;
  return base44.entities.WorkTemplate.bulkCreate(DEFAULT_TEMPLATES.map((t) => ({ ...t, org_id: orgId })));
}