import React, { useMemo } from "react";
import { hexPixel, neighbors } from "@/lib/tactical/field";
import { INK, NETWORK_GROUPS } from "@/lib/tactical/topoStyle";

// Roads, rails and watercourses are LINEAR features: a chain of hexes drawn as
// one continuous run across the sheet, centre to centre, rather than a texture
// stamped inside each hex. That is what makes a survey map read as a map.
const linksFor = (field, keys, size) => {
  const out = [];
  for (let q = 0; q < field.w; q++) {
    for (let r = 0; r < field.h; r++) {
      const tile = field.tiles[`${q},${r}`];
      if (!tile || keys.indexOf(tile.terrain) === -1) continue;
      const a = hexPixel(q, r, size);
      for (const nb of neighbors(q, r)) {
        // one line per pair
        if (nb.q < q || (nb.q === q && nb.r < r)) continue;
        const other = field.tiles[`${nb.q},${nb.r}`];
        if (!other || keys.indexOf(other.terrain) === -1) continue;
        const b = hexPixel(nb.q, nb.r, size);
        out.push({ id: `${q},${r}-${nb.q},${nb.r}`, ...a, x2: b.x, y2: b.y });
      }
      // an isolated hex still gets a stub, so a lone ford or lane is visible
      out.push({ id: `s${q},${r}`, x: a.x, y: a.y, x2: a.x + 0.01, y2: a.y });
    }
  }
  return out;
};

const Run = ({ links, ...props }) => (
  <g {...props}>
    {links.map((l) => (
      <line key={l.id} x1={l.x} y1={l.y} x2={l.x2} y2={l.y2} />
    ))}
  </g>
);

export default function TopoNetwork({ field, size }) {
  const roads = useMemo(() => linksFor(field, NETWORK_GROUPS.road, size), [field, size]);
  const rails = useMemo(() => linksFor(field, NETWORK_GROUPS.rail, size), [field, size]);
  const water = useMemo(() => linksFor(field, NETWORK_GROUPS.water, size), [field, size]);

  return (
    <g pointerEvents="none">
      {/* watercourses first — a river runs under every bridge */}
      <Run links={water} stroke={INK.water} strokeWidth={size * 0.5} strokeLinecap="round" opacity="0.35" />
      <Run links={water} stroke={INK.water} strokeWidth={size * 0.22} strokeLinecap="round" opacity="0.7" />

      {/* metalled road — ink casing, pale metalling, dashed centre line */}
      <Run links={roads} stroke={INK.line} strokeWidth={size * 0.42} strokeLinecap="round" opacity="0.55" />
      <Run links={roads} stroke="#E4D6AE" strokeWidth={size * 0.28} strokeLinecap="round" opacity="0.9" />
      <Run
        links={roads}
        stroke={INK.line}
        strokeWidth="0.8"
        strokeDasharray="4 4"
        strokeLinecap="butt"
        opacity="0.5"
      />

      {/* rail — running line with sleeper ticks */}
      <Run links={rails} stroke={INK.line} strokeWidth={size * 0.16} strokeLinecap="round" opacity="0.85" />
      <Run
        links={rails}
        stroke="#E4D6AE"
        strokeWidth={size * 0.16}
        strokeDasharray="2 4"
        strokeLinecap="butt"
        opacity="0.9"
      />
    </g>
  );
}