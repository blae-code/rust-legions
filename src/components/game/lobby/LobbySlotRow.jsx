import React, { useState } from "react";
import { Bot, UserMinus } from "lucide-react";
import { playSfx } from "@/lib/sfx";

const DOCTRINES = ["aggressive", "economic", "defensive"];

// One staging seat. The host may convert any seat that is not their own
// between an open human chair and an NPC faction with a chosen doctrine.
export default function LobbySlotRow({ faction, isHost, busy, onSetSlotType }) {
  const [doctrine, setDoctrine] = useState(faction.doctrine || "aggressive");
  const canAdmin = isHost && !faction.isMe;

  return (
    <div className="flex flex-wrap items-center gap-3 border border-border bg-secondary/30 rounded-sm p-3">
      <div className="w-3 h-3 rounded-full ring-1 ring-black/50" style={{ background: faction.color }} />
      <span className="text-sm font-heading tracking-wide text-secondary-foreground flex-1 min-w-[9rem]">
        {faction.factionName || <span className="text-muted-foreground italic">Open slot — awaiting commander</span>}
      </span>
      <span className="cq-tag border-border text-muted-foreground">
        {faction.isNPC ? `NPC · ${faction.doctrine}` : faction.isMe ? "You" : faction.isOpen ? "Open" : "Player"}
      </span>

      {canAdmin && (
        <div className="flex items-center gap-1.5">
          <select
            value={doctrine}
            onChange={(e) => {
              const d = e.target.value;
              setDoctrine(d);
              if (faction.isNPC) onSetSlotType(faction.slotIndex, "npc", d);
            }}
            disabled={busy}
            aria-label="NPC doctrine"
            className="bg-input border border-border rounded-sm p-1 text-[10px] text-secondary-foreground font-heading uppercase tracking-widest"
          >
            {DOCTRINES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {faction.isNPC ? (
            <button
              onClick={() => { playSfx("select"); onSetSlotType(faction.slotIndex, "open"); }}
              disabled={busy}
              title="Open this seat to a human commander"
              className="cq-metal font-heading uppercase tracking-widest text-[10px] px-2 py-1 rounded-sm border border-border text-muted-foreground hover:text-brass-bright hover:border-brass/50 transition-colors disabled:opacity-50"
            >
              <UserMinus className="w-3 h-3 inline mr-1" />Open Seat
            </button>
          ) : (
            <button
              onClick={() => { playSfx("select"); onSetSlotType(faction.slotIndex, "npc", doctrine); }}
              disabled={busy}
              title="Fill this seat with an NPC faction"
              className="cq-metal font-heading uppercase tracking-widest text-[10px] px-2 py-1 rounded-sm border border-brass/50 text-brass-bright hover:bg-brass/10 transition-colors disabled:opacity-50"
            >
              <Bot className="w-3 h-3 inline mr-1" />Make NPC
            </button>
          )}
        </div>
      )}
    </div>
  );
}