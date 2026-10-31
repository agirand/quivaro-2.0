import React from 'react';

export default function DataTable({ columns, rows, empty = 'Nothing to show.' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
            {columns.map((c) => <th key={c} className="py-3 px-4 font-semibold">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
              {r.map((cell, j) => <td key={j} className="py-3 px-4 text-slate-700 align-middle">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="text-sm text-slate-400 py-8 text-center">{empty}</p>}
    </div>
  );
}