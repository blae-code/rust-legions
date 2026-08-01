import React from "react";
import { motion } from "framer-motion";
import { Swords, Flag } from "lucide-react";

const OUTCOME_META = {
  captured: { label: "ZONE CAPTURED", tone: "text-olive" },
  repelled: { label: "ASSAULT REPELLED", tone: "text-rust" },
  retreated: { label: "FORCES WITHDREW", tone: "text-brass-bright" },
};

// One frame of the replay reel — a single combat outcome or supply capture.
export default function ReplayEventCard({ event, colorFor }) {
  const isCapture = event.type === "capture";
  return (
    <motion.div
      key={`${event.turn}-${event.tileName}-${event.type}`}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="cq-panel cq-brackets relative overflow-hidden px-8 py-7 text-center max-w-lg w-full"
    >
      <div className="cq-hazard absolute top-0 left-0 right-0" />
      <p className="cq-label pt-2">Day {event.turn} · {isCapture ? "Supply Capture" : "Engagement"}</p>
      <div className="flex justify-center my-3">
        <span className={`w-12 h-12 rounded-full cq-metal bg-secondary border flex items-center justify-center ${isCapture ? "border-olive/60 text-olive" : "border-rust/60 text-rust"}`}>
          {isCapture ? <Flag className="w-5 h-5" /> : <Swords className="w-5 h-5" />}
        </span>
      </div>
      {isCapture ? (
        <>
          <p className="cq-display text-2xl">
            <span style={{ color: colorFor(event.faction) }}>{event.faction}</span> seizes {event.tileName}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest mt-2">
            {event.from ? `WRESTED FROM ${event.from.toUpperCase()}` : "CLAIMED FROM THE WASTES"}
            {event.resource && ` · +${event.amount} ${event.resource.toUpperCase()}/DAY TO THE SUPPLY LINE`}
          </p>
        </>
      ) : (
        <>
          <p className="cq-display text-2xl">
            <span style={{ color: colorFor(event.attacker) }}>{event.attacker}</span>
            <span className="text-muted-foreground mx-2 text-lg">vs</span>
            <span style={{ color: colorFor(event.defender) }}>{event.defender}</span>
          </p>
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest mt-2">
            BATTLE OF {event.tileName?.toUpperCase()} · {event.rounds} ROUND{event.rounds === 1 ? "" : "S"} · LOSSES {event.attLosses}/{event.defLosses}
          </p>
          <p className={`font-heading uppercase tracking-[0.3em] text-sm mt-3 ${OUTCOME_META[event.outcome]?.tone || "text-foreground"}`}>
            {OUTCOME_META[event.outcome]?.label || event.outcome}
          </p>
        </>
      )}
    </motion.div>
  );
}