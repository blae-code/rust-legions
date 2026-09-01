import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { X, Map, Users, Milestone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildCommanderRecords, buildMilestones } from "@/lib/afterAction";
import FinalMapPanel from "@/components/game/summary/FinalMapPanel";
import CommanderRecordRow from "@/components/game/summary/CommanderRecordRow";
import MilestoneReel from "@/components/game/summary/MilestoneReel";
import SheetExportButton from "@/components/game/summary/SheetExportButton";
import { WORLDS } from "@/lib/macro/worlds";
import { getImage } from "@/lib/imageLibrary";

function Section({ icon: Icon, title, children }) {
  return (
    <div className="cq-panel relative overflow-hidden p-4">
      <div className="cq-hazard absolute top-0 left-0 right-0" />
      <div className="flex items-center gap-2 pt-1 mb-3">
        <Icon className="w-4 h-4 text-brass" />
        <p className="cq-label text-brass-bright">{title}</p>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>
      {children}
    </div>
  );
}

// The Ministry's closing dossier on a concluded war
export default function AfterActionScreen({ game, onClose }) {
  const records = useMemo(() => buildCommanderRecords(game), [game]);
  const milestones = useMemo(() => buildMilestones(game), [game]);
  const me = records.find((r) => r.isMe);
  const meWon = me && me.outcome === "Victory";
  const bg = getImage(meWon ? "bg_victory" : "bg_defeat");
  const worldName = WORLDS.find((w) => w.id === game.planetId)?.name || "Cindara";

  return (
    <div className="fixed inset-0 z-[80] bg-background/97 overflow-y-auto">
      <div className="absolute inset-0 cq-scanlines opacity-25 pointer-events-none" />
      <div className="absolute inset-0 cq-vignette pointer-events-none" />

      <div className="relative max-w-5xl mx-auto p-4 sm:p-6 space-y-4 cq-page-in">
        {/* Dossier cover */}
        <div className="cq-panel relative overflow-hidden p-5">
          {bg && <img src={bg} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none" />}
          <div className="cq-hazard absolute top-0 left-0 right-0" />
          <div className="relative flex flex-wrap items-start gap-4">
            <div className="min-w-0">
              <p className="cq-label text-rust">Ministry of War · After-Action Dossier</p>
              <h1 className="cq-display text-3xl sm:text-4xl leading-none mt-1">
                {game.winnerName ? `${game.winnerName} Carried the War` : "The Guns Fell Silent"}
              </h1>
              <p className="font-mono text-[10px] text-muted-foreground tracking-widest mt-1.5">
                {game.name.toUpperCase()} · {worldName.toUpperCase()} · {game.turnNumber} DAYS ·{" "}
                {game.mode === "campaign" ? "CAMPAIGN" : "MULTIPLAYER"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <motion.span
                initial={{ scale: 2.4, opacity: 0, rotate: -22 }}
                animate={{ scale: 1, opacity: 1, rotate: -8 }}
                transition={{ type: "spring", stiffness: 420, damping: 20, delay: 0.3 }}
                className="cq-stamp text-sm"
              >
                {meWon ? "Victory" : me?.outcome === "Eliminated" ? "Defeat" : "Armistice"}
              </motion.span>
              <button onClick={onClose} className="cq-metal p-1.5 rounded-sm border border-border text-muted-foreground hover:text-brass-bright hover:border-brass/50 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <Section icon={Map} title="The Continent at the Armistice">
          <FinalMapPanel game={game} />
        </Section>

        <Section icon={Users} title="Commanders' Service Records">
          <div className="space-y-2">
            {records.map((r) => <CommanderRecordRow key={r.slotIndex} record={r} />)}
          </div>
        </Section>

        <Section icon={Milestone} title="Campaign Milestones">
          <MilestoneReel milestones={milestones} />
        </Section>

        <div className="flex flex-col items-center gap-3 pb-4">
          <SheetExportButton gameId={game.id} />
          <Button onClick={onClose} className="h-10 px-8">Close the Dossier</Button>
        </div>
      </div>
    </div>
  );
}