import React from 'react';
import RecordList from '@/components/w/RecordList';

export default function WTeam() {
  return (
    <div>
      <h1 className="text-3xl text-slate-900 mb-6">Team</h1>
      <RecordList entity="Employee" title="Employees & roles" empty="No team members learned yet." columns={[['role', 'Role'], ['email', 'Email'], ['responsibilities', 'Owns']]} />
    </div>
  );
}