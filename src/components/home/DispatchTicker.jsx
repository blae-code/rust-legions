import React from "react";
import { Radio } from "lucide-react";

const WIRES = [
  "FOUNDRY OUTPUT UP 12% IN THE EASTERN MARCHES",
  "FUEL CONVOYS REROUTED THROUGH THE PALE — EXPECT DELAYS",
  "UNCONFIRMED: CRAWLER COLUMNS MASSING BEYOND THE FOG LINE",
  "MINISTRY OF HERALDRY NOW ACCEPTING NEW FACTION REGISTRATIONS",
  "HOLD 60% OF THE CONTINENT OR TAKE EVERY CAPITAL — HIGH COMMAND",
  "WEATHER OVER SECTOR IX: SMOKE, FALLING ASH, VISIBILITY POOR",
];

export default function DispatchTicker() {
  const line = WIRES.map((w) => `⁜ ${w}`).join("   ···   ") + "   ···   ";
  return (
    <div className="border border-border rounded-sm bg-card/80 overflow-hidden flex items-center">
      <div className="flex items-center gap-2 px-4 py-1.5 border-r border-border bg-secondary/60 shrink-0 z-10">
        <Radio className="w-3 h-3 text-rust animate-pulse" />
        <span className="font-mono text-[10px] text-brass-bright tracking-widest">WAR WIRE</span>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="cq-ticker-track py-1.5">
          <span className="font-mono text-[10px] text-muted-foreground tracking-wider whitespace-nowrap pr-8">{line}</span>
          <span className="font-mono text-[10px] text-muted-foreground tracking-wider whitespace-nowrap pr-8">{line}</span>
        </div>
      </div>
    </div>
  );
}