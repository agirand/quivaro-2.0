import { LayoutDashboard, MessagesSquare, Building2, Users, ListChecks, Settings2, Bot, Plug, Settings, Inbox } from 'lucide-react';

export const WS_NAV = [
  ['/w', 'Overview', LayoutDashboard], ['/w/conversations', 'Conversations', MessagesSquare], ['/w/clients', 'Clients', Building2],
  ['/w/team', 'Team', Users], ['/w/tasks', 'Tasks', ListChecks], ['/w/operations', 'Operations', Settings2],
  ['/w/agents', 'Agents', Bot], ['/w/integrations', 'Integrations', Plug], ['/w/review', 'Review queue', Inbox], ['/w/settings', 'Settings', Settings],
];