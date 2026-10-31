import React from 'react';

export default function Progress({ value = 0 }) {
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-sky-500 transition-all duration-700" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="text-[11px] text-slate-500 tabular-nums w-8">{Math.min(100, value)}%</span>
    </div>
  );
}