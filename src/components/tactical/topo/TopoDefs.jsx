import React from "react";
import { INK } from "@/lib/tactical/topoStyle";

// Survey-sheet fills: paper grain, hachure, stipple and hydrographic hatching.
// Referenced as url(#topo_*) and layered over each hex's paper tint.
const S = { fill: "none", strokeLinecap: "round" };

export default function TopoDefs() {
  return (
    <defs>
      {/* the sheet itself — laid paper with a faint stain */}
      <pattern id="topo_paper" width="64" height="64" patternUnits="userSpaceOnUse">
        <rect width="64" height="64" fill="#C4B899" />
        <path d="M0 12 h64 M0 30 h64 M0 49 h64" stroke="#00000009" strokeWidth="1" {...S} />
        <path d="M17 0 v64 M43 0 v64" stroke="#00000007" strokeWidth="1" {...S} />
      </pattern>

      {/* woods — stippled canopy, the surveyor's dot-and-tuft */}
      <pattern id="topo_woods" width="10" height="10" patternUnits="userSpaceOnUse">
        <circle cx="2.5" cy="3" r="1.5" fill={INK.green} opacity="0.5" />
        <circle cx="7" cy="7.5" r="1.8" fill={INK.green} opacity="0.45" />
        <circle cx="8" cy="2" r="1" fill={INK.green} opacity="0.35" />
      </pattern>

      {/* standing crop — ruled tilth */}
      <pattern id="topo_field" width="7" height="7" patternUnits="userSpaceOnUse">
        <path d="M0 6 h7" stroke={INK.green} strokeWidth="0.6" opacity="0.35" {...S} />
      </pattern>

      {/* water — engraved ripple lines */}
      <pattern id="topo_water" width="12" height="7" patternUnits="userSpaceOnUse">
        <path d="M0 2 q3 -1.6 6 0 q3 1.6 6 0" stroke={INK.water} strokeWidth="0.7" opacity="0.55" {...S} />
        <path d="M0 5.5 q3 -1.6 6 0 q3 1.6 6 0" stroke={INK.water} strokeWidth="0.6" opacity="0.35" {...S} />
      </pattern>

      {/* marsh — reed ticks over a waterline */}
      <pattern id="topo_marsh" width="10" height="9" patternUnits="userSpaceOnUse">
        <path d="M0 7 h10" stroke={INK.water} strokeWidth="0.7" opacity="0.45" {...S} />
        <path d="M2 7 v-3 M5 7 v-4.5 M8 7 v-2.5" stroke={INK.green} strokeWidth="0.7" opacity="0.5" {...S} />
      </pattern>

      {/* built-up ground — block hatching */}
      <pattern id="topo_urban" width="6" height="6" patternUnits="userSpaceOnUse">
        <path d="M0 6 L6 0" stroke={INK.line} strokeWidth="0.6" opacity="0.35" {...S} />
      </pattern>

      {/* impassable masonry — dense cross hatch */}
      <pattern id="topo_solid" width="5" height="5" patternUnits="userSpaceOnUse">
        <path d="M0 5 L5 0 M0 0 L5 5" stroke={INK.line} strokeWidth="0.6" opacity="0.5" {...S} />
      </pattern>

      {/* high ground — hachure ticks down the slope */}
      <pattern id="topo_hachure" width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M2 1 v4 M6 3 v4" stroke={INK.contour} strokeWidth="0.7" opacity="0.55" {...S} />
      </pattern>

      {/* the map grid, ruled over everything */}
      <pattern id="topo_grid" width="26" height="26" patternUnits="userSpaceOnUse">
        <path d="M0 0 h26 M0 0 v26" stroke={INK.line} strokeWidth="0.5" opacity="0.28" {...S} />
      </pattern>
      <pattern id="topo_grid_coarse" width="130" height="130" patternUnits="userSpaceOnUse">
        <path d="M0 0 h130 M0 0 v130" stroke={INK.line} strokeWidth="1.1" opacity="0.34" {...S} />
      </pattern>
    </defs>
  );
}