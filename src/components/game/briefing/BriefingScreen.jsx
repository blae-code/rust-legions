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
        {/* Folder tab — a torn index tag riveted to the slip */}
        <div className="flex items-end pl-6 relative z-10">
          <div className="cq-slip rounded-t-sm px-4 py-1.5" style={{ clipPath: "polygon(0 100%, 4px 0, calc(100% - 10px) 0, 100% 100%)" }}>
            <p className="font-mono text-[9px] tracking-[0.3em] text-brass-bright">FILE 7-A · SEALED UNTIL MUSTER</p>
          </div>
        </div>

        {/* One weathered sheet — dossier, roster and signature all typed on the same slip */}
        <div className="cq-slip relative rounded-sm p-4 -mt-px overflow-hidden">
          {/* Weathering — spilled ink, ring stain, worn fold line */}
          <div
            className="absolute inset-0 pointer-events-none opacity-70"
            style={{
              background:
                "radial-gradient(ellipse 120px 70px at 85% 12%, hsl(30 25% 20% / 0.35), transparent 70%)," +
                "radial-gradient(circle 34px at 12% 88%, transparent 62%, hsl(28 30% 22% / 0.4) 66%, transparent 72%)," +
                "linear-gradient(180deg, transparent 48.8%, hsl(0 0% 0% / 0.22) 49.4%, transparent 50%)",
            }}
          />

          <div className="relative space-y-4">
            <BriefingDossier game={game} bare />

            {/* V · Order of Battle — continues the same typed form */}
            <div className="border-t border-dashed border-brass/25 pt-3 px-1">
              <p className="cq-label text-[9px] text-brass/80 flex items-center gap-1.5">
                <Users className="w-3 h-3" /> V · Order of Battle
              </p>
              <div className="mt-2 grid sm:grid-cols-2 gap-1.5">
                {game.factions.map((f, i) => (
                  <div key={f.slotIndex} className="flex items-center gap-2 border-b border-dotted border-brass/25 px-1 py-1.5">
                    <span className="font-mono text-[9px] text-muted-foreground/70 shrink-0">{String(i + 1).padStart(2, "0")}.</span>
                    <span className="w-2.5 h-2.5 rounded-full ring-1 ring-black/60 shrink-0" style={{ background: f.color }} />
                    <span className="font-heading uppercase tracking-wide text-xs text-secondary-foreground truncate">
                      {f.factionName}
                    </span>
                    <span className={`ml-auto font-mono text-[9px] shrink-0 ${f.isMe ? "text-brass-bright" : "text-muted-foreground"}`}>
                      {f.isMe ? "YOU" : f.isNPC ? "NPC" : "RIVAL"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Signature block — the commander countersigns the orders */}
            <div className="border-t border-dashed border-brass/25 pt-3 px-1 flex flex-wrap items-end gap-4">
              <div className="min-w-[180px] flex-1">
                <p className="font-mono text-[9px] text-muted-foreground tracking-[0.25em] flex items-center gap-1.5 mb-3">
                  <MapIcon className="w-3 h-3 text-brass/60" /> SIGN BELOW TO ASSUME COMMAND
                </p>
                <div className="border-b border-brass/40 h-5 max-w-[240px]" />
                <p className="font-mono text-[8px] text-muted-foreground/60 tracking-[0.3em] mt-1">COMMANDING OFFICER — COUNTERSIGN</p>
              </div>
              <Button
                size="sm"
                className="ml-auto font-heading uppercase text-xs tracking-[0.2em]"
                onClick={() => { playSfx("endTurn"); onClose(); }}
              >
                Acknowledge Orders
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}