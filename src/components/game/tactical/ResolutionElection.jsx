import React from "react";
import { Loader2, Swords, Grid3x3 } from "lucide-react";
import { playSfx } from "@/lib/sfx";

const OPTIONS = [
  { mode: "quick", icon: Swords, title: "Quick Resolution", sub: "Mass battle · maneuver orders", body: "The generals trade maneuvers round by round. Fast, abstract, decided on skill and morale." },
  { mode: "tactical", icon: Grid3x3, title: "Set-Piece Engagement", sub: "Formations · gridded field", body: "Divide the column into formations, deploy them on the field and fight it out turn by turn." },
];

// The attacking commander elects how the engagement is fought
export default function ResolutionElection({ battle, busy, onElect }) {
  return (
    <div>
      <div className="text-center pt-2 mb-4">
        <p className="cq-label text-rust">Resolution Order</p>
        <h2 className="cq-display text-2xl">Contact at {battle.tileName}</h2>
      </div>
      {battle.myRole === "attacker" ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {OPTIONS.map(({ mode, icon: Icon, title, sub, body }) => (
            <button
              key={mode} type="button" disabled={busy}
              onMouseEnter={() => playSfx("hover")}
              onClick={() => onElect(mode)}
              className="cq-slip text-left p-4 hover:border-brass-bright transition-colors disabled:opacity-50"
            >
              <Icon className="w-5 h-5 text-brass mb-2" />
              <p className="font-display text-lg text-brass-bright tracking-[0.08em] leading-none">{title}</p>
              <p className="font-mono text-[8px] text-muted-foreground tracking-[0.2em] mt-1">{sub.toUpperCase()}</p>
              <p className="text-[11px] text-secondary-foreground mt-2 leading-snug">{body}</p>
            </button>
          ))}
        </div>
      ) : (
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-heading tracking-widest uppercase py-6">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> The attacking commander elects how the engagement is fought…
        </p>
      )}
    </div>
  );
}