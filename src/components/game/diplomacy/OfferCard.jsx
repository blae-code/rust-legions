import React from "react";
import { RESOURCE_KEYS, RESOURCE_META } from "@/lib/units";
import { PACT_META } from "@/lib/diplomacy";

const terms = (r = {}) => RESOURCE_KEYS.filter((k) => r[k]).map((k) => `${r[k]} ${RESOURCE_META[k].icon}`).join(" + ") || "nothing";

export default function OfferCard({ offer, game, busy, onRespond }) {
  const from = game.factions.find((f) => f.slotIndex === offer.from);

  return (
    <div className="border border-brass/40 rounded-sm bg-brass/5 p-3">
      <p className="font-heading text-sm tracking-wide text-secondary-foreground">
        {from?.factionName} proposes {offer.kind === "trade" ? "an exchange of war materiel" : `a ${PACT_META[offer.kind]?.label}`}
      </p>
      {offer.kind === "trade" ? (
        <p className="font-mono text-[10px] text-muted-foreground mt-1">They give {terms(offer.give)} · They ask {terms(offer.want)}</p>
      ) : (
        <p className="font-mono text-[10px] text-muted-foreground mt-1">{PACT_META[offer.kind]?.desc}</p>
      )}
      <div className="flex gap-2 mt-2.5">
        <button disabled={busy} onClick={() => onRespond(true)} className="flex-1 cq-metal bg-primary text-primary-foreground font-heading uppercase tracking-widest text-[10px] py-1.5 rounded-sm disabled:opacity-50">
          Accept & Seal
        </button>
        <button disabled={busy} onClick={() => onRespond(false)} className="flex-1 border border-rust/50 text-rust font-heading uppercase tracking-widest text-[10px] py-1.5 rounded-sm hover:bg-rust/10 disabled:opacity-50">
          Decline
        </button>
      </div>
    </div>
  );
}