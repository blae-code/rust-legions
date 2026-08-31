import { useEffect, useRef, useState } from "react";
import React from "react";

export const REVEAL_MS = 3400;

// Watches the fog-of-war observed set across state refreshes and reports
// newly surveyed node ids, so the chart can stage a reveal ceremony on them.
// The first charted set (page load) passes silently — no ceremony for old news.
export function useFogReveals(observed) {
  const prev = useRef(null);
  const [reveals, setReveals] = useState([]);
  useEffect(() => {
    if (!observed) return;
    if (prev.current === null) {
      prev.current = new Set(observed);
      return;
    }
    const fresh = observed.filter((id) => !prev.current.has(id));
    prev.current = new Set(observed);
    if (fresh.length === 0) return;
    const stamp = Date.now();
    setReveals((r) => [...r, ...fresh.map((id) => ({ id, key: `${id}-${stamp}`, stamp }))]);
    const t = setTimeout(() => setReveals((r) => r.filter((x) => x.stamp !== stamp)), REVEAL_MS);
    return () => clearTimeout(t);
  }, [observed]);
  return reveals;
}

// The reveal ceremony over one node: the fog shroud is blown outward and burns
// off, a brass rangefinder ring rotates and clamps down onto the site, then the
// survey stamp flashes as the intelligence is inked onto the chart. Pure SMIL —
// self-running on mount, heavy easing, no per-frame JS.
export function FogRevealBurst({ x, y }) {
  return (
    <g pointerEvents="none">
      {/* Fog burning off — a dark shroud shoved outward, slow and heavy */}
      <circle cx={x} cy={y} r="12" fill="#07090c" opacity="0.95" filter="url(#mc-glow)">
        <animate attributeName="r" values="12;40" dur="2.4s" fill="freeze" calcMode="spline" keySplines="0.15 0.6 0.25 1" keyTimes="0;1" />
        <animate attributeName="opacity" values="0.95;0.55;0" keyTimes="0;0.45;1" dur="2.4s" fill="freeze" />
      </circle>
      {/* Second fog wisp, offset and slower — the smoke doesn't leave all at once */}
      <circle cx={x + 6} cy={y - 4} r="8" fill="#0a0d12" opacity="0.7" filter="url(#mc-glow)">
        <animate attributeName="r" values="8;30" dur="3s" fill="freeze" calcMode="spline" keySplines="0.2 0.7 0.3 1" keyTimes="0;1" />
        <animate attributeName="opacity" values="0.7;0" dur="3s" fill="freeze" />
      </circle>
      {/* Rangefinder locking on — dashed brass ring grinding down onto the site */}
      <g>
        <animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`80 ${x} ${y}`} dur="2.8s" fill="freeze" calcMode="spline" keySplines="0.3 0 0.2 1" keyTimes="0;1" />
        <circle cx={x} cy={y} r="34" fill="none" stroke="#C9A227" strokeWidth="1.2" strokeDasharray="5 6" opacity="0">
          <animate attributeName="r" values="34;11" dur="1.9s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.15 1" keyTimes="0;1" />
          <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.12;0.72;1" dur="2.8s" fill="freeze" />
        </circle>
      </g>
      {/* Crosshair ticks slam in from outside as the lock lands */}
      {[[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy], i) => (
        <line
          key={i}
          x1={x + dx * 14} y1={y + dy * 14} x2={x + dx * 20} y2={y + dy * 20}
          stroke="#E8C15A" strokeWidth="1.3" opacity="0"
        >
          <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.3;1" begin="1.5s" dur="1.4s" fill="freeze" />
          <animate attributeName="x1" values={`${x + dx * 22};${x + dx * 12}`} begin="1.5s" dur="0.5s" fill="freeze" calcMode="spline" keySplines="0.2 0.9 0.2 1" keyTimes="0;1" />
          <animate attributeName="y1" values={`${y + dy * 22};${y + dy * 12}`} begin="1.5s" dur="0.5s" fill="freeze" calcMode="spline" keySplines="0.2 0.9 0.2 1" keyTimes="0;1" />
        </line>
      ))}
      {/* The survey stamp — a dull amber thud as the site is inked onto the chart */}
      <circle cx={x} cy={y} r="4" fill="#E8C15A" opacity="0" filter="url(#mc-glow)">
        <animate attributeName="opacity" values="0;0.8;0" keyTimes="0;0.4;1" begin="1.7s" dur="1s" fill="freeze" />
        <animate attributeName="r" values="4;10" begin="1.7s" dur="1s" fill="freeze" />
      </circle>
    </g>
  );
}