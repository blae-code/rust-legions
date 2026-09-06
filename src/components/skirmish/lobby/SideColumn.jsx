import React from "react";
import { Bot, UserPlus } from "lucide-react";
import { seatsOn, sideSpent } from "@/lib/skirmish/lobby";
import SeatRow from "./SeatRow";

const LABEL = { attacker: "Attacking Command", defender: "Defending Command" };
const EDGE = { attacker: "border-t-rust", defender: "border-t-steel" };

// One side of the field: its seated commanders and shared allowance, or the
// machine standing in for it, plus the door to sit down here.
export default function SideColumn({ side, lobby, scenario, me, onJoin }) {
  const seats = seatsOn(lobby, side);
  const spent = sideSpent(lobby, side);
  const over = spent > scenario.points;
  return (
    <div className={`cq-panel p-3 border-t-4 ${EDGE[side]} space-y-2`}>
      <div className="flex items-baseline justify-between">
        <p className="cq-label text-foreground/90">{LABEL[side]}</p>
        <span className={`font-mono text-[10px] ${over ? "text-rust" : "text-brass"}`}>
          {spent} / {scenario.points}
        </span>
      </div>
      {seats.length === 0 ? (
        <div className="flex items-center gap-2 px-2 py-2 rounded-sm border border-dashed border-border">
          <Bot className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="font-heading uppercase tracking-widest text-[11px] text-secondary-foreground">Machine Command</p>
            <p className="font-mono text-[9px] text-muted-foreground tracking-widest">
              BUYS TO {lobby.doctrine?.toUpperCase()} DOCTRINE UNLESS SEATED
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {seats.map((s) => (
            <SeatRow key={s.userId} seat={s} isMe={s.userId === me?.userId} isHost={s.userId === lobby.hostUserId} />
          ))}
        </div>
      )}
      {me?.side !== side && (
        <button
          onClick={() => onJoin(side)}
          className="cq-metal w-full flex items-center justify-center gap-1.5 rounded-sm border border-brass/50 py-1.5 font-heading uppercase tracking-widest text-[10px] text-brass-bright"
        >
          <UserPlus className="w-3 h-3" /> {me ? "Switch To This Side" : "Take A Seat Here"}
        </button>
      )}
    </div>
  );
}