import React from "react";
import { PLATE_URLS } from "@/lib/imagePlates";
import { UNIT_TYPES, CARRIES_FUEL, ARM_LABEL } from "@/lib/tactical/orbat";
import { ACTIVITIES } from "@/lib/tactical/activities";
import LayerReadout from "./LayerReadout";

const Cell = ({ k, v, tone = "text-foreground" }) => (
  <div className="flex justify-between gap-2">
    <span className="cq-label">{k}</span>
    <span className={`font-mono text-[10px] ${tone}`}>{v}</span>
  </div>
);

// The selected / targeted stand's service card, as the bottom rail of the HUD.
export default function StandPanel({ stand, role }) {
  if (!stand) {
    return (
      <div className="cq-panel px-3 py-2 h-full flex items-center">
        <p className="font-mono text-[10px] text-muted-foreground tracking-widest">
          {role === "target" ? "NO TARGET DESIGNATED" : "NO STAND SELECTED — CLICK A COUNTER"}
        </p>
      </div>
    );
  }

  const type = UNIT_TYPES[stand.type];
  const url = PLATE_URLS[type.token];
  const fuel = CARRIES_FUEL.indexOf(type.arm) !== -1 ? stand.fuel : null;
  const edge = stand.side === "attacker" ? "border-l-rust" : "border-l-steel";

  return (
    <div className={`cq-panel px-3 py-2 h-full border-l-4 ${edge}`}>
      <div className="flex gap-3">
        {url && (
          <img src={url} alt="" className="w-16 h-16 object-cover rounded-sm border border-border shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="cq-display text-base leading-none truncate">{stand.name}</p>
            <span className="font-mono text-[9px] text-muted-foreground tracking-widest shrink-0">
              {stand.q},{stand.r}
            </span>
          </div>
          <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-0.5">
            {type.label.toUpperCase()} · {ARM_LABEL[type.arm].toUpperCase()}
            {stand.activity && (
              <span style={{ color: ACTIVITIES[stand.activity].tone }}>
                {" · "}
                {ACTIVITIES[stand.activity].label.toUpperCase()}
              </span>
            )}
          </p>
          <LayerReadout stand={stand} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1.5">
            <Cell k="Strength" v={`${stand.str} / ${type.maxStr}`} />
            <Cell k="Attack" v={type.atk} />
            <Cell k="Ammunition" v={stand.ammo} tone={stand.ammo > 0 ? "text-brass" : "text-rust"} />
            <Cell k="Defense" v={type.def} />
            <Cell k="Fuel" v={fuel === null ? "—" : fuel} />
            <Cell k="Entrenched" v={stand.entrench || 0} />
            <Cell k="Veterancy" v={"★".repeat(stand.vet || 0) || "—"} />
            <Cell
              k="Orders"
              v={stand.moved ? "Expended" : "Available"}
              tone={stand.moved ? "text-muted-foreground" : "text-olive"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}