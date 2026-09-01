import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserRound, Cpu, Plus, X, Star } from "lucide-react";
import CommandTip from "@/components/ui/CommandTip";
import { DOCTRINE_META } from "@/components/setup/FactionSelect";
import { playSfx } from "@/lib/sfx";

const DOCTRINES = ["aggressive", "economic", "defensive"];

// The war table's four chairs — you, fellow commanders, machine rivals, empty seats.
export default function CommandRoster({ humanCount, setHumanCount, npcs, setNpcs, isCampaign }) {
  const totalSlots = humanCount + npcs.length;

  const seats = [{ type: "you" }];
  for (let i = 1; i < humanCount; i++) seats.push({ type: "human", n: i + 1 });
  npcs.forEach((d, i) => seats.push({ type: "npc", doctrine: d, idx: i }));
  while (seats.length < 4) seats.push({ type: "empty" });

  const cycleDoctrine = (idx) => {
    playSfx("select");
    setNpcs(npcs.map((d, j) => (j === idx ? DOCTRINES[(DOCTRINES.indexOf(d) + 1) % DOCTRINES.length] : d)));
  };
  const removeNpc = (idx) => {
    playSfx("select");
    setNpcs(npcs.filter((_, j) => j !== idx));
  };
  const addNpc = () => {
    if (totalSlots >= 4) return;
    playSfx("select");
    setNpcs([...npcs, "aggressive"]);
  };

  return (
    <div className="space-y-2.5">
      {/* Human commander dial */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[9px] text-muted-foreground tracking-[0.2em]">HUMAN COMMANDERS</span>
        <div className="flex rounded-sm border border-border overflow-hidden">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => { playSfx("select"); setHumanCount(n); setNpcs(npcs.slice(0, 4 - n)); }}
              className={`w-9 h-8 font-display text-sm transition-colors ${
                humanCount === n
                  ? "bg-brass/20 text-brass-bright shadow-[inset_0_0_8px_hsl(40_20%_54%/0.2)]"
                  : "bg-secondary/40 text-muted-foreground hover:text-foreground"
              } ${n > 1 ? "border-l border-border" : ""}`}
            >
              {n}
            </button>
          ))}
        </div>
        {isCampaign && (
          <span className="cq-tag border-rust/60 text-rust animate-pulse">Solo Campaign</span>
        )}
      </div>

      {/* Four chairs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <AnimatePresence initial={false}>
          {seats.map((seat, i) => {
            if (seat.type === "you") {
              return (
                <motion.div key="you" layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="relative rounded-sm border border-brass/70 bg-brass/10 p-2.5 text-center shadow-[0_0_12px_hsl(40_20%_54%/0.12)]">
                  <Star className="w-3 h-3 text-brass-bright absolute top-1.5 right-1.5" />
                  <UserRound className="w-6 h-6 mx-auto text-brass-bright" />
                  <p className="font-heading uppercase tracking-[0.18em] text-[10px] text-brass-bright mt-1">You</p>
                  <p className="font-mono text-[8px] text-muted-foreground tracking-[0.15em]">SEAT 1 · HOST</p>
                </motion.div>
              );
            }
            if (seat.type === "human") {
              return (
                <motion.div key={`h${seat.n}`} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                  className="rounded-sm border border-steel/50 bg-secondary/40 p-2.5 text-center">
                  <UserRound className="w-6 h-6 mx-auto text-steel" />
                  <p className="font-heading uppercase tracking-[0.18em] text-[10px] text-secondary-foreground mt-1">Commander</p>
                  <p className="font-mono text-[8px] text-muted-foreground tracking-[0.15em]">SEAT {seat.n} · AWAITS MUSTER</p>
                </motion.div>
              );
            }
            if (seat.type === "npc") {
              const D = DOCTRINE_META[seat.doctrine];
              return (
                <motion.div key={`n${seat.idx}`} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                  className="relative rounded-sm border border-rust/40 bg-rust/5 p-2.5 text-center">
                  <button type="button" onClick={() => removeNpc(seat.idx)} aria-label="Remove NPC"
                    className="absolute top-1 right-1 p-0.5 text-muted-foreground hover:text-rust transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                  <CommandTip title={`${D.label} Doctrine`} body={`${D.blurb} Tap to change doctrine.`} side="top">
                    <button type="button" onClick={() => cycleDoctrine(seat.idx)} className="w-full">
                      <Cpu className="w-6 h-6 mx-auto text-rust/80" />
                      <p className={`font-heading uppercase tracking-[0.18em] text-[10px] mt-1 flex items-center justify-center gap-1 ${D.tone}`}>
                        <D.icon className="w-3 h-3" /> {D.label}
                      </p>
                      <p className="font-mono text-[8px] text-muted-foreground tracking-[0.15em]">MACHINE RIVAL</p>
                    </button>
                  </CommandTip>
                </motion.div>
              );
            }
            return (
              <motion.button key={`e${i}`} layout type="button" onClick={addNpc}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-sm border border-dashed border-border p-2.5 text-center text-muted-foreground/50 hover:text-brass hover:border-brass/50 transition-colors">
                <Plus className="w-6 h-6 mx-auto" />
                <p className="font-heading uppercase tracking-[0.18em] text-[10px] mt-1">Add NPC</p>
                <p className="font-mono text-[8px] tracking-[0.15em]">EMPTY CHAIR</p>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}