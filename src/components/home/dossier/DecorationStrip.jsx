import React from "react";
import CommandTip from "@/components/ui/CommandTip";

// Decoration bar — awarded ribbons struck in brass, unearned ones left as empty mounts.
export default function DecorationStrip({ decorations = [] }) {
  const earned = decorations.filter((d) => d.earned).length;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="font-mono text-[8px] text-muted-foreground tracking-[0.2em]">DECORATIONS</p>
        <span className="font-mono text-[8px] text-brass/70">{earned}/{decorations.length}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {decorations.map((d) => (
          <CommandTip key={d.id} title={d.label} body={d.earned ? `Awarded — ${d.req}.` : `Not yet awarded — ${d.req}.`} side="top">
            <span
              className={`flex items-center justify-center w-6 h-6 rounded-sm border text-xs ${
                d.earned
                  ? "border-brass/70 bg-brass/15 text-brass-bright shadow-[0_0_6px_rgba(0,0,0,0.5)]"
                  : "border-dashed border-border text-muted-foreground/35 bg-background/40"
              }`}
            >
              {d.icon}
            </span>
          </CommandTip>
        ))}
      </div>
    </div>
  );
}