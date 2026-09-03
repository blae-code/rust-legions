import React from "react";
import { PALETTES, WEATHER_FIELD } from "@/lib/tactical/field";

// One filed scenario, as a stamped index card in the scenario drawer.
export default function ScenarioCard({ scenario, active, onPick }) {
  const ground = PALETTES[scenario.nodeKind];
  const sky = WEATHER_FIELD[scenario.weather];

  return (
    <button
      onClick={() => onPick(scenario.id)}
      className={`text-left w-full cq-metal p-3 rounded-sm border transition-colors ${
        active ? "border-brass bg-brass/10" : "border-border hover:border-brass/60"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className={`cq-display text-base leading-none ${active ? "text-brass-bright" : "text-foreground"}`}>
          {scenario.name}
        </p>
        <span className="font-mono text-[9px] text-muted-foreground tracking-widest shrink-0">{scenario.sheet}</span>
      </div>
      <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-1">
        {ground.label.toUpperCase()} · {sky.label.toUpperCase()} · WORKS {scenario.fortBonus} ·{" "}
        <span className="text-brass">{scenario.points} PTS</span>
      </p>
      <p className="text-xs text-secondary-foreground/80 mt-1.5 leading-snug">{scenario.blurb}</p>
    </button>
  );
}