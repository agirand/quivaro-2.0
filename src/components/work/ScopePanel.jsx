import React from 'react';

export default function ScopePanel({ o }) {
  return (
    <div className="card-soft p-5 space-y-4 text-sm">
      <div><div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Requested outcome</div><p className="text-slate-800">{o.request}</p></div>
      <div><div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Scope</div><p className="text-slate-700">{o.scope}</p></div>
      {o.exclusions && <div><div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Not included</div><p className="text-slate-700">{o.exclusions}</p></div>}
      {!!o.inputs?.length && <div><div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Inputs needed</div><ul className="list-disc pl-5 text-slate-700 space-y-0.5">{o.inputs.map((x) => <li key={x}>{x}</li>)}</ul></div>}
      {!!o.provided_info?.length && <div><div className="text-xs uppercase tracking-wider text-slate-400 mb-1">You provided</div><ul className="list-disc pl-5 text-slate-700 space-y-0.5">{o.provided_info.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
    </div>
  );
}