export const AGENTS = [
  { name: 'Maya', title: 'AI Chief of Staff / COO', grad: 'from-teal-500 to-sky-600', soft: 'bg-teal-50 text-teal-700',
    tagline: 'Sets priorities, delegates work and reports back to you.',
    responsibilities: ['Daily business briefings', 'Delegation & coordination', 'Consolidated reporting', 'Escalations to the owner'] },
  { name: 'Atlas', title: 'Tax Preparation Agent', grad: 'from-indigo-500 to-blue-600', soft: 'bg-indigo-50 text-indigo-700',
    tagline: 'Prepares business returns and estimated tax reviews.',
    responsibilities: ['Business tax returns', 'Estimated tax reviews', 'Extension recommendations', 'Tax document checklists'] },
  { name: 'Sofia AI', title: 'Regulatory Compliance & Registration', grad: 'from-emerald-500 to-teal-600', soft: 'bg-emerald-50 text-emerald-700',
    tagline: 'Tracks the compliance calendar, registrations and licenses.',
    responsibilities: ['PA business registrations', 'Annual reports & sales tax', 'Local licensing', 'Compliance calendar'] },
  { name: 'Ledger', title: 'Bookkeeping & Financial Operations', grad: 'from-sky-500 to-cyan-600', soft: 'bg-sky-50 text-sky-700',
    tagline: 'Keeps books closed, receivables collected and payroll reconciled.',
    responsibilities: ['Monthly close', 'Accounts receivable', 'Collections reminders', 'Payroll reconciliation'] },
  { name: 'Nia', title: 'Client Services Agent', grad: 'from-rose-400 to-orange-400', soft: 'bg-rose-50 text-rose-700',
    tagline: 'Bilingual client communications and document collection.',
    responsibilities: ['English/Spanish correspondence', 'Document requests', 'Client onboarding', 'Follow-ups'] },
  { name: 'Scout', title: 'Business Development Agent', grad: 'from-amber-400 to-orange-500', soft: 'bg-amber-50 text-amber-700',
    tagline: 'Finds revenue opportunities across the client base.',
    responsibilities: ['Cross-sell analysis', 'Referral programs', 'Pricing reviews', 'Pipeline growth'] },
];
export const AGENT_MAP = Object.fromEntries(AGENTS.map((a) => [a.name, a]));

export const STAFF = [
  { name: 'Elena Ramírez', role: 'Owner & Managing Partner' },
  { name: 'James Whitaker', role: 'Senior Accountant' },
  { name: 'Rosa Delgado', role: 'Compliance Specialist' },
  { name: 'Marcus Chen', role: 'Tax Manager' },
  { name: 'Isabel Cruz', role: 'Bookkeeper' },
  { name: "David O'Neill", role: 'Payroll Coordinator' },
  { name: 'Sofía Herrera', role: 'Client Services Coordinator' },
  { name: 'Nathan Brooks', role: 'Staff Accountant' },
  { name: 'Carla Vega', role: 'Bookkeeper' },
  { name: 'Ryan Mitchell', role: 'Business Development Associate' },
];