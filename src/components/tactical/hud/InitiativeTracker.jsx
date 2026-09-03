import React, { useMemo } from "react";
import { buildOrder } from "@/lib/tactical/initiative";
import { assess } from "@/lib/tactical/intel";
import InitiativeChip from "./InitiativeChip";

// The floating acting queue. It rides over the board and shows only what the
// viewing side has earned the right to see: its own counters always, hostile
// ones only while they are observed. Everything else is an unknown plate.
export default function InitiativeTracker({ stands, field, viewSide, selectedId, onPick }) {
  const viewers = useMemo(() => stands.filter((s) => s.side === viewSide), [stands, viewSide]);

  const queue = useMemo(() => {
    const order = buildOrder(stands, field, field.meta.weather);
    return order.map((e) => ({
      ...e,
      seen:
        e.stand.side === viewSide ||
        assess(e.stand, viewers, field.meta.weather).level !== "unknown",
    }));
  }, [stands, field, viewSide, viewers]);

  const hidden = queue.filter((e) => !e.seen).length;

  return (
    <div className="cq-slip px-2 py-1.5 max-w-full">
      <div className="flex items-center justify-between mb-1">
        <p className="cq-label text-rust">Order of Action</p>
        <p className="font-mono text-[8px] tracking-widest text-muted-foreground">
          {hidden > 0 ? `${hidden} UNOBSERVED` : "FULL PICTURE"}
        </p>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {queue.map((e, i) => (
          <InitiativeChip
            key={e.stand.id}
            entry={e}
            index={i}
            seen={e.seen}
            active={e.stand.id === selectedId}
            onPick={onPick}
          />
        ))}
      </div>
    </div>
  );
}