import React from 'react';
import { ACTIVE, NEEDS_YOU, HOURLY_VALUE } from '@/lib/work';

export default function WorkStats({ orders }) {
  const real = orders.filter((o) => !o.is_demo);
  const done = real.filter((o) => ['accepted', 'closed'].includes(o.status));
  const hours = done.reduce((a, o) => a + (o.hours_saved || 0), 0);
  const stats = [
    ['In progress', orders.filter((o) => ACTIVE.includes(o.status)).length],
    ['Needs you', orders.filter((o) => NEEDS_YOU.includes(o.status)).length],
    ['Completed', done.length],
    ['Est. value delivered', `$${(hours * HOURLY_VALUE).toLocaleString()}`],
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(([l, v]) => (
        <div key={l} className="card-soft p-4">
          <div className="text-2xl font-heading text-slate-900">{v}</div>
          <div className="text-xs text-slate-500 mt-1">{l}</div>
        </div>
      ))}
    </div>
  );
}