import React, { useMemo, useState } from "react";
import MinistryChart from "@/components/chart/MinistryChart";
import { WORLDS } from "@/lib/macro/worlds";

// The chart as it stood at the armistice — fog lifted, every holding inked in
export default function FinalMapPanel({ game }) {
  const macro = game.macro || {};
  const [hovered, setHovered] = useState(null);

  const world = useMemo(
    () => ({
      nodes: macro.nodes || [],
      routes: macro.routes || [],
      continents: macro.continents || [],
      size: macro.size,
    }),
    [macro.nodes, macro.routes, macro.continents, macro.size]
  );

  const control = macro.control || {};
  const slotColors = Object.fromEntries((game.factions || []).map((f) => [f.slotIndex, f.color]));
  const tally = (game.factions || []).map((f) => ({
    ...f,
    held: Object.values(control).filter((s) => s === f.slotIndex).length,
  }));
  const totalHeld = tally.reduce((sum, f) => sum + f.held, 0) || 1;

  if (!world.nodes.length) {
    return (
      <p className="font-mono text-[10px] text-muted-foreground">NO CHART WAS FILED FOR THIS FRONT.</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="cq-brackets relative overflow-hidden rounded-sm border border-border">
        <MinistryChart
          world={world}
          palette={WORLDS.find((w) => w.id === game.planetId)?.palette}
          control={control}
          slotColors={slotColors}
          observed={null}
          columns={macro.columns || []}
          bases={macro.bases || []}
          mySlot={game.mySlot}
          hovered={hovered}
          onHoverNode={setHovered}
          nodeTip={(n) => {
            const held = control[n.id];
            return held !== undefined && held !== null
              ? `held by ${game.factions[held]?.factionName || "?"} at the armistice`
              : "never claimed";
          }}
          height="46vh"
        />
        <div className="cq-scanlines absolute inset-0 pointer-events-none" />
        <div className="cq-vignette absolute inset-0 pointer-events-none" />
      </div>

      {/* Final division of the continent */}
      <div>
        <div className="flex h-2.5 rounded-sm overflow-hidden border border-border">
          {tally.filter((f) => f.held > 0).map((f) => (
            <span key={f.slotIndex} style={{ background: f.color, width: `${(f.held / totalHeld) * 100}%` }} title={`${f.factionName} — ${f.held} sites`} />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
          {tally.map((f) => (
            <span key={f.slotIndex} className="flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground tracking-widest">
              <span className="w-2 h-2 rounded-full ring-1 ring-black/50" style={{ background: f.color }} />
              {f.factionName.toUpperCase()} · {f.held} SITES
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}