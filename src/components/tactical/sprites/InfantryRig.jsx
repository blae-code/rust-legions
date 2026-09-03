import React from "react";

// One infantry figure, posed. Feet sit at y=0 and the figure stands ~21 units
// tall, facing right. Everything is driven by the pose numbers from spriteAnim
// so a single rig serves every infantry type in the roster.

const HELMS = {
  helmet: <ellipse cx="0" cy="0" rx="3.5" ry="2.6" />,
  hood: <path d="M-3.2 1.4 q0 -4.4 3.2 -4.4 q3.2 0 3.2 4.4 z" />,
  cap: <path d="M-3 0.6 h6 l0.9 -1 q-1.2 -2.4 -4 -2.4 q-2.8 0 -2.9 3.4 z" />,
  cowl: <path d="M-3.6 2.2 q-0.4 -5.2 3.6 -5.2 q4 0 3.6 5.2 z" />,
};

const WEAPONS = {
  rifle: <rect x="0" y="-0.55" width="13" height="1.1" rx="0.5" />,
  long_rifle: <rect x="0" y="-0.5" width="16.5" height="1" rx="0.45" />,
  trench_gun: <rect x="0" y="-0.7" width="10" height="1.5" rx="0.6" />,
  spade: <path d="M0 -0.5 h8 v-1.6 l2.6 2.1 l-2.6 2.1 v-1.6 h-8 z" />,
  projector: <path d="M0 -0.6 h11 q1.8 0 1.8 1.2 h-12.8 z" />,
};

export default function InfantryRig({ pose, kit }) {
  const { lean, arm, leg, bob, flash, rot, fade } = pose;

  return (
    <g transform={`translate(0,${bob}) rotate(${rot} 0 0)`} opacity={fade}>
      {/* legs — stride opens from the hip */}
      <g stroke={kit.coat} strokeWidth="2.2" strokeLinecap="round">
        <path d={`M0 -8 L${-leg * 0.6} 0`} />
        <path d={`M0 -8 L${leg * 0.6} 0`} />
      </g>

      {/* torso, head and weapon arm all lean together */}
      <g transform={`rotate(${lean} 0 -8)`}>
        <path d="M-2.6 -8 L2.6 -8 L2 -16.5 L-2 -16.5 Z" fill={kit.coat} />
        <rect x="-3.2" y="-15.4" width="6.4" height="1.6" fill={kit.trim} />

        <g transform="translate(0,-18.6)" fill={kit.coat}>
          {HELMS[kit.helm] || HELMS.helmet}
        </g>

        <g transform={`translate(1.2,-14) rotate(${arm} 0 0)`}>
          <rect x="0" y="-0.9" width="6" height="1.8" rx="0.9" fill={kit.trim} />
          <g transform="translate(4.5,0)" fill="hsl(26 20% 14%)">
            {WEAPONS[kit.weapon] || WEAPONS.rifle}
          </g>
          {flash ? (
            <g transform={`translate(${kit.weapon === "long_rifle" ? 21 : kit.weapon === "trench_gun" ? 15 : 18},0)`}>
              <circle r="3.4" fill="hsl(45 100% 82% / 0.9)" />
              <circle r="1.7" fill="hsl(38 100% 92%)" />
            </g>
          ) : null}
        </g>
      </g>
    </g>
  );
}