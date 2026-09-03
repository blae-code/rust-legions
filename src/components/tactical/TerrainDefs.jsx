import React from "react";

// SVG texture patterns — one per TerrainKey in the field generator's vocabulary.
// Each is referenced as url(#tx_<key>) and layered OVER the terrain's flat fill,
// so the token palette still drives the base colour and these only add grit.
const S = { strokeLinecap: "round", fill: "none" };

export default function TerrainDefs() {
  return (
    <defs>
      {/* open — ploughed flat, faint tilth */}
      <pattern id="tx_open" width="9" height="9" patternUnits="userSpaceOnUse">
        <path d="M0 7 h9" stroke="hsl(40 8% 84% / 0.07)" strokeWidth="1" {...S} />
      </pattern>

      {/* road — metalled, cambered centre line */}
      <pattern id="tx_road" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M0 5 h10" stroke="hsl(40 20% 54% / 0.22)" strokeWidth="1.6" {...S} />
        <circle cx="3" cy="2" r="0.5" fill="hsl(0 0% 0% / 0.25)" />
        <circle cx="8" cy="8" r="0.5" fill="hsl(0 0% 0% / 0.25)" />
      </pattern>

      {/* rail — sleepers and two running rails */}
      <pattern id="tx_rail" width="7" height="10" patternUnits="userSpaceOnUse">
        <path d="M0 3 h7 M0 7 h7" stroke="hsl(210 8% 48% / 0.5)" strokeWidth="1.1" {...S} />
        <path d="M2 1 v8" stroke="hsl(26 22% 18% / 0.55)" strokeWidth="2" {...S} />
      </pattern>

      {/* field — standing crop in rows */}
      <pattern id="tx_field" width="6" height="8" patternUnits="userSpaceOnUse">
        <path d="M1 8 v-4 M4 8 v-6" stroke="hsl(80 22% 62% / 0.35)" strokeWidth="1" {...S} />
      </pattern>

      {/* rubble — poured-in masonry chips */}
      <pattern id="tx_rubble" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect x="1" y="2" width="2.6" height="1.8" fill="hsl(40 8% 84% / 0.16)" />
        <rect x="6" y="6" width="2.2" height="2.2" fill="hsl(40 8% 84% / 0.12)" />
        <rect x="4" y="1" width="1.6" height="1.4" fill="hsl(0 0% 0% / 0.3)" />
      </pattern>

      {/* ruins — roofless shells, window lines */}
      <pattern id="tx_ruins" width="12" height="12" patternUnits="userSpaceOnUse">
        <path d="M2 11 v-6 h4 v6 M8 11 v-4 h3 v4" stroke="hsl(40 8% 84% / 0.24)" strokeWidth="1.2" {...S} />
        <rect x="3" y="6" width="1.4" height="1.6" fill="hsl(0 0% 0% / 0.45)" />
      </pattern>

      {/* building — standing block, brick courses and a lit window */}
      <pattern id="tx_building" width="10" height="8" patternUnits="userSpaceOnUse">
        <path d="M0 4 h10 M0 8 h10" stroke="hsl(40 8% 84% / 0.13)" strokeWidth="0.9" {...S} />
        <path d="M5 0 v4 M2 4 v4 M8 4 v4" stroke="hsl(40 8% 84% / 0.10)" strokeWidth="0.9" {...S} />
        <rect x="6" y="1" width="2" height="2" fill="hsl(41 78% 58% / 0.28)" />
      </pattern>

      {/* wall — mortared Ministry masonry, impassable */}
      <pattern id="tx_wall" width="8" height="6" patternUnits="userSpaceOnUse">
        <path d="M0 3 h8" stroke="hsl(0 0% 0% / 0.4)" strokeWidth="1.2" {...S} />
        <path d="M4 0 v3 M0 3 v3 M8 3 v3" stroke="hsl(0 0% 0% / 0.35)" strokeWidth="1.2" {...S} />
      </pattern>

      {/* woods — standing timber, canopy blobs */}
      <pattern id="tx_woods" width="11" height="11" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="2.4" fill="hsl(80 14% 26% / 0.75)" />
        <circle cx="8" cy="7.5" r="2.8" fill="hsl(80 14% 22% / 0.8)" />
        <path d="M3 5.4 v2 M8 10.3 v1.6" stroke="hsl(26 22% 14% / 0.7)" strokeWidth="1" {...S} />
      </pattern>

      {/* hedgerow — banked earth under thorn */}
      <pattern id="tx_hedgerow" width="9" height="9" patternUnits="userSpaceOnUse">
        <path d="M0 6 q2.2 -3 4.5 0 q2.2 3 4.5 0" stroke="hsl(80 14% 24% / 0.8)" strokeWidth="2.2" {...S} />
      </pattern>

      {/* crater — rim-high, already dug */}
      <pattern id="tx_crater" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="7" cy="7" r="4.4" fill="hsl(0 0% 0% / 0.4)" />
        <circle cx="7" cy="7" r="4.4" stroke="hsl(40 20% 54% / 0.3)" strokeWidth="1.2" fill="none" />
        <circle cx="7" cy="7" r="1.6" fill="hsl(0 0% 0% / 0.5)" />
      </pattern>

      {/* water — depth unrecorded */}
      <pattern id="tx_water" width="12" height="8" patternUnits="userSpaceOnUse">
        <path d="M0 3 q3 -2 6 0 q3 2 6 0" stroke="hsl(210 40% 78% / 0.28)" strokeWidth="1.1" {...S} />
        <path d="M0 7 q3 -2 6 0 q3 2 6 0" stroke="hsl(210 40% 78% / 0.16)" strokeWidth="1" {...S} />
      </pattern>

      {/* marsh — sucking ground, reeds */}
      <pattern id="tx_marsh" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M2 9 v-4 M4 9 v-6 M6 9 v-3" stroke="hsl(80 12% 46% / 0.5)" strokeWidth="0.9" {...S} />
        <path d="M0 9 h10" stroke="hsl(210 30% 60% / 0.2)" strokeWidth="1.4" {...S} />
      </pattern>

      {/* hill — contour rings */}
      <pattern id="tx_hill" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="7" cy="7" r="5.5" stroke="hsl(40 20% 54% / 0.3)" strokeWidth="1" fill="none" />
        <circle cx="7" cy="7" r="2.6" stroke="hsl(40 20% 54% / 0.22)" strokeWidth="1" fill="none" />
      </pattern>

      {/* fuel_tank — riveted drum, cover until it is not */}
      <pattern id="tx_fuel_tank" width="12" height="12" patternUnits="userSpaceOnUse">
        <rect x="2.5" y="2" width="7" height="8" rx="1" fill="hsl(4 68% 46% / 0.5)" stroke="hsl(26 22% 12% / 0.7)" strokeWidth="1" />
        <path d="M2.5 5 h7 M2.5 7.5 h7" stroke="hsl(26 22% 12% / 0.5)" strokeWidth="0.8" {...S} />
      </pattern>

      {/* precursor_wall — seamless, unweathered, uncuttable */}
      <pattern id="tx_precursor_wall" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="10" height="10" fill="hsl(210 20% 30% / 0.35)" />
        <path d="M0 5 h10 M5 0 v10" stroke="hsl(190 60% 70% / 0.22)" strokeWidth="0.7" {...S} />
      </pattern>
    </defs>
  );
}