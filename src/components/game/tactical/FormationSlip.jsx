import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import { X } from "lucide-react";
import { TROOP_KEYS, formationSize } from "@/lib/tactical/data";
import TroopStack from "@/components/game/tactical/TroopStack";
import FormationStats from "@/components/game/tactical/FormationStats";

// One sub-division — a stamped file card that accepts company chits
export default function FormationSlip({ formation, ordinal, onRename, onAdjust, onRemove, canRemove }) {
  const present = TROOP_KEYS.filter((k) => (formation.troops[k] || 0) > 0);
  const size = formationSize(formation.troops);
  return (
    <div className="cq-slip p-3.5 flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="cq-label text-brass/80 shrink-0">Sub-Division {ordinal}</p>
        {canRemove && (
          <button type="button" onClick={onRemove} className="p-0.5 text-muted-foreground hover:text-rust transition-colors" title="Strike this formation">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="cq-hazard mb-2.5 opacity-50" />
      <p className="font-mono text-[8px] text-muted-foreground tracking-[0.2em]">DESIGNATION</p>
      <input
        value={formation.name}
        maxLength={28}
        onChange={(e) => onRename(e.target.value)}
        className="w-full bg-transparent border-0 border-b border-border/70 focus:border-brass/60 outline-none font-display text-lg text-brass-bright tracking-[0.08em] leading-tight py-0.5 mb-2.5"
      />
      <Droppable droppableId={`form:${formation.id}`}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-1.5 rounded-sm border border-dashed p-1.5 min-h-[76px] transition-colors ${
              snapshot.isDraggingOver ? "border-brass bg-brass/10" : size === 0 ? "border-border/70" : "border-transparent"
            }`}
          >
            {present.map((k, i) => (
              <TroopStack key={k} id={`f:${formation.id}:${k}`} index={i} troop={k} count={formation.troops[k]} compact onAdjust={(d) => onAdjust(k, d)} />
            ))}
            {size === 0 && !snapshot.isDraggingOver && (
              <p className="font-mono text-[9px] text-muted-foreground/60 tracking-[0.2em] text-center py-5">DRAG COMPANIES FROM THE RESERVE</p>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <div className="mt-3"><FormationStats troops={formation.troops} /></div>
    </div>
  );
}