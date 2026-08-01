import React, { useState } from "react";
import { X, Store, Loader2 } from "lucide-react";
import { barterDeals, looseRelics, BARTER_COOLDOWN_DAYS } from "@/lib/barter";
import BazaarDeal from "@/components/game/relics/BazaarDeal";

// The Bazaar — swap stores or a salvaged relic with a settlement's populace
export default function BazaarPanel({ open, onClose, game, nodeId, onBarter }) {
  const [relicId, setRelicId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;

  const macro = game.macro || {};
  const node = (macro.nodes || []).find((n) => n.id === nodeId);
  const last = macro.barters?.[nodeId];
  const daysLeft = last ? BARTER_COOLDOWN_DAYS - (game.turnNumber - last.turn) : 0;
  const closed = daysLeft > 0;
  const relics = looseRelics(game.myRelics || [], game.myRelicSets || []);
  const res = game.myResources || {};
  const pledge = macro.bazaarBoost?.[nodeId];

  const take = async (deal) => {
    setBusy(true);
    setError("");
    try {
      await onBarter({ nodeId, dealId: deal.id, relicId: deal.relic ? relicId : undefined });
      onClose();
    } catch (e) {
      setError(e.message || "The market turns you away");
    }
    setBusy(false);
  };

  const cannotPay = (deal) => deal.relic
    ? (!relics.length || !relicId)
    : Object.entries(deal.give || {}).some(([k, v]) => (res[k] || 0) < v);

  return (
    <div className="fixed inset-0 z-[85] flex items-start justify-center overflow-y-auto p-4 bg-black/75">
      <div className="cq-panel cq-brackets relative overflow-hidden w-full max-w-lg my-8 p-5">
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-brass-bright">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 pt-1">
          <Store className="w-4 h-4 text-brass" />
          <p className="cq-label">The Bazaar</p>
        </div>
        <h2 className="cq-display text-2xl mt-1">{node?.name || "Market Square"}</h2>
        <p className="text-[11px] text-muted-foreground mt-1">
          Traders spread tarpaulins in the square. They deal in stores — and they revere anything the precursors left behind.
        </p>
        {pledge && (
          <p className="font-mono text-[9px] text-brass tracking-widest mt-1">
            STANDING PLEDGE: +{pledge.amt} {String(pledge.res).toUpperCase()} DAILY
          </p>
        )}

        {relics.length > 0 && (
          <select
            value={relicId}
            onChange={(e) => setRelicId(e.target.value)}
            className="w-full mt-3 bg-input border border-border rounded-sm text-xs p-2 text-secondary-foreground font-heading tracking-wide"
          >
            <option value="">Relic to offer…</option>
            {relics.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        )}

        <div className="space-y-2 mt-3">
          {barterDeals(node || {}).map((d) => (
            <BazaarDeal
              key={d.id}
              deal={d}
              disabled={busy || closed || !game.isMyTurn || cannotPay(d)}
              note={d.relic && !relics.length ? "NO LOOSE RELICS IN THE VAULT" : null}
              onTake={take}
            />
          ))}
        </div>

        {closed && (
          <p className="font-mono text-[9px] text-rust tracking-widest mt-3">
            THE MARKET IS PICKED OVER — {daysLeft} DAY{daysLeft === 1 ? "" : "S"} BEFORE IT RESTOCKS.
          </p>
        )}
        {!game.isMyTurn && <p className="font-mono text-[9px] text-rust tracking-widest mt-2">TRADE IS STRUCK ON YOUR OWN TURN.</p>}
        {error && <p className="font-mono text-[10px] text-rust mt-2">{error}</p>}
        {busy && <p className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground tracking-widest mt-2"><Loader2 className="w-3 h-3 animate-spin" /> HAGGLING…</p>}
      </div>
    </div>
  );
}