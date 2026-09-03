import React from "react";
import { ACTIVITIES } from "@/lib/tactical/activities";

// The state mark struck onto a static counter. Each activity has its OWN glyph
// — the badge must be identifiable by shape, not only by colour, so a
// colour-blind read still tells a light gun from a siege piece.
const GLYPHS = {
  firing_light: (
    <g>
      <path d="M-4 0 h5 M1 -2.5 l4 2.5 l-4 2.5 z" />
      <circle cx="-5.5" cy="0" r="1" />
    </g>
  ),
  firing_sustained: (
    <g>
      <path d="M-5 -2 h4 M-5 0 h4 M-5 2 h4" />
      <path d="M0 -2.5 l4.5 2.5 l-4.5 2.5 z" />
    </g>
  ),
  firing_light_gun: (
    <g>
      <rect x="-5.5" y="-1" width="7" height="2" />
      <path d="M2 -3 l4 3 l-4 3 z" />
    </g>
  ),
  firing_heavy_gun: (
    <g>
      <rect x="-6" y="-1.6" width="8" height="3.2" />
      <path d="M2.5 -4 l4.5 4 l-4.5 4 z" />
    </g>
  ),
  firing_siege: (
    <g>
      <rect x="-6.5" y="-2.2" width="8" height="4.4" />
      <path d="M2 -5 l5.5 5 l-5.5 5 z" />
      <path d="M-7 3.5 h4" />
    </g>
  ),
  grenade: (
    <g>
      <path d="M-6 3 q3 -9 9 -6" fill="none" />
      <circle cx="4" cy="-3.5" r="2.4" />
      <path d="M4 -6.5 v-1.8" />
    </g>
  ),
  flame: (
    <g>
      <path d="M-6 0 q3 -4 7 -3 q-2 3 1 3 q-3 4 -8 0 z" />
      <path d="M3 -4.5 q3 1 4 4" fill="none" />
    </g>
  ),
  melee: (
    <g>
      <path d="M-5 -5 L5 5 M5 -5 L-5 5" fill="none" />
    </g>
  ),
  move_foot: (
    <g>
      <path d="M-6 3 l3 -3 l-3 -3 M-1 3 l3 -3 l-3 -3 M4 3 l3 -3 l-3 -3" fill="none" />
    </g>
  ),
  move_tracked: (
    <g>
      <rect x="-6.5" y="-2" width="13" height="4" rx="2" fill="none" />
      <circle cx="-3.5" cy="0" r="1" />
      <circle cx="0" cy="0" r="1" />
      <circle cx="3.5" cy="0" r="1" />
    </g>
  ),
  digging: (
    <g>
      <path d="M-4 5 L3 -2" fill="none" />
      <path d="M2 -5 l4 0 l0 4 l-2 2 l-4 -4 z" />
    </g>
  ),
  constructing: (
    <g>
      <path d="M-5 5 L1 -1" fill="none" />
      <rect x="0" y="-6" width="7" height="3.4" transform="rotate(45 3.5 -4.3)" />
      <path d="M-6 -4 l1.5 1.5 M-4 -6 l1.5 1.5" fill="none" />
    </g>
  ),
  repairing: (
    <g>
      <path d="M-5 5 L2 -2" fill="none" />
      <path d="M2 -6 a3.4 3.4 0 1 0 4 4 l-1.6 -1.6 l-1 1 l-1.4 -1.4 l1 -1 z" />
    </g>
  ),
  spotting: (
    <g>
      <circle cx="0" cy="0" r="4" fill="none" />
      <path d="M0 -6.5 v2 M0 4.5 v2 M-6.5 0 h2 M4.5 0 h2" fill="none" />
      <circle cx="0" cy="0" r="1.2" />
    </g>
  ),
  reloading: (
    <g>
      <rect x="-4.5" y="-1.5" width="4" height="7" rx="0.6" />
      <path d="M-2.5 -1.5 v-4 h2 v4" fill="none" />
      <path d="M2 4 q4 -4 0 -8" fill="none" />
    </g>
  ),
  suppressed: (
    <g>
      <path d="M-6 -4 q6 5 12 0" fill="none" />
      <path d="M-3 4 h6" fill="none" />
      <path d="M0 -1 v4" fill="none" />
    </g>
  ),
  destroyed: (
    <g>
      <path d="M-5.5 -5.5 L5.5 5.5 M5.5 -5.5 L-5.5 5.5" fill="none" strokeWidth="2.4" />
    </g>
  ),
  rally: (
    <g>
      <path d="M-3 6 v-11" fill="none" />
      <path d="M-3 -5 q5 1 8 -1 q-2 4 0 6 q-4 1 -8 -1 z" />
    </g>
  ),
};

export default function ActivityBadge({ activity, y = -24 }) {
  const spec = ACTIVITIES[activity];
  if (!spec) return null;
  const glyph = GLYPHS[activity];

  return (
    <g transform={`translate(0,${y})`} pointerEvents="none">
      {/* pulsing halo so the eye is pulled to whatever just acted */}
      <circle r="12" fill={spec.tone} opacity="0.16">
        <animate attributeName="r" values="9;15;9" dur="1.1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.26;0.04;0.26" dur="1.1s" repeatCount="indefinite" />
      </circle>
      <circle r="9" fill="#15181B" stroke={spec.tone} strokeWidth="1.6" />
      <g fill={spec.tone} stroke={spec.tone} strokeWidth="1.5" strokeLinecap="round">
        {glyph}
      </g>
      {/* stencilled call-out under the badge */}
      <g transform="translate(0,13)">
        <rect x="-21" y="-4.6" width="42" height="9" fill="#15181B" stroke={spec.tone} strokeWidth="0.8" />
        <text y="2.3" className="font-mono" fontSize="5.6" fill={spec.tone} textAnchor="middle">
          {spec.short}
        </text>
      </g>
    </g>
  );
}