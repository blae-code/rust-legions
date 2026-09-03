import React from "react";
import { Swords } from "lucide-react";

// The signed order: what is about to be fought, and the button that starts it.
export default function LaunchOrder({ scenario, side, doctrine, count, spent, canLaunch, onLaunch }) {
  const Row = ({ k, v }) => (
    <div className="flex justify-between gap-2">
      <span className="cq-label">{k}</span>
      <span className="font-mono text-[10px] text-foreground text-right">{v}</span>
    </div>
  );

  return (
    <div className="cq-slip p-3 space-y-2 sticky top-20">
      <p className="cq-label text-rust">Battle Order</p>
      <p className="cq-display text-lg leading-none text-brass-bright">{scenario.name}</p>
      <p className="text-[11px] text-secondary-foreground/80 leading-snug">{scenario.objective}</p>
      <div className="space-y-0.5 border-t border-brass/30 pt-2">
        <Row k="Sheet" v={scenario.sheet} />
        <Row k="Your Role" v={side === "attacker" ? "Attacking" : "Defending"} />
        <Row k="Opponent" v={`Machine — ${doctrine}`} />
        <Row k="Stands" v={count} />
        <Row k="Spent" v={`${spent} / ${scenario.points}`} />
      </div>
      <button
        disabled={!canLaunch}
        onClick={onLaunch}
        className="cq-metal w-full flex items-center justify-center gap-2 rounded-sm border border-brass/60 bg-rust/80 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 font-display uppercase tracking-[0.2em] text-primary-foreground"
      >
        <Swords className="w-4 h-4" /> Take The Field
      </button>
      {!canLaunch && (
        <p className="font-mono text-[9px] text-muted-foreground tracking-widest text-center">
          REQUISITION AT LEAST THREE STANDS
        </p>
      )}
    </div>
  );
}