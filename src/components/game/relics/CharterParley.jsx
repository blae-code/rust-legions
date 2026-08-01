import React, { useState } from "react";
import { motion } from "framer-motion";
import { ScrollText, Loader2, Store } from "lucide-react";
import { playSfx } from "@/lib/sfx";
import BazaarPanel from "@/components/game/relics/BazaarPanel";

// Terms of Occupation — raised the moment a neutral settlement is surveyed.
// The dossier is read out, then the commander sets terms with the elders.
export default function CharterParley({ charter, onChoose, game, onBarter }) {
  const [busy, setBusy] = useState(false);
  const [bazaar, setBazaar] = useState(false);
  if (!charter) return null;
  const { dossier, options, nodeId } = charter;

  const choose = async (id) => {
    setBusy(true);
    playSfx("select");
    await onChoose(nodeId, id);
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="cq-panel cq-brackets relative overflow-hidden w-full max-w-lg p-5"
      >
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <div className="flex items-center gap-2 pt-1">
          <ScrollText className="w-4 h-4 text-brass" />
          <p className="cq-label">Terms of Occupation</p>
        </div>
        <h2 className="cq-display text-2xl mt-1">{dossier.title}</h2>
        <p className="font-mono text-[10px] text-muted-foreground tracking-widest">STANDING SINCE {String(dossier.era).toUpperCase()}</p>
        <p className="text-sm text-secondary-foreground leading-relaxed mt-2">{dossier.text}</p>
        <p className="text-[11px] text-muted-foreground italic mt-2">
          The elders gather in the square. Nothing moves out of the depots until you set terms.
        </p>

        <div className="space-y-2 mt-4">
          {options.map((o) => (
            <button
              key={o.id}
              disabled={busy}
              onClick={() => choose(o.id)}
              className="cq-metal w-full text-left rounded-sm border border-border px-3 py-2 hover:border-brass/60 disabled:opacity-40 transition-colors"
            >
              <p className="font-heading uppercase tracking-[0.16em] text-xs text-brass-bright">{o.label}</p>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{o.detail}</p>
            </button>
          ))}
        </div>

        {game && onBarter && (
          <button
            onClick={() => { playSfx("select"); setBazaar(true); }}
            className="mt-3 inline-flex items-center gap-1.5 font-heading uppercase tracking-[0.16em] text-[11px] text-brass hover:text-brass-bright transition-colors"
          >
            <Store className="w-3.5 h-3.5" /> Open the Bazaar — trade stores or a relic
          </button>
        )}

        {busy && (
          <p className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground tracking-widest mt-3">
            <Loader2 className="w-3 h-3 animate-spin" /> SEALING THE TERMS…
          </p>
        )}
      </motion.div>
      {game && onBarter && (
        <BazaarPanel open={bazaar} onClose={() => setBazaar(false)} game={game} nodeId={nodeId} onBarter={onBarter} />
      )}
    </div>
  );
}