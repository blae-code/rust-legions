import React from "react";
import { X } from "lucide-react";
import OfferCard from "@/components/game/diplomacy/OfferCard";
import FactionRelationCard from "@/components/game/diplomacy/FactionRelationCard";
import AccordsLog from "@/components/game/diplomacy/AccordsLog";

export default function DiplomacyPanel({ open, onClose, game, busy, onAction }) {
  if (!open || !game?.diplomacy) return null;
  const { stances, incoming, outgoing } = game.diplomacy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="cq-panel cq-brackets w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 relative" onClick={(e) => e.stopPropagation()}>
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <button onClick={onClose} className="absolute top-4 right-3 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
        <div className="pt-2 mb-4">
          <p className="cq-label text-rust">Ministry of Foreign Affairs</p>
          <h2 className="cq-display text-2xl">The Envoy Desk</h2>
          {!game.isMyTurn && (
            <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-1">
              PROPOSALS MAY ONLY BE DISPATCHED ON YOUR TURN · ONE ENVOY PER FACTION PER TURN
            </p>
          )}
        </div>

        {incoming.length > 0 && (
          <div className="mb-4">
            <p className="cq-label mb-2">Offers awaiting your seal</p>
            <div className="space-y-2">
              {incoming.map((o) => (
                <OfferCard key={o.id} offer={o} game={game} busy={busy}
                  onRespond={(accept) => onAction({ action: "respondDiplomacy", offerId: o.id, accept })} />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {stances.filter((s) => !s.eliminated).map((s) => (
            <FactionRelationCard key={s.slot} stance={s} game={game} busy={busy} onAction={onAction}
              outgoing={outgoing.filter((o) => o.to === s.slot)} />
          ))}
        </div>

        <AccordsLog accords={game.diplomacy.accords || []} trades={game.diplomacy.trades || []} turnNumber={game.turnNumber} />
      </div>
    </div>
  );
}