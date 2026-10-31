import { base44 } from '@/api/base44Client';

export const GREETING = "Hi! So nice to meet you. I'm Quivaro.\n\nI'm here to get to know your business, understand how everything works, and find ways AI can make your life easier.\n\nLet's start with something simple. **What's the name of your company, and what do you do?**";

export const TYPE_META = {
  employee: { label: 'Team member', entity: 'Employee', to: '/w/team' },
  customer: { label: 'Client', entity: 'Customer', to: '/w/clients' },
  offering: { label: 'Service', entity: 'Offering', to: '/w/operations' },
  project: { label: 'Engagement', entity: 'Project', to: '/w/operations' },
  task: { label: 'Task', entity: 'WorkTask', to: '/w/tasks' },
  preference: { label: 'Procedure', entity: 'Preference', to: '/w/operations' },
};

export const PROFILE_FIELDS = [
  ['name', 'Company'], ['industry', 'Industry'], ['description', 'What you do'], ['employee_count', 'Employees'],
  ['customer_segments', 'Customers'], ['time_drains', 'Owner time drains'], ['location', 'Location'],
  ['website', 'Website'], ['address', 'Address'], ['public_phone', 'Public phone'], ['public_email', 'Public email'],
  ['communication_tools', 'Communication'], ['software', 'Software'],
];

// Created once per owner; react-query dedupes concurrent calls.
export async function ensureOrg() {
  const me = await base44.auth.me();
  const page = await base44.entities.Organization.filter({ created_by_id: me.id }, { limit: 1 });
  if (page.items[0]) return page.items[0];
  const org = await base44.entities.Organization.create({ onboarding_stage: 'intro' });
  const now = new Date().toISOString();
  const convos = await base44.entities.Conversation.bulkCreate([
    { org_id: org.id, channel: 'web', title: 'Quivaro AI Manager', participant: 'AI Manager', last_message: 'Tell me about your business…', last_message_at: now },
    { org_id: org.id, channel: 'whatsapp', title: 'WhatsApp', participant: 'Channel not connected', is_demo: true },
    { org_id: org.id, channel: 'sms', title: 'iMessage / SMS', participant: 'Channel not connected', is_demo: true },
    { org_id: org.id, channel: 'email', title: 'Email', participant: 'Channel not connected', is_demo: true },
  ]);
  await base44.entities.Message.create({ org_id: org.id, conversation_id: convos[0].id, channel: 'web', direction: 'outbound', sender: 'manager', text: GREETING, delivery_status: 'delivered_in_app' });
  return org;
}