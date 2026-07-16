import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const STATUS = {
  lobby: { label: "Staging", lamp: "text-steel", tag: "border-steel/50 text-steel" },
  yourTurn: { label: "Your Turn", lamp: "text-brass-bright", tag: "border-brass text-brass-bright bg-brass/10" },
  waiting: { label: "In Progress", lamp: "text-olive", tag: "border-border text-muted-foreground" },
  complete: { label: "Concluded", lamp: "text-muted-foreground", tag: "border-border text-muted-foreground" },
};

export default function FrontCard({ game, index }) {
  const key = game.status === "lobby" ? "lobby" : game.status === "active" ? (game.isMyTurn ? "yourTurn" : "waiting") : "complete";
  const s = STATUS[key];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.45 }}
    >
      <Link to={`/game/${game.id}`} className="cq-panel cq-brackets block p-5 hover:border-brass/60 hover:-translate-y-0.5 transition-all group">
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-2 h-2 rounded-full bg-current cq-lamp ${s.lamp} ${key === "yourTurn" ? "animate-pulse" : ""}`} />
          <span className={`cq-tag ${s.tag}`}>{key === "waiting" ? `Turn ${game.turnNumber}` : s.label}</span>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">OP-{String(index + 1).padStart(3, "0")}</span>
        </div>
        <h3 className="font-heading font-semibold text-xl tracking-wide text-foreground group-hover:text-brass-bright transition-colors">
          {game.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-1.5 font-mono">
          {game.mode === "campaign" ? "CAMPAIGN" : "MULTIPLAYER"} · {game.playerCount} FACTIONS
          {game.winnerName && ` · VICTOR: ${game.winnerName.toUpperCase()}`}
        </p>
        <div className="flex items-center gap-1 mt-3 text-[10px] font-heading uppercase tracking-[0.2em] text-brass/70 group-hover:text-brass-bright transition-colors">
          Enter Theater <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>
    </motion.div>
  );
}