import React, { useState } from "react";
import { Bot, Users, LogIn } from "lucide-react";

const MODES = [
  { key: "solo", icon: Bot, label: "Solo", note: "You alone against the machine. Fight at once." },
  { key: "lobby", icon: Users, label: "Open A Lobby", note: "Co-commanders join your side, or take the other one." },
];

// How this battle is mustered: alone, or as a lobby others can join by code.
export default function MusterChoice({ mode, onMode, onJoin, joining }) {
  const [code, setCode] = useState("");
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => onMode(m.key)}
            className={`cq-metal p-2 rounded-sm border text-left ${
              mode === m.key ? "border-brass bg-brass/10" : "border-border hover:border-brass/60"
            }`}
          >
            <p className={`flex items-center gap-1.5 font-heading uppercase tracking-widest text-[11px] ${
              mode === m.key ? "text-brass-bright" : "text-secondary-foreground"
            }`}>
              <m.icon className="w-3 h-3" /> {m.label}
            </p>
            <p className="text-[10px] text-muted-foreground leading-snug">{m.note}</p>
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); if (code.trim()) onJoin(code.trim().toUpperCase()); }}
        className="flex gap-1.5 border-t border-border pt-2"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={5}
          placeholder="JOIN CODE"
          className="flex-1 min-w-0 bg-input border border-border rounded-sm px-2 py-1.5 font-mono text-xs tracking-[0.3em] text-foreground placeholder:text-muted-foreground/60"
        />
        <button
          type="submit"
          disabled={joining || code.length < 5}
          className="cq-metal flex items-center gap-1.5 rounded-sm border border-brass/50 px-2.5 font-heading uppercase tracking-widest text-[10px] text-brass-bright disabled:opacity-40"
        >
          <LogIn className="w-3 h-3" /> Join
        </button>
      </form>
    </div>
  );
}