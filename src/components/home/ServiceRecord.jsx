import React from "react";
import { motion } from "framer-motion";
import { Medal } from "lucide-react";
import { getImage } from "@/lib/imageLibrary";

export default function ServiceRecord({ profile }) {
  if (!profile) return null;
  const backdrop = getImage("bg_service_record");
  const winRate = profile.gamesPlayed > 0 ? Math.round((profile.gamesWon / profile.gamesPlayed) * 100) : 0;
  const stats = [
    { label: "Engagements", value: profile.gamesPlayed || 0 },
    { label: "Victories", value: profile.gamesWon || 0 },
    { label: "Win Rate", value: `${winRate}%` },
    { label: "Campaigns", value: profile.campaignsCompleted || 0 },
    { label: "Maps Drafted", value: profile.mapsCreated || 0 },
  ];
  return (
    <motion.div
      className="cq-panel relative overflow-hidden p-5"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {backdrop && (
        <img src={backdrop} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-[0.12] pointer-events-none select-none" />
      )}
      <div className="cq-hazard absolute top-0 left-0 right-0" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5 pt-1">
        <div className="flex items-center gap-4 md:pr-6 md:border-r border-border">
          <div className="w-12 h-12 rounded-sm border border-brass/50 bg-brass/10 flex items-center justify-center text-brass-bright">
            <Medal className="w-6 h-6" />
          </div>
          <div>
            <p className="cq-label text-brass">Personnel File</p>
            <p className="font-display text-xl uppercase tracking-widest text-foreground leading-tight">{profile.displayName}</p>
            <p className="font-mono text-[9px] text-muted-foreground tracking-widest">RANK: COMMANDER · STATUS: ACTIVE DUTY</p>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 flex-1">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-2xl text-brass-bright leading-none">{s.value}</p>
              <p className="cq-label mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        <span className="cq-stamp text-xs hidden lg:block">Verified</span>
      </div>
    </motion.div>
  );
}