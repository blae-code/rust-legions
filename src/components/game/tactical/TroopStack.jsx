import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Minus, Plus } from "lucide-react";
import UnitSprite from "@/components/game/sprites/UnitSprite";
import { TROOPS } from "@/lib/tactical/data";

// One draggable company stack — a brass-edged requisition chit
export default function TroopStack({ id, index, troop, count, compact = false, onAdjust }) {
  const t = TROOPS[troop];
  const empty = count <= 0;
  return (
    <Draggable draggableId={id} index={index} isDragDisabled={empty}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`cq-metal relative flex items-center gap-2 rounded-sm border px-2 py-1.5 select-none transition-colors ${
            snapshot.isDragging ? "border-brass-bright bg-brass/20 shadow-[0_0_14px_hsl(var(--brass)/0.35)]" :
            empty ? "border-border/50 opacity-40 cursor-not-allowed" : "border-border hover:border-brass/60 cursor-grab active:cursor-grabbing"
          }`}
        >
          <UnitSprite type={troop} className={compact ? "w-6 h-6 shrink-0" : "w-8 h-8 shrink-0"} style={{ filter: "invert(0.82) sepia(0.4)" }} />
          <div className="min-w-0 flex-1">
            <p className="font-heading uppercase tracking-[0.14em] text-[10px] text-secondary-foreground truncate">{t.label}</p>
            {!compact && (
              <p className="font-mono text-[8px] text-muted-foreground tracking-[0.12em]">
                SPD {t.speed} · ATK {t.attack} · DEF {t.defense} · RCH {t.reach}
                {t.from !== troop && <span className="text-brass/70"> · RETRAINED</span>}
              </p>
            )}
          </div>
          {onAdjust ? (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => onAdjust(-1)} className="p-0.5 rounded-sm border border-border text-muted-foreground hover:text-rust hover:border-rust/60"><Minus className="w-3 h-3" /></button>
              <span className="font-display text-base text-brass-bright w-5 text-center leading-none">{count}</span>
              <button type="button" onClick={() => onAdjust(1)} className="p-0.5 rounded-sm border border-border text-muted-foreground hover:text-brass-bright hover:border-brass/60"><Plus className="w-3 h-3" /></button>
            </div>
          ) : (
            <span className="font-display text-lg text-brass-bright leading-none px-1.5 border-l border-border/70">×{count}</span>
          )}
        </div>
      )}
    </Draggable>
  );
}