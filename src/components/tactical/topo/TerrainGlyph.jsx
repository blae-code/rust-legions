import React from "react";
import { INK } from "@/lib/tactical/topoStyle";

// Map symbols, drawn in ink at the centre of a hex. Faded enough to read as a
// printed sheet, sharp enough to name the ground at a glance.
const L = { fill: "none", stroke: INK.line, strokeWidth: 1, strokeLinecap: "round", strokeLinejoin: "round" };

const GLYPH = {
  // a chapel-roofed house with a chimney
  building: (
    <g {...L} opacity="0.75">
      <path d="M-7 5 v-7 l7 -4.5 l7 4.5 v7 z" fill={INK.line} fillOpacity="0.14" />
      <path d="M4 -4.5 v-3.5 h2.2 v4.8" />
      <rect x="-2.2" y="0" width="4.4" height="5" fill={INK.line} fillOpacity="0.3" stroke="none" />
    </g>
  ),
  // a works: shed roof and a smoking stack
  factory: (
    <g {...L} opacity="0.75">
      <path d="M-9 5 v-5 l4 -3 v3 l4 -3 v3 l4 -3 v8 z" fill={INK.line} fillOpacity="0.14" />
      <path d="M6 5 v-11 h2.6 v11" />
      <path d="M7.3 -7 q -2 -3 0 -5" opacity="0.5" />
    </g>
  ),
  // roofless shell — broken wall lines, the surveyor's ruin
  ruins: (
    <g {...L} opacity="0.7">
      <path d="M-8 5 v-6 h3.5 v6 M-1 5 v-8 h3 v4" />
      <path d="M5 5 v-4 h3.5" />
    </g>
  ),
  // fallen masonry
  rubble: (
    <g opacity="0.6" fill={INK.line}>
      <rect x="-7" y="1" width="3" height="2.2" />
      <rect x="-1" y="-2" width="2.6" height="2" />
      <rect x="4" y="2" width="3.4" height="2" />
      <rect x="1" y="3" width="2" height="1.6" />
    </g>
  ),
  // mountain / crest — the classic hachured peak pair
  mountain: (
    <g {...L} opacity="0.8" stroke={INK.contour} strokeWidth="1.2">
      <path d="M-9 5 l5 -8 l3.5 5 l2.5 -3.5 l7 6.5 z" fill={INK.contour} fillOpacity="0.18" />
      <path d="M-4 -3 l1.6 2.4 M4 -2 l1.6 2.4" strokeWidth="0.8" />
    </g>
  ),
  // rise — two contour rings
  hill: (
    <g {...L} stroke={INK.contour} opacity="0.75">
      <ellipse cx="0" cy="1" rx="10" ry="6" />
      <ellipse cx="0" cy="1" rx="5.5" ry="3" strokeWidth="0.8" />
    </g>
  ),
  // conifer pair
  woods: (
    <g {...L} stroke={INK.green} opacity="0.8">
      <path d="M-4 5 l3.5 -9 l3.5 9 z" fill={INK.green} fillOpacity="0.35" />
      <path d="M3 5 l2.6 -6 l2.6 6 z" fill={INK.green} fillOpacity="0.25" />
    </g>
  ),
  // hedge bank
  hedgerow: (
    <g {...L} stroke={INK.green} strokeWidth="1.6" opacity="0.7">
      <path d="M-9 2 q2.5 -3.5 5 0 q2.5 3.5 5 0 q2.5 -3.5 5 0" />
    </g>
  ),
  // shell crater
  crater: (
    <g {...L} opacity="0.65" strokeDasharray="2.5 2">
      <circle cx="0" cy="0" r="6.5" />
      <circle cx="0" cy="0" r="2.4" strokeDasharray="none" opacity="0.7" />
    </g>
  ),
  // fuel drum in plan, hazard-marked
  fuel_tank: (
    <g {...L} stroke={INK.red} opacity="0.8">
      <circle cx="0" cy="0" r="6" fill={INK.red} fillOpacity="0.16" />
      <path d="M-6 0 h12 M0 -6 v12" strokeWidth="0.7" />
    </g>
  ),
  // precursor work — an unbroken geometric run
  precursor_wall: (
    <g {...L} opacity="0.8">
      <rect x="-9" y="-4" width="18" height="8" fill={INK.line} fillOpacity="0.2" />
      <path d="M-9 0 h18 M-3 -4 v8 M3 -4 v8" strokeWidth="0.7" opacity="0.7" />
    </g>
  ),
  // compound wall — coursed masonry in plan
  wall: (
    <g {...L} opacity="0.8">
      <rect x="-10" y="-3" width="20" height="6" fill={INK.line} fillOpacity="0.35" />
      <path d="M-4 -3 v6 M3 -3 v6" strokeWidth="0.7" />
    </g>
  ),
};

// Some keys share a symbol, and a couple are decided by the hex's own elevation.
const FOR_TERRAIN = {
  building: "building",
  ruins: "ruins",
  rubble: "rubble",
  woods: "woods",
  hedgerow: "hedgerow",
  crater: "crater",
  hill: "hill",
  fuel_tank: "fuel_tank",
  precursor_wall: "precursor_wall",
  wall: "wall",
};

export default function TerrainGlyph({ tile, q = 0, r = 0 }) {
  // Every third standing block is drawn as a works, so a built-up sector reads
  // as a mixed quarter rather than a row of identical houses.
  let key = FOR_TERRAIN[tile.terrain];
  if (tile.terrain === "building" && (q + r) % 3 === 0) key = "factory";
  if (tile.elev === 2 && (!key || key === "hill")) key = "mountain";
  if (!key) return null;

  return GLYPH[key] || null;
}