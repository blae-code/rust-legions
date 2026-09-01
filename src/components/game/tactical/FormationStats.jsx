import React from "react";
import CommandTip from "@/components/ui/CommandTip";
import { ACTIONS, SIZE, deriveFormation } from "@/lib/tactical/data";

// Derived fighting values — the same file-card stat grid as the Service Dossier
export default function FormationStats({ troops }) {
  const d = deriveFormation(troops);
  const cells = [
    ["COMPANIES", d.size, `Command limit ${SIZE.commandLimit}. Beyond it, orders slow.`],
    ["PACE", d.pace, "Slowest element sets the march. Every 5 companies drag it by one."],
    ["REACH", d.reach, "Farthest gun in the formation sets engagement range."],
    ["ATTACK", d.attack, "Combined firepower before size and order multipliers."],
    ["DEFENSE", d.defense, "Combined resilience before size and cover multipliers."],
    ["INITIATIVE", d.initiative, "Pace ×10, plus 3 per scout section. Highest acts first."],
  ];
  return (
    <div>
      <div className="grid grid-cols-3 gap-1.5">
        {cells.map(([label, value, tip]) => (
          <CommandTip key={label} title={label} body={tip} side="top">
            <div className="border border-border rounded-sm bg-background/50 px-2 py-1.5">
              <p className="font-mono text-[7px] text-muted-foreground tracking-[0.18em] truncate">{label}</p>
              <p className={`font-display text-lg leading-none mt-0.5 ${label === "COMPANIES" && d.strained ? "text-rust" : "text-brass-bright"}`}>{value}</p>
            </div>
          </CommandTip>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 mt-2 min-h-[18px]">
        {d.actions.map((a) => (
          <CommandTip key={a} title={ACTIONS[a].label} body={ACTIONS[a].desc} side="top">
            <span className={`cq-tag ${ACTIONS[a].requires ? "text-brass border-brass/50" : "text-muted-foreground border-border"}`}>{ACTIONS[a].label}</span>
          </CommandTip>
        ))}
      </div>
      {d.strained && (
        <p className="font-mono text-[8px] text-rust tracking-[0.15em] mt-1.5">⚠ OVERSIZED — CANNOT DISPLACE AND EXECUTE A SPECIAL ORDER IN THE SAME TURN</p>
      )}
    </div>
  );
}