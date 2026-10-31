import React from 'react';
import RecordList from '@/components/w/RecordList';

export default function WClients() {
  return (
    <div>
      <h1 className="text-3xl text-slate-900 mb-6">Clients</h1>
      <RecordList entity="Customer" title="Clients & contacts" empty="No clients learned yet." columns={[['contact_name', 'Contact'], ['email', 'Email'], ['industry', 'Industry'], ['relationship', 'Relationship']]} />
    </div>
  );
}