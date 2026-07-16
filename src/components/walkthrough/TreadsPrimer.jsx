import React from "react";

const RULES = [
  { icon: "⚙", head: "An engine is required", text: "Without Crawler Drives or Leviathan Turbines fitted in the Engine Bay, the base cannot move at all." },
  { icon: "⛽", head: "Each march burns 2 Fuel", text: "The great treads move one zone per turn, only through territory you control." },
  { icon: "⛰", head: "Rough ground needs Turbines", text: "Mountains, highlands and marsh will stop Crawler Drives — only Leviathan Turbines cross them." },
  { icon: "❄", head: "Snow freezes the engines", text: "In falling snow the base cannot move. Watch the weather before committing to a march." },
  { icon: "🔥", head: "Lose the zone, lose the base", text: "If an enemy captures the zone your base stands in, it is overrun and burns — it is your supply hub and income anchor, so screen it with troops." },
];

// Rules-of-the-road briefing for moving the fortress-base
export default function TreadsPrimer() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-secondary-foreground font-body leading-relaxed">
        Your fortress-base is not a capital that waits to be taken — it marches with the war.
        Wherever it stands on friendly ground it acts as a prime supply hub, adds its hull defense to the zone, and runs its on-board works.
      </p>
      <div className="space-y-2">
        {RULES.map((r) => (
          <div key={r.head} className="flex gap-3 border border-border bg-secondary/30 rounded-sm px-3 py-2">
            <span className="text-lg leading-none pt-0.5">{r.icon}</span>
            <div>
              <p className="font-heading text-sm tracking-wide text-brass-bright">{r.head}</p>
              <p className="text-[11px] text-muted-foreground">{r.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}