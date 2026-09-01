import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Pause, Play, Ban, Trash2, ExternalLink, Loader2 } from "lucide-react";
import CommandTip from "@/components/ui/CommandTip";

const STATUS_META = {
  lobby: { label: "Mustering", tone: "border-steel/60 text-steel" },
  active: { label: "Live", tone: "border-olive/60 text-olive" },
  paused: { label: "Suspended", tone: "border-brass/60 text-brass-bright" },
  complete: { label: "Concluded", tone: "border-border text-muted-foreground" },
  cancelled: { label: "Struck", tone: "border-rust/60 text-rust" },
};

// One front on the Ministry register, with full oversight actions.
export default function RegistryRow({ game, busy, onAction }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const s = STATUS_META[game.status] || STATUS_META.lobby;
  const isLive = ["lobby", "active", "paused"].includes(game.status);

  const IconBtn = ({ tip, onClick, tone = "hover:text-brass-bright hover:border-brass/50", children }) => (
    <CommandTip title={tip} side="top">
      <button disabled={busy} onClick={onClick}
        className={`p-1.5 rounded-sm border border-border text-muted-foreground transition-colors disabled:opacity-40 ${tone}`}>
        {children}
      </button>
    </CommandTip>
  );

  return (
    <div className="cq-panel p-3 flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-heading font-semibold tracking-wide text-foreground text-sm truncate">{game.name}</p>
          <span className={`cq-tag ${s.tone}`}>{s.label}</span>
          {game.isMine && <span className="cq-tag border-brass/40 text-brass">Your Front</span>}
        </div>
        <p className="font-mono text-[9px] text-muted-foreground tracking-[0.15em] mt-0.5">
          {game.mode === "campaign" ? "CAMPAIGN" : "MULTIPLAYER"} · TURN {game.turnNumber} · {game.humanCount} HUMAN / {game.playerCount - game.humanCount} MACHINE
          {game.openSeats > 0 && ` · ${game.openSeats} OPEN`} · HOST: {(game.hostCallsign || "UNKNOWN").toUpperCase()}
          {game.winnerName && ` · VICTOR: ${game.winnerName.toUpperCase()}`}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <IconBtn tip="Open the front">
          <Link to={`/game/${game.id}`}><ExternalLink className="w-3.5 h-3.5" /></Link>
        </IconBtn>
        {game.status === "paused" && (
          <IconBtn tip="Lift the suspension" onClick={() => onAction(game.id, "resumeGame")}>
            <Play className="w-3.5 h-3.5" />
          </IconBtn>
        )}
        {(game.status === "active" || game.status === "lobby") && (
          <IconBtn tip="Suspend the front" onClick={() => onAction(game.id, "pauseGame")}>
            <Pause className="w-3.5 h-3.5" />
          </IconBtn>
        )}
        {isLive && (
          <IconBtn tip="Strike from the register" tone="hover:text-rust hover:border-rust/50" onClick={() => onAction(game.id, "cancelGame")}>
            <Ban className="w-3.5 h-3.5" />
          </IconBtn>
        )}
        {confirmDelete ? (
          <button disabled={busy} onClick={() => onAction(game.id, "deleteGame")}
            className="flex items-center gap-1 rounded-sm border border-rust bg-rust/20 px-2 py-1.5 font-heading uppercase tracking-[0.12em] text-[9px] text-rust">
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Confirm
          </button>
        ) : (
          <IconBtn tip="Destroy the file — permanent" tone="hover:text-rust hover:border-rust/50" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="w-3.5 h-3.5" />
          </IconBtn>
        )}
      </div>
    </div>
  );
}