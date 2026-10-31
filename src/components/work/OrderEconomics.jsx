import React from 'react';

const $ = (n) => `$${(n || 0).toFixed(2)}`;

export default function OrderEconomics({ o }) {
  const review = (o.review_minutes || 0) * 1;
  const cost = (o.actual_cost || 0) + review + (o.rework_cost || 0);
  const price = o.price_mode === 'package' ? o.package_price || 0 : 0;
  const rows = [
    ['Pricing', o.price_mode === 'package' ? `Work package ${$(price)}` : 'Included in your plan'],
    ['Estimated delivery cost', $(o.est_cost)], ['AI & tool cost', $(o.actual_cost)], [`Review time (${o.review_minutes || 0} min)`, $(review)], ['Rework', $(o.rework_cost)],
    ...(o.price_mode === 'package' ? [['Margin', price ? `${Math.round(((price - cost) / price) * 100)}%` : '—']] : []),
    ['Bonus', o.bonus_status === 'pledged' ? `${$(o.bonus_amount)} pledged` : o.bonus_status === 'declined' ? 'Declined' : 'None'],
  ];
  return (
    <div className="card-soft p-5">
      <div className="text-sm font-medium text-slate-900">Delivery economics</div>
      <div className="text-[11px] text-slate-400 mb-3">Illustrative figures · billing not active</div>
      <dl className="space-y-1.5 text-sm">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-slate-500">{k}</dt><dd className="text-slate-900 text-right">{v}</dd></div>)}</dl>
    </div>
  );
}