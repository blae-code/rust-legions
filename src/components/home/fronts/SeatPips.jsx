import React from "react";
import CommandTip from "@/components/ui/CommandTip";

// Muster board seat strip — one riveted lozenge per command chair at the table.
const STATE_TIP = {
  claimed: "Seat claimed by a commander",
  open: "Chair empty — awaiting a commander",
  npc: "Held by a Ministry-run faction",
};

export default function SeatPips({ seats = [] }) {
  return (
    <div className="flex items-center gap-1">
      {seats.map((s, i) => (
        <CommandTip key={i} title={s.factionName || `Seat ${i + 1}`} body={STATE_TIP[s.state]} side="top">
          <span
            className={`block w-3.5 h-2 rounded-[2px] border shrink-0 ${
              s.state === "claimed"
                ? "border-brass/70"
                : s.state === "npc"
                ? "border-steel/50 bg-steel/25"
                : "border-dashed border-brass/40 bg-transparent"
            }`}
            style={s.state === "claimed" ? { background: s.color || "hsl(var(--brass))" } : undefined}
          />
        </CommandTip>
      ))}
    </div>
  );
}