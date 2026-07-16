import React, { useState } from "react";
import { STATUS_META, dispositionLabel } from "@/lib/diplomacy";
import TradeOfferForm from "@/components/game/diplomacy/TradeOfferForm";

const btnCls = "flex-1 font-heading uppercase tracking-widest text-[10px] border border-border rounded-sm py-1.5 text-secondary-foreground hover:border-brass/60 hover:text-brass-bright disabled:opacity-40 disabled:pointer-events-none transition-colors";

export default function FactionRelationCard({ stance, game, busy, onAction, outgoing }) {
  const [trading, setTrading] = useState(false);
  const st = STATUS_META[stance.status] || STATUS_META.war;
  const canPropose = game.isMyTurn && !busy && outgoing.length === 0;
  const disp = stance.disposition !== null && stance.disposition !== undefined ? dispositionLabel(stance.disposition) : null;

  return (
    <div className="border border-border rounded-sm bg-secondary/30 p-3">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full ring-1 ring-black/50" style={{ background: stance.color }} />
        <p className="font-heading tracking-wide text-sm text-secondary-foreground">
          {stance.factionName}{stance.isNPC && <span className="text-muted-foreground"> (NPC)</span>}
        </p>
        <span className={`cq-tag ml-auto ${st.className}`}>
          {st.label}{stance.status !== "war" && stance.until ? ` · UNTIL T${stance.until}` : ""}
        </span>
      </div>

      {disp && (
        <div className="mt-2">
          <div className="flex justify-between font-mono text-[9px] tracking-widest">
            <span className="text-muted-foreground">DISPOSITION</span>
            <span className={disp.color}>{disp.label.toUpperCase()} ({stance.disposition > 0 ? "+" : ""}{stance.disposition})</span>
          </div>
          <div className="h-1 bg-background/70 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-brass rounded-full transition-all" style={{ width: `${(stance.disposition + 100) / 2}%` }} />
          </div>
        </div>
      )}

      {outgoing.length > 0 && (
        <p className="font-mono text-[9px] text-brass/80 tracking-widest mt-2">⁜ ENVOY DISPATCHED — AWAITING REPLY</p>
      )}

      <div className="flex gap-1.5 mt-2.5">
        <button disabled={!canPropose || stance.status !== "war"} onClick={() => onAction({ action: "proposeDiplomacy", targetSlot: stance.slot, kind: "truce" })} className={btnCls}>
          Truce · 5T
        </button>
        <button disabled={!canPropose || stance.status !== "war"} onClick={() => onAction({ action: "proposeDiplomacy", targetSlot: stance.slot, kind: "nap" })} className={btnCls}>
          Pact · 10T
        </button>
        <button disabled={!canPropose} onClick={() => setTrading(!trading)} className={btnCls}>
          Trade
        </button>
      </div>

      {trading && canPropose && (
        <TradeOfferForm myResources={game.myResources} busy={busy}
          onSend={(give, want) => { onAction({ action: "proposeDiplomacy", targetSlot: stance.slot, kind: "trade", give, want }); setTrading(false); }} />
      )}
    </div>
  );
}