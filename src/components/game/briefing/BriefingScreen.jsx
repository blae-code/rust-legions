import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, Map as MapIcon } from "lucide-react";
import BriefingDossier from "@/components/game/lobby/BriefingDossier";
import { playSfx } from "@/lib/sfx";

// PRE-GAME BRIEFING — the sealed operation file, laid open on the war desk
// before the first column moves. Wraps the B-17 dossier in a weathered
// ministry folder with the commander roster and a signature line.
export default function BriefingScreen({ game, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/85 backdrop-blur-sm">
      <div className="absolute inset-0 cq-scanlines opacity-20 pointer-events-none" />
      <div className="absolute inset-0 cq-vignette pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24, rotate: -0.6 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.7, 0.3, 1] }}
        className="relative max-w-3xl mx-auto my-8 px-4"
      >
        {/* Folder tab */}
        <div className="flex items-end gap-2 pl-6">
          <div className="cq-slip rounded-t-sm px-4 py-1.5 border-b-0">
            <p className="font-mono text-[9px] tracking-[0.3em] text-brass-bright">FILE 7-A · SEALED UNTIL MUSTER</p>
          </div>
        </div>

        <div className="cq-slip rounded-sm p-4 space-y-4">
          <BriefingDossier game={game} />

          <div className="cq-slip rounded-sm p-4">
            <p className="cq-label text-[9px] text-brass/80 flex items-center gap-1.5">
              <Users className="w-3 h-3" /> V · Order of Battle
            </p>
            <div className="mt-2 grid sm:grid-cols-2 gap-1.5">
              {game.factions.map((f) => (
                <div key={f.slotIndex} className="flex items-center gap-2 border border-brass/20 rounded-sm px-2 py-1.5 bg-black/25">
                  <span className="w-2.5 h-2.5 rounded-full ring-1 ring-black/60 shrink-0" style={{ background: f.color }} />
                  <span className="font-heading uppercase tracking-wide text-xs text-secondary-foreground truncate">
                    {f.factionName}
                  </span>
                  <span className="ml-auto font-mono text-[9px] text-muted-foreground shrink-0">
                    {f.isMe ? "YOU" : f.isNPC ? "NPC" : "RIVAL"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <p className="font-mono text-[9px] text-muted-foreground tracking-[0.25em] flex items-center gap-1.5">
              <MapIcon className="w-3 h-3 text-brass/60" /> SIGN BELOW TO ASSUME COMMAND
            </p>
            <Button
              size="sm"
              className="ml-auto font-heading uppercase text-xs tracking-[0.2em]"
              onClick={() => { playSfx("endTurn"); onClose(); }}
            >
              Acknowledge Orders
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}