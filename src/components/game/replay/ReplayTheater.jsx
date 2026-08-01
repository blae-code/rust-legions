import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, SkipBack, SkipForward, FastForward } from "lucide-react";
import { playSfx } from "@/lib/sfx";
import ReplayEventCard from "@/components/game/replay/ReplayEventCard";

const BASE_MS = 2600;

// The War Ministry projection room — replays the key combat outcomes and
// supply captures of a concluded session as an auto-advancing newsreel.
export default function ReplayTheater({ game, onClose }) {
  const events = useMemo(
    () => (game.combatLog || []).filter((e) => e.type === "combat" || e.type === "capture"),
    [game.combatLog]
  );
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [fast, setFast] = useState(false);

  const colorFor = (name) => game.factions.find((f) => f.factionName === name)?.color || "hsl(40 8% 84%)";

  useEffect(() => {
    if (!playing || events.length === 0) return;
    const t = setInterval(() => {
      setIndex((i) => {
        if (i >= events.length - 1) { setPlaying(false); return i; }
        return i + 1;
      });
    }, fast ? BASE_MS / 2 : BASE_MS);
    return () => clearInterval(t);
  }, [playing, fast, events.length]);

  const ctl = (fn) => () => { playSfx("select"); fn(); };
  const event = events[index];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/90 flex flex-col items-center justify-center p-4"
      >
        <div className="cq-scanlines absolute inset-0 opacity-40 pointer-events-none" />
        <div className="cq-vignette absolute inset-0 pointer-events-none" />

        <div className="relative w-full max-w-lg flex items-center justify-between mb-4">
          <p className="cq-label text-brass">War Replay · {game.name}</p>
          <button onClick={ctl(onClose)} title="Leave the projection room" className="p-1.5 rounded-sm border border-rust/60 text-rust hover:text-brass-bright transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {events.length === 0 ? (
          <p className="relative font-mono text-xs text-muted-foreground tracking-widest">NO ENGAGEMENTS ON RECORD — THE REEL IS BLANK.</p>
        ) : (
          <>
            <ReplayEventCard event={event} colorFor={colorFor} />

            {/* Reel progress */}
            <div className="relative w-full max-w-lg mt-5">
              <div className="h-1 bg-secondary rounded-full overflow-hidden border border-border">
                <div className="h-full bg-brass transition-all duration-300" style={{ width: `${((index + 1) / events.length) * 100}%` }} />
              </div>
              <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-1.5 text-center">
                FRAME {index + 1} / {events.length}
              </p>
            </div>

            {/* Projection controls */}
            <div className="relative flex items-center gap-2 mt-3">
              <button onClick={ctl(() => { setIndex((i) => Math.max(i - 1, 0)); })} title="Previous event" className="w-9 h-9 rounded-full cq-metal bg-secondary border border-brass/50 text-brass-bright flex items-center justify-center hover:scale-110 transition-transform">
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={ctl(() => { if (!playing && index >= events.length - 1) setIndex(0); setPlaying(!playing); })}
                title={playing ? "Pause" : "Play"}
                className="w-11 h-11 rounded-full cq-metal bg-primary border border-brass-bright/50 text-primary-foreground flex items-center justify-center hover:scale-110 transition-transform"
              >
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <button onClick={ctl(() => { setIndex((i) => Math.min(i + 1, events.length - 1)); })} title="Next event" className="w-9 h-9 rounded-full cq-metal bg-secondary border border-brass/50 text-brass-bright flex items-center justify-center hover:scale-110 transition-transform">
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                onClick={ctl(() => setFast((f) => !f))}
                title="Double speed"
                className={`w-9 h-9 rounded-full cq-metal bg-secondary border flex items-center justify-center hover:scale-110 transition-transform ${fast ? "border-brass text-brass-bright" : "border-border text-muted-foreground"}`}
              >
                <FastForward className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}