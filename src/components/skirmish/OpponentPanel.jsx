import React from "react";

const DOCTRINES = [
  { key: "aggressive", label: "Aggressive", note: "Storm troops and crawlers. Comes straight at you." },
  { key: "defensive", label: "Defensive", note: "Line rifles, provosts and guns. Holds and shoots." },
  { key: "economic", label: "Attritional", note: "Levies in mass, with batteries behind them." },
];

// Who is on the other end of the wire. Machine commanders buy to doctrine.
export default function OpponentPanel({ doctrine, onDoctrine }) {
  return (
    <div className="space-y-1.5">
      {DOCTRINES.map((d) => (
        <button
          key={d.key}
          onClick={() => onDoctrine(d.key)}
          className={`w-full cq-metal p-2 rounded-sm border text-left transition-colors ${
            doctrine === d.key ? "border-brass bg-brass/10" : "border-border hover:border-brass/60"
          }`}
        >
          <p className={`font-heading uppercase tracking-widest text-[11px] ${
            doctrine === d.key ? "text-brass-bright" : "text-secondary-foreground"
          }`}>
            {d.label}
          </p>
          <p className="text-[10px] text-muted-foreground leading-snug">{d.note}</p>
        </button>
      ))}
      <p className="font-mono text-[9px] text-muted-foreground/70 tracking-widest pt-1">
        HUMAN OPPONENTS &amp; CO-OP SEATS — NEXT DISPATCH
      </p>
    </div>
  );
}