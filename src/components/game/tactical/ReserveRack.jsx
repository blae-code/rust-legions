import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import { TROOPS, TROOP_KEYS, COLUMN_KEYS } from "@/lib/tactical/data";
import TroopStack from "@/components/game/tactical/TroopStack";

// The uncommitted reserve — drag chits out to a formation, drop them back to return
export default function ReserveRack({ remaining }) {
  const total = COLUMN_KEYS.reduce((s, k) => s + Math.max(remaining[k] || 0, 0), 0);
  return (
    <div className="cq-slip p-3.5 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <p className="cq-label text-brass/80">Column Reserve</p>
        <span className="cq-tag text-brass border-brass/50">{total} uncommitted</span>
      </div>
      <div className="cq-hazard mb-2.5 opacity-50" />
      <Droppable droppableId="pool">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-1.5 rounded-sm p-1 -m-1 transition-colors ${snapshot.isDraggingOver ? "bg-olive/10 ring-1 ring-olive/50" : ""}`}
          >
            {TROOP_KEYS.map((k, i) => (
              <TroopStack key={k} id={`pool-${k}`} index={i} troop={k} count={Math.max(remaining[TROOPS[k].from] || 0, 0)} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <p className="font-mono text-[8px] text-muted-foreground/70 tracking-[0.15em] leading-relaxed mt-3">
        MACHINE-GUN CREWS AND SCOUT SECTIONS ARE RIFLE COMPANIES RETRAINED IN THE FIELD — EACH DRAWS ONE FROM THE RIFLE RESERVE.
      </p>
    </div>
  );
}