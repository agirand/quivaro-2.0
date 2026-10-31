import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useWsRecords } from '@/hooks/useWs';
import IntegrationCard from '@/components/w/IntegrationCard';

const PROVIDERS = [
  { id: 'google_workspace', name: 'Google Workspace', about: 'Gmail, Drive, Calendar', sample: 'Sample emails and documents' },
  { id: 'microsoft_365', name: 'Microsoft 365', about: 'Outlook, OneDrive, Teams', sample: 'Sample emails' },
  { id: 'quickbooks', name: 'QuickBooks', about: 'Invoices, customers, payments', sample: 'Sample customers and invoices' },
  { id: 'slack', name: 'Slack', about: 'Team channels' },
  { id: 'hubspot', name: 'HubSpot', about: 'CRM and pipeline' },
  { id: 'dropbox', name: 'Dropbox', about: 'Client files' },
];

export default function WIntegrations() {
  const { data: recs = [] } = useWsRecords('Integration');
  return (
    <div>
      <h1 className="text-3xl text-slate-900 mb-1">Integrations</h1>
      <p className="text-sm text-slate-500 mb-4">Connect your systems and Quivaro discovers your customers, team, engagements and deadlines.</p>
      <div className="rounded-xl bg-amber-50 border border-amber-200/70 p-3 text-xs text-amber-900 flex gap-2 mb-6">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span>Live account connections are not set up yet. The connections below are clearly labeled demonstrations that load fictional sample data for “Keystone Ledger &amp; Advisory”, a 10-person accounting firm. Quivaro never asks for passwords; future connections use secure sign-in with the provider.</span>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {PROVIDERS.map((p) => <IntegrationCard key={p.id} p={p} rec={recs.find((r) => r.provider === p.id)} />)}
      </div>
    </div>
  );
}