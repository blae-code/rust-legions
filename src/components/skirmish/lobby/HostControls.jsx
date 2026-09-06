import React from "react";
import { Swords } from "lucide-react";
import { isHuman } from "@/lib/skirmish/lobby";
import OpponentPanel from "@/components/skirmish/OpponentPanel";

// The host's end of the table: the machine's doctrine for any empty side, and
// the order that fields everyone at once.
export default function HostControls({ lobby, block, onDoctrine, onLaunch }) {
  const machineSide = ["attacker", "defender"].find((s) => !isHuman(lobby, s));
  return (
    <div className="cq-slip p-3 space-y-3">
      <p className="cq-label text-rust">Host Orders</p>
      {machineSide ? (
        <div>
          <p className="cq-label mb-1.5">Machine Doctrine · {machineSide}</p>
          <OpponentPanel doctrine={lobby.doctrine} onDoctrine={onDoctrine} />
        </div>
      ) : (
        <p className="font-mono text-[9px] text-muted-foreground tracking-widest">
          BOTH SIDES UNDER HUMAN COMMAND
        </p>
      )}
      <button
        disabled={!!block}
        onClick={onLaunch}
        className="cq-metal w-full flex items-center justify-center gap-2 rounded-sm border border-brass/60 bg-rust/80 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 font-display uppercase tracking-[0.2em] text-primary-foreground"
      >
        <Swords className="w-4 h-4" /> Take The Field
      </button>
      {block && (
        <p className="font-mono text-[9px] text-muted-foreground tracking-widest text-center">{block}</p>
      )}
    </div>
  );
}