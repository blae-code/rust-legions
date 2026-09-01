import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, DoorOpen } from "lucide-react";
import { playSfx } from "@/lib/sfx";

export default function OpenFrontsPanel() {
  const [fronts, setFronts] = useState(null);

  useEffect(() => {
    base44.functions
      .invoke("openFronts", {})
      .then((r) => setFronts(r.data.games || []))
      .catch(() => setFronts([]));
  }, []);

  return (
    <div className="cq-panel p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="cq-label flex items-center gap-1.5"><DoorOpen className="w-3 h-3" /> Open Fronts</p>
        <span className="font-mono text-[9px] text-muted-foreground">{fronts?.length ?? 0} MUSTERING</span>
      </div>
      {fronts === null ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : fronts.length === 0 ? (
        <p className="font-mono text-[10px] text-muted-foreground tracking-widest py-2 text-center">
          NO FRONTS AWAIT COMMANDERS
        </p>
      ) : (
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {fronts.map((g) => (
            <Link
              key={g.id}
              to={`/game/${g.id}`}
              onClick={() => playSfx("select")}
              className="block px-2.5 py-1.5 rounded-sm border border-border hover:border-brass/60 bg-secondary/30 transition-colors"
            >
              <p className="font-heading uppercase tracking-widest text-xs text-secondary-foreground truncate">{g.name}</p>
              <p className="font-mono text-[9px] text-muted-foreground">
                {g.openSlots} SEAT{g.openSlots === 1 ? "" : "S"} OPEN · {g.playerCount} FACTIONS · {g.planetId.toUpperCase()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}