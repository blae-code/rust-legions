import React from "react";
import { Gem, Shovel } from "lucide-react";
import { RELICS, RELIC_SETS } from "@/lib/relics";
import RelicSetCard from "@/components/game/relics/RelicSetCard";

// The Reliquary — the precursor tech hunt at a glance: excavation progress,
// recovered works and the matched sets that grant standing faction bonuses.
export default function RelicVault({ game }) {
  if (!game?.myRelics) return null;
  const mine = game.myRelics;
  const held = mine.map((r) => r.id);
  const sets = game.myRelicSets || [];
  const total = game.relicTotal || 0;
  const pct = total ? Math.round((mine.length / total) * 100) : 0;
  const surveyed = (game.macro?.relicSites || []).filter((s) => !s.found).length;

  return (
    <div className="cq-panel p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Gem className="w-3.5 h-3.5 text-brass" />
        <p className="cq-label">The Reliquary</p>
        <span className="ml-auto font-mono text-[9px] text-muted-foreground tracking-widest">
          {mine.length}/{total} RECOVERED
        </span>
      </div>

      {/* Excavation progress */}
      <div>
        <div className="h-1.5 w-full bg-secondary rounded-sm overflow-hidden border border-border">
          <div className="h-full bg-brass transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-1">
          {pct}% OF THE HUNT · {game.relicsFound || 0} SITE{(game.relicsFound || 0) === 1 ? "" : "S"} BROKEN OPEN WORLDWIDE
        </p>
      </div>

      {mine.length === 0 ? (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          No precursor technology recovered. Combine-age caches lie sealed beneath the deep ruins —
          take one and your engineers will break it open.
        </p>
      ) : (
        <div className="space-y-1.5">
          {mine.map((r) => (
            <div key={r.id} className="border border-brass/40 bg-brass/5 rounded-sm px-2.5 py-1.5">
              <p className="font-heading uppercase tracking-[0.14em] text-xs text-brass-bright">
                {r.label || RELICS[r.id]?.label || r.id}
              </p>
              <p className="font-mono text-[9px] text-muted-foreground tracking-wider">{RELICS[r.id]?.effect}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5 border-t border-border pt-2">
        <p className="cq-label">Matched Sets</p>
        {Object.entries(RELIC_SETS).map(([id, set]) => (
          <RelicSetCard key={id} set={set} held={held} complete={sets.includes(id)} />
        ))}
      </div>

      {surveyed > 0 && (
        <p className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono tracking-wider">
          <Shovel className="w-3 h-3 text-brass" /> {surveyed} SURVEYED DIG SITE{surveyed === 1 ? "" : "S"} IN REACH
        </p>
      )}
    </div>
  );
}