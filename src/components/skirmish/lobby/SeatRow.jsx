import React from "react";
import { Crown } from "lucide-react";
import { costOf } from "@/lib/skirmish/roster";

// One commander on the roll: callsign, what they have bought, and whether they are set.
export default function SeatRow({ seat, isMe, isHost }) {
  const n = (seat.force || []).length;
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-sm border ${
      isMe ? "border-brass/60 bg-brass/5" : "border-border"
    }`}>
      <span
        className={`w-2 h-2 rounded-full cq-lamp shrink-0 ${seat.ready ? "text-olive bg-olive" : "text-rust bg-rust"}`}
      />
      <div className="min-w-0 flex-1">
        <p className="font-heading uppercase tracking-widest text-[11px] text-foreground truncate flex items-center gap-1.5">
          {seat.callsign}
          {isHost && <Crown className="w-3 h-3 text-brass" />}
          {isMe && <span className="font-mono text-[8px] text-brass-bright">(YOU)</span>}
        </p>
        <p className="font-mono text-[9px] text-muted-foreground tracking-widest">
          {n} STAND{n === 1 ? "" : "S"} · {costOf(seat.force || [])} PTS · {seat.ready ? "READY" : "REQUISITIONING"}
        </p>
      </div>
    </div>
  );
}