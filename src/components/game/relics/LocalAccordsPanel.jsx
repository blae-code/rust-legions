import React from "react";
import { X, Landmark } from "lucide-react";
import SettlementAccordRow from "@/components/game/relics/SettlementAccordRow";

// The Governor's Desk — standing terms with every surveyed settlement you hold
export default function LocalAccordsPanel({ open, onClose, game, busy, onSet }) {
  if (!open) return null;
  const macro = game.macro || {};
  const mySlot = game.mySlot;
  const dossiers = Object.fromEntries((macro.dossiers || []).map((d) => [d.nodeId, d]));
  const held = (macro.nodes || []).filter(
    (n) => macro.control?.[n.id] === mySlot && dossiers[n.id]
  );

  return (
    <div className="fixed inset-0 z-[75] flex items-start justify-center overflow-y-auto p-4 bg-black/70">
      <div className="cq-panel cq-brackets relative overflow-hidden w-full max-w-xl my-8 p-5">
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-brass-bright">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 pt-1">
          <Landmark className="w-4 h-4 text-brass" />
          <p className="cq-label">Governor's Desk</p>
        </div>
        <h2 className="cq-display text-2xl mt-1">Local Accords</h2>
        <p className="text-[11px] text-muted-foreground mt-1">
          Every settlement you hold can be integrated, traded with, or taxed. Terms are cut on your turn.
        </p>

        <div className="space-y-2 mt-4">
          {held.length === 0 && (
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest">
              NO SURVEYED SETTLEMENTS UNDER YOUR FLAG — TAKE GROUND FIRST.
            </p>
          )}
          {held.map((n) => (
            <SettlementAccordRow
              key={n.id}
              node={n}
              dossier={dossiers[n.id]}
              current={macro.policies?.[n.id] || null}
              turnNumber={game.turnNumber}
              canOrder={!!game.isMyTurn}
              busy={busy}
              onSet={onSet}
            />
          ))}
        </div>

        {!game.isMyTurn && held.length > 0 && (
          <p className="font-mono text-[9px] text-rust tracking-widest mt-3">TERMS MAY ONLY BE CUT ON YOUR OWN TURN.</p>
        )}
      </div>
    </div>
  );
}