import React from "react";

// Saved Army Designer sheets, offered as a starting kit for the force below.
export default function DesignSeedPicker({ designs, onSeed }) {
  if (designs.length === 0) {
    return (
      <p className="font-mono text-[10px] text-muted-foreground tracking-widest">
        NO SAVED DESIGNS ON FILE — BUY FROM THE ROSTER BELOW
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {designs.map((d) => (
        <button
          key={d.id}
          onClick={() => onSeed(d)}
          className="cq-metal font-heading uppercase tracking-widest text-[10px] px-2.5 py-1 rounded-sm border border-border text-secondary-foreground hover:border-brass/60"
          title={`${d.weapon} · ${d.armor} · ${d.support}`}
        >
          {d.name}
        </button>
      ))}
    </div>
  );
}