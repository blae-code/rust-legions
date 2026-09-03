import React from "react";
import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";

// Shown in the arena while a requisitioned skirmish is being fought, so the
// commander knows this is their battle and not the standing sample engagement.
export default function BattleBanner({ order, onStand }) {
  return (
    <div className="cq-slip px-3 py-2 flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[9px] text-rust tracking-widest">SKIRMISH IN PROGRESS</p>
        <p className="cq-display text-base leading-none text-brass-bright truncate">{order.scenarioName}</p>
        <p className="text-[10px] text-muted-foreground leading-snug truncate">{order.objective}</p>
      </div>
      <span className="font-mono text-[9px] text-muted-foreground tracking-widest hidden sm:block">
        YOU ARE {order.side === "attacker" ? "ATTACKING" : "DEFENDING"}
      </span>
      <Link
        to="/skirmish"
        onClick={onStand}
        className="cq-metal flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1.5 font-heading uppercase tracking-widest text-[10px] text-secondary-foreground hover:border-rust"
      >
        <LogOut className="w-3 h-3" /> Stand Down
      </Link>
    </div>
  );
}