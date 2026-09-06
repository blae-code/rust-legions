import React from "react";
import { Swords, Shuffle, MapPin } from "lucide-react";
import { UNIT_TYPES } from "@/lib/tactical/orbat";

// The stands you bought, waiting to go onto the ground. Pick one up, then
// click a hex in your deployment strip; a placed stand can be picked up again.
export default function DeploymentRack({ stands, placements, carry, onCarry, onAuto, onCommence }) {
  const left = stands.filter((s) => !placements[s.id]).length;
  return (
    <div className="cq-panel p-2.5 space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="cq-label text-rust">Deployment</p>
        <span className="font-mono text-[9px] text-muted-foreground tracking-widest">
          {stands.length - left} / {stands.length} PLACED
        </span>
      </div>
      <p className="font-mono text-[9px] text-muted-foreground tracking-widest leading-relaxed">
        {carry ? "CLICK A LIT HEX IN YOUR STRIP TO SET THE STAND DOWN" : "PICK A STAND FROM THE RACK OR OFF THE BOARD"}
      </p>
      <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
        {stands.map((s) => {
          const placed = placements[s.id];
          const held = carry === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onCarry(held ? null : s.id)}
              className={`cq-metal w-full flex items-center gap-2 px-2 py-1.5 rounded-sm border text-left ${
                held ? "border-brass bg-brass/10" : placed ? "border-border opacity-70" : "border-rust/50"
              }`}
            >
              <MapPin className={`w-3 h-3 shrink-0 ${placed ? "text-olive" : "text-rust"}`} />
              <span className="min-w-0 flex-1">
                <span className="block font-heading uppercase tracking-widest text-[10px] text-foreground truncate">{s.name}</span>
                <span className="block font-mono text-[8px] text-muted-foreground tracking-widest">
                  {UNIT_TYPES[s.type].label.toUpperCase()} · {placed ? `HEX ${placed.q},${placed.r}` : "IN RESERVE"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        <button onClick={onAuto} className="cq-metal flex items-center justify-center gap-1.5 rounded-sm border border-border py-2 font-heading uppercase tracking-widest text-[10px] text-secondary-foreground">
          <Shuffle className="w-3 h-3" /> Auto-Place
        </button>
        <button
          disabled={left > 0}
          onClick={onCommence}
          className="cq-metal flex items-center justify-center gap-1.5 rounded-sm border border-brass/60 bg-rust/80 py-2 font-display uppercase tracking-[0.15em] text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Swords className="w-3 h-3" /> Commence
        </button>
      </div>
    </div>
  );
}