import React from "react";
import { motion } from "framer-motion";
import { Trophy, Flag, Swords, Map } from "lucide-react";

const MEDAL = ["#E8C15A", "#B8B8B8", "#B07B4F"];

// One commander's line on the Roll of Honour
export default function CommanderRankRow({ rank, profile, index }) {
  const medal = MEDAL[rank - 1];
  const winRate = profile.gamesPlayed ? Math.round((profile.gamesWon / profile.gamesPlayed) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5) }}
      className={`cq-panel relative overflow-hidden px-4 py-3 flex items-center gap-4 ${medal ? "border-brass/50" : ""}`}
    >
      {medal && <div className="cq-hazard absolute top-0 left-0 right-0" />}
      <div className="w-10 shrink-0 text-center">
        {medal ? (
          <Trophy className="w-5 h-5 mx-auto" style={{ color: medal }} />
        ) : (
          <span className="font-display text-xl text-muted-foreground">{rank}</span>
        )}
        {medal && <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-0.5">{rank}</p>}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-heading uppercase tracking-[0.15em] text-sm text-foreground truncate">
          {profile.displayName}
        </p>
        <p className="font-mono text-[9px] text-muted-foreground tracking-widest">
          {profile.gamesPlayed || 0} ENGAGEMENTS · {winRate}% CARRIED
        </p>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        <div className="text-center" title="Wars won">
          <Swords className="w-3.5 h-3.5 mx-auto text-brass" />
          <p className="font-display text-lg leading-none text-brass-bright">{profile.gamesWon || 0}</p>
          <p className="cq-label text-[8px]">Won</p>
        </div>
        <div className="text-center" title="Campaigns completed">
          <Flag className="w-3.5 h-3.5 mx-auto text-rust" />
          <p className="font-display text-lg leading-none text-foreground">{profile.campaignsCompleted || 0}</p>
          <p className="cq-label text-[8px]">Campaigns</p>
        </div>
        <div className="text-center hidden sm:block" title="Charts drafted">
          <Map className="w-3.5 h-3.5 mx-auto text-steel" />
          <p className="font-display text-lg leading-none text-muted-foreground">{profile.mapsCreated || 0}</p>
          <p className="cq-label text-[8px]">Charts</p>
        </div>
      </div>
    </motion.div>
  );
}