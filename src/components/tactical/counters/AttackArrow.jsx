import React from "react";

// The red assault arrow a hex wargame draws from the selected stand to every
// enemy it can strike, with the exchange forecast printed beside the target.
export default function AttackArrow({ from, to, dealt, back, active }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  // Start clear of the attacker's plate, stop short of the target's.
  const sx = from.x + ux * 24;
  const sy = from.y + uy * 24;
  const ex = to.x - ux * 25;
  const ey = to.y - uy * 25;
  const hx = ux * 7;
  const hy = uy * 7;
  const px = -uy * 4.2;
  const py = ux * 4.2;

  const stroke = active ? "#F05A46" : "#E2483A";

  return (
    <g opacity={active ? 1 : 0.75}>
      <line
        x1={sx}
        y1={sy}
        x2={ex - hx * 0.8}
        y2={ey - hy * 0.8}
        stroke={stroke}
        strokeWidth={active ? 3.4 : 2.4}
        strokeLinecap="round"
      />
      <polygon
        points={`${ex},${ey} ${ex - hx + px},${ey - hy + py} ${ex - hx - px},${ey - hy - py}`}
        fill={stroke}
      />
      {active && (
        <g transform={`translate(${(sx + ex) / 2},${(sy + ey) / 2 - 13})`}>
          <rect x="-27" y="-7" width="54" height="14" fill="#15181B" stroke={stroke} strokeWidth="1" />
          <text x="-13" y="3.4" className="font-mono" fontSize="7.5" fill="#E2483A" textAnchor="middle">
            −{back}
          </text>
          <text x="0" y="3.4" className="font-mono" fontSize="7.5" fill="#5A6068" textAnchor="middle">
            |
          </text>
          <text x="13" y="3.4" className="font-mono" fontSize="7.5" fill="#8FB56A" textAnchor="middle">
            −{dealt}
          </text>
        </g>
      )}
    </g>
  );
}