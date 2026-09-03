import React, { useState } from "react";
import { ANIM_STATES, SQUAD_KITS } from "@/lib/tactical/spriteAnim";
import SquadSprite from "./sprites/SquadSprite";

// The proving bench: every animation state of every kitted type, playing at
// once, so a pose can be judged without starting a battle.
export default function SpriteBench() {
  const [type, setType] = useState("riflemen");

  return (
    <div className="cq-panel p-3.5">
      <p className="cq-label text-rust mb-2.5">Sprite Proving Bench</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {Object.entries(SQUAD_KITS).map(([k, kit]) => (
          <button
            key={k}
            onClick={() => setType(k)}
            className={`cq-metal font-heading uppercase tracking-widest text-[10px] px-2.5 py-1 rounded-sm border transition-colors ${
              type === k ? "border-brass text-brass-bright bg-brass/10" : "border-border text-secondary-foreground hover:border-brass/60"
            }`}
          >
            {kit.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ANIM_STATES.map((s) => (
          <div key={s} className="border border-border rounded-sm bg-background/50 p-1.5">
            <svg viewBox="-26 -26 52 34" className="w-full h-auto">
              <g transform="translate(0,4)">
                <SquadSprite type={type} state={s} scale={0.78} />
              </g>
            </svg>
            <p className="cq-label text-center mt-1">{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}