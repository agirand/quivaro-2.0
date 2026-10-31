import { LayoutDashboard, MessagesSquare, Building2, Users, ListChecks, Settings2, Bot, Plug, Settings, Inbox, Briefcase, FileCheck2, LayoutGrid, CreditCard } from 'lucide-react';

export const WS_NAV = [
  ['/w', 'Work Center', Briefcase], ['/w/deliverables', 'Deliverables', FileCheck2], ['/w/catalog', 'Work catalog', LayoutGrid], ['/w/review', 'Approvals', Inbox],
  ['/w/overview', 'AI Manager', LayoutDashboard], ['/w/conversations', 'Conversations', MessagesSquare], ['/w/clients', 'Clients', Building2],
  ['/w/team', 'Team', Users], ['/w/tasks', 'Tasks', ListChecks], ['/w/operations', 'Operations', Settings2],
  ['/w/agents', 'Workforce', Bot], ['/w/integrations', 'Integrations', Plug], ['/w/plans', 'Plan & usage', CreditCard], ['/w/settings', 'Settings', Settings],
];