import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { RadioTower } from "lucide-react";
import { getImage } from "@/lib/imageLibrary";

// Signals Intercepts — AI-generated NPC faction broadcasts, produced in the
// background by the npcHerald each turn and streamed into this feed.
export default function NpcIntercepts({ game }) {
  const [dispatches, setDispatches] = useState([]);
  const askedTurn = useRef(0);
  const hasNpcs = (game.factions || []).some((f) => f.isNPC && !f.eliminated);
  const colorOf = (name) => (game.factions || []).find((f) => f.factionName === name)?.color || "#8a8378";

  useEffect(() => {
    if (!hasNpcs || game.status !== "active") return;
    let alive = true;
    const load = async () => {
      const rows = await base44.entities.NpcDispatch.filter({ gameId: game.id }, "-created_date", 10);
      if (!alive) return;
      setDispatches(rows);
      // Herald runs in the background — one broadcast set per turn
      if (askedTurn.current !== game.turnNumber && !rows.some((r) => r.turnNumber === game.turnNumber)) {
        askedTurn.current = game.turnNumber;
        base44.functions.invoke("npcHerald", { gameId: game.id }).then(async (res) => {
          if (!alive || !res.data?.dispatches?.length) return;
          const fresh = await base44.entities.NpcDispatch.filter({ gameId: game.id }, "-created_date", 10);
          if (alive) setDispatches(fresh);
        }).catch(() => { /* the wire stays quiet — never blocks play */ });
      }
    };
    load();
    return () => { alive = false; };
  }, [game.id, game.turnNumber, game.status, hasNpcs]);

  if (!hasNpcs || dispatches.length === 0) return null;

  const masthead = getImage("press_signals_intercept");

  return (
    <div className="cq-panel p-3">
      {masthead ? (
        <div className="relative -mx-3 -mt-3 mb-2 h-12 overflow-hidden border-b border-border">
          <img src={masthead} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-70 select-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          <p className="cq-label absolute bottom-1 left-3 flex items-center gap-1.5">
            <RadioTower className="w-3 h-3 text-rust" /> Signals Intercepts
          </p>
        </div>
      ) : (
        <p className="cq-label flex items-center gap-1.5 mb-2">
          <RadioTower className="w-3 h-3 text-rust" /> Signals Intercepts
        </p>
      )}
      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
        {dispatches.map((d) => (
          <div key={d.id} className="text-xs">
            <div className="flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full ring-1 ring-black/50" style={{ background: colorOf(d.factionName) }} />
              <span className="text-secondary-foreground font-heading tracking-widest uppercase">{d.factionName}</span>
              <span>· T{d.turnNumber}</span>
              {d.mood && <span className="ml-auto text-brass/70 uppercase">{d.mood}</span>}
            </div>
            <p className="italic text-secondary-foreground/90 leading-snug mt-0.5 font-mono text-[11px]">“{d.text}”</p>
          </div>
        ))}
      </div>
    </div>
  );
}