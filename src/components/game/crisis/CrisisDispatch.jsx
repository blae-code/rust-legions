import React, { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";
import { playSfx } from "@/lib/sfx";
import CrisisOption from "@/components/game/crisis/CrisisOption";

// A crisis in the protectorate — the staff will not move until the commander rules
export default function CrisisDispatch({ crisis, resources = {}, onChoose }) {
  const [busy, setBusy] = useState(false);
  if (!crisis) return null;

  const cannotPay = (o) => Object.entries(o.give || {}).some(([k, v]) => (resources[k] || 0) < v);

  const choose = async (choiceId) => {
    setBusy(true);
    playSfx("select");
    await onChoose(crisis.nodeId, choiceId);
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 bg-black/75">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="cq-panel cq-brackets relative overflow-hidden w-full max-w-lg my-8 p-5"
      >
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <div className="flex items-center gap-2 pt-1">
          <AlertTriangle className="w-4 h-4 text-rust" />
          <p className="cq-label text-rust">Signals — Occupation Crisis</p>
        </div>
        <h2 className="cq-display text-2xl mt-1">{crisis.title}</h2>
        <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-0.5">
          {String(crisis.nodeName).toUpperCase()} · DAY {crisis.turn}
        </p>
        <p className="text-[12px] text-secondary-foreground leading-relaxed mt-2">{crisis.text}</p>

        <div className="space-y-2 mt-4">
          {crisis.options.map((o) => (
            <CrisisOption
              key={o.id}
              option={o}
              disabled={busy || cannotPay(o)}
              note={cannotPay(o) ? "THE TREASURY CANNOT COVER IT" : null}
              onChoose={choose}
            />
          ))}
        </div>

        <p className="font-mono text-[9px] text-rust tracking-widest mt-3">
          EVERY DAY THIS SITS UNANSWERED COSTS STABILITY.
        </p>
        {busy && (
          <p className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground tracking-widest mt-2">
            <Loader2 className="w-3 h-3 animate-spin" /> ISSUING THE RULING…
          </p>
        )}
      </motion.div>
    </div>
  );
}