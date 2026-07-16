import React, { useState, useEffect, useMemo, useRef } from "react";
import { UNIT_KEYS, UNIT_TYPES } from "@/lib/units";
import UnitSprite from "@/components/game/sprites/UnitSprite";

// Strike order for the round — fastest units act first; attacker wins speed ties
export default function InitiativeTracker({ attacker, defender, round }) {
  const [active, setActive] = useState(0);
  const prevRound = useRef(round);

  const order = useMemo(() => {
    const entries = [];
    for (const [side, force, accent] of [["att", attacker, "#C9752E"], ["def", defender, "#7A93A5"]]) {
      for (const k of UNIT_KEYS) {
        if ((force.units[k] || 0) > 0) entries.push({ id: `${side}-${k}`, side, key: k, count: force.units[k], speed: UNIT_TYPES[k].speed, accent });
      }
    }
    return entries.sort((a, b) => b.speed - a.speed || (a.side === "att" ? -1 : 1));
  }, [attacker, defender]);

  // Round resolved — sweep the marker down the strike order, then reset for the new round
  useEffect(() => {
    if (round === prevRound.current) return;
    prevRound.current = round;
    let i = 0;
    const t = setInterval(() => {
      i++;
      if (i >= order.length) { clearInterval(t); setActive(0); }
      else setActive(i);
    }, 300);
    return () => clearInterval(t);
  }, [round, order.length]);

  if (order.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <p className="cq-label">Initiative Order</p>
        <p className="font-mono text-[9px] text-muted-foreground tracking-widest">FASTEST STRIKES FIRST</p>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {order.map((e, i) => {
          const isNext = i === active;
          return (
            <div
              key={e.id}
              className={`relative shrink-0 w-16 border rounded-sm px-1.5 pt-1 pb-1.5 text-center transition-all duration-300 ${
                isNext ? "border-brass bg-brass/15 -translate-y-0.5" : i < active ? "border-border opacity-35" : "border-border bg-secondary/30"
              }`}
            >
              {isNext && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 cq-tag border-brass/70 bg-background text-brass-bright px-1 text-[8px]">Next</span>
              )}
              <div className="h-0.5 rounded-full mb-1" style={{ background: e.accent }} />
              <div className="flex justify-center">
                <UnitSprite type={e.key} facing={e.side === "def" ? "left" : "right"} className="w-6 h-6" />
              </div>
              <p className="font-mono text-[8px] text-muted-foreground leading-tight truncate">{UNIT_TYPES[e.key].label}</p>
              <p className="font-mono text-[8px] tracking-wider">
                <span className="text-brass-bright">SPD {e.speed}</span>
                <span className="text-muted-foreground"> ×{e.count}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}