import React, { useState, useEffect } from "react";
import Typewriter from "@/components/home/Typewriter";
import { playSfx } from "@/lib/sfx";

const SPEED = 28;
const GAP = 550;
const LINES = [
  "> INCOMING TRANSMISSION — MINISTRY OF WAR — PRIORITY ABSOLUTE",
  "This world was never ours. We were carried here — and then we were left.",
  "Whatever brought us buried its machines beneath the ash. Power enough to remake humanity still sleeps in the ground.",
  "The great factions roam the wastes in fortress and column, digging for it. The continent burns for it.",
  "The Ministry has need of a new commander. The Ministry has need of you.",
];

// Cumulative reveal schedule so each line types in sequence
const startOf = (i) => LINES.slice(0, i).reduce((s, l) => s + l.length * SPEED + GAP, 400);
const TOTAL = startOf(LINES.length);

export default function LoreTransmission({ onDone }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), TOTAL + 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="font-mono text-xs sm:text-sm space-y-4 px-2 cq-flicker">
      {LINES.map((line, i) => (
        <p key={i} className={i === 0 ? "text-rust tracking-widest" : i === LINES.length - 1 ? "text-brass-bright" : "text-foreground/85 leading-relaxed"}>
          <Typewriter text={line} delay={startOf(i)} speed={SPEED} />
        </p>
      ))}
      <div className="pt-4 flex items-center gap-4">
        {ready ? (
          <button
            onClick={() => { playSfx("purchase"); onDone(); }}
            className="cq-metal border border-brass/60 text-brass-bright font-heading uppercase tracking-[0.25em] text-xs px-6 py-2.5 rounded-sm hover:border-brass-bright transition-colors"
          >
            Accept the Commission →
          </button>
        ) : (
          <span className="inline-block w-2 h-4 bg-brass-bright animate-pulse" />
        )}
        <button onClick={onDone} className="font-mono text-[9px] text-muted-foreground tracking-[0.3em] hover:text-foreground transition-colors">
          SKIP TRANSMISSION
        </button>
      </div>
    </div>
  );
}