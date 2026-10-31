import React from 'react';
import RecordList from '@/components/w/RecordList';

export default function WOperations() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl text-slate-900">Operations</h1>
      <RecordList entity="Offering" title="Products & services" empty="No services learned yet." columns={[['description', 'About'], ['price_note', 'Pricing']]} />
      <RecordList entity="Project" title="Projects & engagements" empty="No engagements learned yet." columns={[['customer_name', 'Client'], ['status', 'Status'], ['due_date', 'Target'], ['description', 'About']]} />
      <RecordList entity="Preference" title="Preferences & operating procedures" empty="No procedures learned yet." columns={[['category', 'Area'], ['detail', 'Rule']]} />
    </div>
  );
}