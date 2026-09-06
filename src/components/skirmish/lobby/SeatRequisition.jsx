import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { newUid, costOf } from "@/lib/skirmish/roster";
import RosterShop from "@/components/skirmish/RosterShop";
import ForceSlip from "@/components/skirmish/ForceSlip";

// This commander's own requisition against the side's shared allowance.
export default function SeatRequisition({ seat, sideLeft, points, onForce, onReady }) {
  const items = seat.force || [];
  return (
    <div className="space-y-3">
      <div className="cq-panel p-3.5">
        <div className="flex items-center justify-between mb-2">
          <p className="cq-label text-rust">Your Requisition</p>
          <span className="font-mono text-[9px] text-muted-foreground tracking-widest">
            SIDE HAS {Math.max(0, sideLeft)} PTS LEFT
          </span>
        </div>
        <RosterShop left={sideLeft} onBuy={(type) => onForce([...items, { key: newUid(), type }])} />
      </div>
      <div className="cq-panel p-3.5">
        <ForceSlip
          items={items}
          points={points}
          spent={costOf(items)}
          onRemove={(key) => onForce(items.filter((it) => it.key !== key))}
          onClear={() => onForce([])}
        />
      </div>
      <button
        onClick={() => onReady(!seat.ready)}
        className={`cq-metal w-full flex items-center justify-center gap-2 rounded-sm border py-2.5 font-display uppercase tracking-[0.2em] ${
          seat.ready ? "border-olive/70 bg-olive/20 text-foreground" : "border-brass/60 text-brass-bright"
        }`}
      >
        {seat.ready ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
        {seat.ready ? "Ready — Stand Easy" : "Mark Ready"}
      </button>
    </div>
  );
}