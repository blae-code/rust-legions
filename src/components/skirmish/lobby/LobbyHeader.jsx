import React, { useState } from "react";
import { Copy, Check, XCircle } from "lucide-react";

// The lobby's own slip: the code others join by, the ground, and who holds it.
export default function LobbyHeader({ lobby, scenario, isHost, onDisband, onLeave }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(lobby.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="cq-panel p-4">
      <div className="cq-hazard mb-3 -mt-1 -mx-1" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="cq-label text-rust">Ministry of War · Muster Roll</p>
          <h1 className="cq-display text-3xl mt-1">{scenario.name}</h1>
          <p className="text-sm text-secondary-foreground/80 mt-1 max-w-2xl">{scenario.objective}</p>
          <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-1.5">
            {scenario.sheet} · {scenario.points} PTS PER SIDE · HOST {lobby.hostCallsign?.toUpperCase() || "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copy}
            className="cq-slip flex items-center gap-2 px-3 py-2 hover:border-brass"
            title="Copy join code"
          >
            <span className="font-mono text-[9px] text-muted-foreground tracking-widest">JOIN CODE</span>
            <span className="font-display text-2xl tracking-[0.3em] text-brass-bright">{lobby.code}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-olive" /> : <Copy className="w-3.5 h-3.5 text-brass" />}
          </button>
          <button
            onClick={isHost ? onDisband : onLeave}
            className="cq-metal flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-2 font-heading uppercase tracking-widest text-[10px] text-secondary-foreground hover:border-rust"
          >
            <XCircle className="w-3 h-3" /> {isHost ? "Disband" : "Leave"}
          </button>
        </div>
      </div>
    </div>
  );
}