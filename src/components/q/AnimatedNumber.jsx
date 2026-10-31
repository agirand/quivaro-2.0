import React, { useEffect, useState } from 'react';

export default function AnimatedNumber({ value, format = (n) => Math.round(n).toLocaleString() }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (value == null) return;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 700);
      setN(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="tabular-nums">{value == null ? '—' : format(n)}</span>;
}