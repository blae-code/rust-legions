import React from "react";
import { UNIT_MARCH } from "@/lib/macro/march";
import { ROUTE_QUALITY, nodeById } from "@/lib/macro/graph";

// Column composition + march itinerary. The slowest ground element sets the pace.
// `nodeName` resolves a node id to a display name; defaults to the global continent
// graph (Macro Lab) but the 3D planet map passes its own per-planet lookup.
export default function MarchPlanner({ regiments, setRegiments, dayRate, origin, dest, plan, nodeName }) {
  const name = nodeName || ((id) => nodeById(id)?.name || "");
  const step = (k, d) => setRegiments((r) => ({ ...r, [k]: Math.max((r[k] || 0) + d, 0) }));

  return (
    <div className="space-y-3">
      <div className="cq-panel p-4">
        <p className="cq-label mb-2">Column Composition</p>
        {Object.entries(UNIT_MARCH).map(([k, def]) => (
          <div key={k} className="flex items-center gap-2 py-1 text-xs">
            <span className="font-heading tracking-wide text-secondary-foreground w-20">{def.label}</span>
            <span className="font-mono text-[9px] text-muted-foreground">
              {def.ground ? `${def.rate} MI/DAY` : "AIR — NO DRAG"}
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <button onClick={() => step(k, -1)} className="cq-metal w-5 h-5 rounded-sm border border-border text-muted-foreground hover:text-brass-bright leading-none">−</button>
              <span className="font-mono w-5 text-center text-foreground">{regiments[k] || 0}</span>
              <button onClick={() => step(k, 1)} className="cq-metal w-5 h-5 rounded-sm border border-border text-muted-foreground hover:text-brass-bright leading-none">+</button>
            </div>
          </div>
        ))}
        <div className="cq-hazard my-2" />
        <p className="font-mono text-[10px] tracking-widest">
          <span className="text-muted-foreground">COLUMN PACE: </span>
          {dayRate ? <span className="text-brass-bright">{dayRate} MI/DAY</span> : <span className="text-rust">NO GROUND ELEMENTS</span>}
        </p>
      </div>

      <div className="cq-panel p-4">
        <p className="cq-label mb-2">March Itinerary</p>
        {!origin && <p className="font-mono text-[10px] text-muted-foreground">CLICK A NODE TO SET THE ORIGIN.</p>}
        {origin && !dest && <p className="font-mono text-[10px] text-muted-foreground">ORIGIN: {name(origin).toUpperCase()} — CLICK A DESTINATION.</p>}
        {origin && dest && !plan && <p className="font-mono text-[10px] text-rust">NO PASSABLE ROUTE — FIELD GROUND ELEMENTS FIRST.</p>}
        {plan && (
          <>
            <div className="space-y-1">
              {plan.legs.map((leg, i) => (
                <div key={i} className="flex items-baseline gap-2 text-xs border-b border-border/50 pb-1">
                  <span className="font-mono text-[9px] text-muted-foreground w-4">{i + 1}.</span>
                  <span className="font-heading tracking-wide text-secondary-foreground">
                    {name(leg.from)} → {name(leg.to)}
                  </span>
                  <span className="ml-auto font-mono text-[9px] text-muted-foreground shrink-0">
                    {leg.miles} MI · {ROUTE_QUALITY[leg.quality].label.toUpperCase()} · {leg.days.toFixed(1)} D
                  </span>
                </div>
              ))}
            </div>
            <p className="font-mono text-[10px] tracking-widest mt-2">
              <span className="text-muted-foreground">TOTAL: </span>
              <span className="text-brass-bright">{plan.totalDays.toFixed(1)} DAYS</span>
              <span className="text-muted-foreground"> — ARRIVES DAY {plan.arrivalDay}</span>
            </p>
          </>
        )}
      </div>

      <div className="cq-panel p-4">
        <p className="cq-label mb-1.5">Route Grades</p>
        {Object.entries(ROUTE_QUALITY).map(([k, q]) => (
          <p key={k} className="font-mono text-[9px] text-muted-foreground py-0.5">
            <span className="text-secondary-foreground">{q.label.toUpperCase()}</span> — ×{q.mult} PACE · {q.desc.toUpperCase()}
          </p>
        ))}
      </div>
    </div>
  );
}