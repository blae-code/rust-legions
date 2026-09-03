import React from "react";

const SIDES = [
  { key: "attacker", label: "Attack", note: "West strip. You must cross the ground." },
  { key: "defender", label: "Defend", note: "East strip. The works are yours." },
];

// Which end of the sheet the commander takes the field from.
export default function SideChoice({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SIDES.map((s) => (
        <button
          key={s.key}
          onClick={() => onChange(s.key)}
          className={`cq-metal p-2.5 rounded-sm border text-left transition-colors ${
            value === s.key ? "border-brass bg-brass/10" : "border-border hover:border-brass/60"
          }`}
        >
          <p className={`cq-display text-sm ${value === s.key ? "text-brass-bright" : "text-foreground"}`}>
            {s.label}
          </p>
          <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{s.note}</p>
        </button>
      ))}
    </div>
  );
}