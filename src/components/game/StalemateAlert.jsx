import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { playSfx } from "@/lib/sfx";

const STALL_TURNS = 6; // days with no territorial change and no engagements

// Watches the turn snapshots and combat record for a frozen front. When no
// settlement changes hands and no shot is fired for STALL_TURNS days, the
// Ministry issues a deadlock advisory with suggestions to force a decision.
export default function StalemateAlert({ game }) {
  const [dismissedAt, setDismissedAt] = useState(null);
  const announced = useRef(false);

  const stalled = useMemo(() => {
    if (game.status !== "active") return false;
    const history = game.statHistory || [];
    if (history.length < STALL_TURNS) return false;
    const window = history.slice(-STALL_TURNS);
    const windowStart = window[0].turn;
    // Territorial freeze: every faction's control identical across the window
    const keys = Object.keys(window[0].control || {});
    const frozen = keys.every((k) => window.every((s) => (s.control || {})[k] === (window[0].control || {})[k]));
    if (!frozen) return false;
    // No battles or captures fought inside the window
    const action = (game.combatLog || []).some(
      (e) => (e.type === "combat" || e.type === "capture") && e.turn >= windowStart
    );
    return !action;
  }, [game.status, game.statHistory, game.combatLog]);

  useEffect(() => {
    if (stalled && !announced.current) { playSfx("hover"); announced.current = true; }
    if (!stalled) announced.current = false;
  }, [stalled]);

  const visible = stalled && dismissedAt !== game.turnNumber;

  const suggestions = [
    "Order an assault — a foreign column within one route of yours can be engaged directly from the radial menu.",
    "Cut their supply: seize a fuel depot near the enemy's lines and let privation do the fighting.",
    "Levy a fresh column at a city or the fortress-base and open a second front.",
    "Send an envoy — a trade or truce can convert a frozen front into materiel and time.",
    "Roll the fortress-base forward to extend your supply envelope over contested ground.",
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="cq-panel relative overflow-hidden border-rust/70 p-4"
        >
          <div className="cq-hazard absolute top-0 left-0 right-0" />
          <div className="flex items-start gap-3 pt-1">
            <span className="w-9 h-9 shrink-0 rounded-full cq-metal bg-secondary border border-rust/60 text-rust flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="font-heading uppercase tracking-[0.2em] text-sm text-rust">
                Ministry Advisory — Stalemate on the Front
              </p>
              <p className="font-mono text-[10px] text-muted-foreground tracking-widest mt-0.5">
                NO GROUND HAS CHANGED HANDS AND NO SHOT HAS BEEN FIRED FOR {STALL_TURNS} DAYS. THE WAR RISKS GRINDING FOREVER.
              </p>
              <ul className="mt-2 space-y-1">
                {suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-secondary-foreground flex gap-2">
                    <span className="text-brass font-mono text-[10px] mt-0.5">▸</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => { playSfx("select"); setDismissedAt(game.turnNumber); }}
              title="Acknowledge — remind me if the deadlock persists"
              className="ml-auto shrink-0 p-1.5 rounded-sm border border-border text-muted-foreground hover:text-rust hover:border-rust/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}