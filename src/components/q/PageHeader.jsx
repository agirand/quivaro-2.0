import React from 'react';

export default function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        {eyebrow && <div className="text-[11px] uppercase tracking-[0.18em] text-teal-700 font-semibold mb-2">{eyebrow}</div>}
        <h1 className="text-3xl md:text-4xl text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}