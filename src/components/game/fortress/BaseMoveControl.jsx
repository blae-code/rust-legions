import React from "react";
import { BASE_MOVE_COST } from "@/lib/baseModules";
import { costString } from "@/lib/units";

const ROUGH = ["mountains", "highlands", "marsh"];

export default function BaseMoveControl({ base, game, busy, onMove }) {
  const baseTile = game.tiles.find((t) => t.id === base.tileId);
  const destinations = (baseTile?.adjacentIds || [])
    .map((id) => game.tiles.find((t) => t.id === id))
    .filter((t) => t && !t.isSea && t.state?.owner === game.mySlot);

  return (
    <div className="mt-3 border-t border-border pt-2.5">
      <div className="flex items-center justify-between">
        <p className="cq-label">Great Treads</p>
        <span className="font-mono text-[9px] text-muted-foreground">{costString(BASE_MOVE_COST)} / MOVE</span>
      </div>
      {!base.canMove ? (
        <p className="font-mono text-[9px] text-rust mt-1 tracking-widest">NO ENGINE MODULE — THE BASE CANNOT MOVE</p>
      ) : base.movedThisTurn ? (
        <p className="font-mono text-[9px] text-muted-foreground mt-1 tracking-widest">THE TREADS HAVE GROUND FORWARD THIS TURN</p>
      ) : destinations.length === 0 ? (
        <p className="font-mono text-[9px] text-muted-foreground mt-1 tracking-widest">NO FRIENDLY GROUND ADJACENT</p>
      ) : (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {destinations.map((t) => {
            const blocked = ROUGH.includes(t.terrain) && !base.allTerrain;
            return (
              <button key={t.id} disabled={busy || !game.isMyTurn || blocked}
                title={blocked ? "Too rough — requires Leviathan Turbines" : `Crawl to ${t.name}`}
                onClick={() => onMove(t.id)}
                className="font-heading uppercase tracking-widest text-[10px] border border-border rounded-sm px-2 py-1 text-secondary-foreground hover:border-brass/60 hover:text-brass-bright disabled:opacity-40 transition-colors">
                {t.name}{blocked && " ⛰"}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}