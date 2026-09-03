import React from "react";
import { TERRAIN } from "@/lib/tactical/field";

const Stat = ({ k, v }) => (
  <div className="flex justify-between gap-3">
    <span className="cq-label">{k}</span>
    <span className="font-mono text-[10px] text-brass tracking-widest">{v}</span>
  </div>
);

// Reads the hovered hex back off the generated field — the numbers the engine
// will actually resolve against, not a restatement of them.
export default function TileInspector({ tile }) {
  if (!tile) {
    return (
      <p className="font-mono text-[10px] text-muted-foreground tracking-widest">
        PASS A GLASS OVER THE GROUND —
      </p>
    );
  }
  const t = TERRAIN[tile.terrain];
  return (
    <div className="space-y-1.5">
      <p className="cq-display text-base leading-none">{t.label}</p>
      <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">{t.blurb}</p>
      <div className="cq-hazard my-2" />
      <Stat k="Hex" v={`${tile.q},${tile.r}`} />
      <Stat k="Cover" v={tile.cover} />
      <Stat k="Entry Cost" v={tile.moveCost === null ? "IMPASSABLE" : tile.moveCost} />
      <Stat k="Blocks Sight" v={tile.blocksLOS ? "YES" : "NO"} />
      <Stat k="Elevation" v={["Ground", "Rise", "Crest"][tile.elev]} />
      {tile.work && <Stat k="Work" v={tile.work.toUpperCase()} />}
    </div>
  );
}