import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useWsRefresh } from '@/hooks/useWs';
import RecordList from '@/components/w/RecordList';

export default function WTasks() {
  const refresh = useWsRefresh();
  const toggle = async (t) => { await base44.entities.WorkTask.update(t.id, { status: t.status === 'done' ? 'open' : 'done' }); refresh(); };
  return (
    <div>
      <h1 className="text-3xl text-slate-900 mb-6">Tasks</h1>
      <RecordList entity="WorkTask" title="Tasks, assignments & deadlines" empty="No tasks learned yet." columns={[['assignee', 'Assigned'], ['due_date', 'Due'], ['project_name', 'Engagement'], ['priority', 'Priority']]}
        action={(t) => <button onClick={() => toggle(t)}>{t.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-teal-600" /> : <Circle className="w-4 h-4 text-slate-300 hover:text-teal-500" />}</button>} />
    </div>
  );
}