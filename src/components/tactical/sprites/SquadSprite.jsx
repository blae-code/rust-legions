import React, { useEffect, useState } from "react";
import { ANIM, HOLDS_LAST, kitFor } from "@/lib/tactical/spriteAnim";
import InfantryRig from "./InfantryRig";

// Drives one stand's animation and lays its representative figures out on the
// hex. Figures are phase-offset so a rank never moves as one body.
function Figure({ frames, holds, phase, kit, x }) {
  const [i, setI] = useState(phase % frames.length);

  useEffect(() => setI(phase % frames.length), [frames, phase]);

  useEffect(() => {
    if (holds && i === frames.length - 1) return;
    const t = setTimeout(() => setI((n) => (n + 1) % frames.length), frames[i].d);
    return () => clearTimeout(t);
  }, [i, frames, holds]);

  return (
    <g transform={`translate(${x},0)`}>
      <InfantryRig pose={frames[i]} kit={kit} />
    </g>
  );
}

export default function SquadSprite({ type, state = "idle", facing = "right", scale = 0.62 }) {
  const kit = kitFor(type);
  const frames = ANIM[state] || ANIM.idle;
  const holds = HOLDS_LAST.indexOf(state) !== -1;
  const n = kit.figures;
  const spread = 5.4;

  return (
    <g transform={`scale(${facing === "left" ? -scale : scale},${scale})`}>
      {/* ground shadow keeps the rank sitting in the hex rather than over it */}
      <ellipse cx="0" cy="1" rx={spread * n * 0.5 + 4} ry="2.6" fill="hsl(0 0% 0% / 0.4)" />
      {Array.from({ length: n }).map((_, k) => (
        <Figure
          key={k}
          frames={frames}
          holds={holds}
          phase={k}
          kit={kit}
          x={(k - (n - 1) / 2) * spread}
        />
      ))}
    </g>
  );
}