import React from "react";
import { TERRAIN_DEF, slopeMod } from "@/lib/combatMods";

// Pre-attack readout of every modifier the engine will apply
export default function CombatOdds({ game, fromTile, target }) {
  if (!target || target.isSea || target.visible === false) return null;
  const rows = [];
  const slope = slopeMod(fromTile, target);
  const terr = TERRAIN_DEF[target.terrain] || 0;
  const fort = (target.state?.buildings || []).find((b) => b.type === "fortifications" && (b.level || 0) > 0)?.level || 0;
  const w = game.weather || "clear";
  if (slope < 0) rows.push({ t: "Uphill assault", v: "ATT −1", bad: true });
  if (slope > 0) rows.push({ t: "Downhill attack", v: "ATT +1", bad: false });
  if (terr > 0) rows.push({ t: `${target.terrain} favors defense`, v: `DEF +${terr}`, bad: true });
  if (fort > 0) rows.push({ t: "Fortifications", v: `DEF +${fort}`, bad: true });
  if (w === "rain") rows.push({ t: "Driving rain", v: "ATT −1", bad: true });
  if (w === "fog") rows.push({ t: "Heavy fog blinds defense", v: "DEF −1", bad: false });
  if (rows.length === 0) return null;
  return (
    <div className="border border-border rounded-sm bg-background/50 p-2 space-y-0.5">
      <p className="cq-label">Battle Conditions</p>
      {rows.map((r, i) => (
        <div key={i} className="flex justify-between font-mono text-[10px]">
          <span className="text-muted-foreground uppercase">{r.t}</span>
          <span className={r.bad ? "text-rust" : "text-olive"}>{r.v}</span>
        </div>
      ))}
    </div>
  );
}