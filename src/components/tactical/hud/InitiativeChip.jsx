import React from "react";
import { HelpCircle } from "lucide-react";
import { PLATE_URLS } from "@/lib/imagePlates";
import { UNIT_TYPES } from "@/lib/tactical/orbat";

// One slot in the acting queue. A hostile stand nobody can see prints as an
// unknown plate: no portrait, no name, no position — only that something out
// there is due to move.
export default function InitiativeChip({ entry, index, seen, active, onPick }) {
  const { stand, score, spent } = entry;
  const type = UNIT_TYPES[stand.type];
  const edge = stand.side === "attacker" ? "border-rust" : "border-steel";

  if (!seen) {
    return (
      <div
        className="w-[52px] shrink-0 border border-dashed border-border/70 bg-background/60 rounded-sm px-1 py-1 text-center opacity-70"
        title="Unobserved — an enemy formation is due to act"
      >
        <p className="font-mono text-[8px] text-muted-foreground">{index + 1}</p>
        <div className="h-9 flex items-center justify-center">
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="font-mono text-[7px] tracking-widest text-muted-foreground">UNKNOWN</p>
      </div>
    );
  }

  const url = PLATE_URLS[type.token];

  return (
    <button
      onClick={() => onPick(stand)}
      title={`${stand.name} — initiative ${score}`}
      className={`w-[52px] shrink-0 border-t-2 ${edge} bg-card/85 rounded-sm px-1 py-1 text-center cq-metal
        ${active ? "ring-1 ring-brass-bright" : ""} ${spent ? "opacity-45" : ""}`}
    >
      <div className="flex items-center justify-between px-0.5">
        <span className="font-mono text-[8px] text-muted-foreground">{index + 1}</span>
        <span className="font-mono text-[8px] text-brass-bright">{score}</span>
      </div>
      {url ? (
        <img src={url} alt="" className="w-full h-9 object-cover rounded-sm" />
      ) : (
        <div className="w-full h-9 bg-secondary rounded-sm" />
      )}
      <p className="font-mono text-[7px] leading-tight truncate text-foreground/90 mt-0.5">
        {spent ? "SPENT" : stand.name.split(" ")[0].toUpperCase()}
      </p>
    </button>
  );
}