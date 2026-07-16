import React, { useState } from "react";
import { BASE_MODULES, MODULE_SLOTS } from "@/lib/baseModules";
import { costString } from "@/lib/units";

export default function ModuleBay({ family, base, game, busy, onInstall }) {
  const [open, setOpen] = useState(false);
  const meta = MODULE_SLOTS[family];
  const installedKey = base.modules?.[family] || null;
  const installed = installedKey ? BASE_MODULES[installedKey] : null;
  const options = Object.entries(BASE_MODULES).filter(([k, m]) => m.slot === family && k !== installedKey);
  const canAfford = (cost) => Object.entries(cost).every(([k, v]) => (game.myResources?.[k] || 0) >= v);

  return (
    <div className="border border-border rounded-sm bg-secondary/30 p-2.5">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 text-left">
        <span>{meta.icon}</span>
        <span className="cq-label">{meta.label}</span>
        <span className={`ml-auto font-heading text-xs tracking-wide ${installed ? "text-brass-bright" : "text-muted-foreground"}`}>
          {installed ? installed.label : "EMPTY"}
        </span>
        <span className="text-muted-foreground text-xs">{open ? "▾" : "▸"}</span>
      </button>
      {installed && <p className="font-mono text-[9px] text-muted-foreground mt-1">{installed.desc}</p>}
      {open && (
        <div className="mt-2 space-y-1.5">
          {options.map(([key, m]) => (
            <button key={key} disabled={busy || !game.isMyTurn || !canAfford(m.cost)}
              onClick={() => onInstall(key)}
              className="w-full text-left border border-border rounded-sm p-2 hover:border-brass/60 hover:bg-brass/10 disabled:opacity-40 disabled:pointer-events-none transition-colors">
              <div className="flex justify-between gap-2">
                <span className="text-xs font-heading tracking-wide text-secondary-foreground">{m.label}</span>
                <span className="font-mono text-[9px] text-brass shrink-0">{costString(m.cost)}</span>
              </div>
              <p className="font-mono text-[9px] text-muted-foreground mt-0.5">{m.desc}</p>
            </button>
          ))}
          {!game.isMyTurn && <p className="font-mono text-[9px] text-muted-foreground tracking-widest">REFITS REQUIRE YOUR TURN</p>}
        </div>
      )}
    </div>
  );
}