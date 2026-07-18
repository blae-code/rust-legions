import React from "react";
import { MODULE_SLOTS, BASE_MODULES, computeBaseStats } from "@/lib/baseModules";
import { getImage } from "@/lib/imageLibrary";

// Hands-on refit drill — install modules into the three bays and watch the hull stats respond
export default function FortressDrill({ modules, onChange }) {
  const stats = computeBaseStats(modules);
  return (
    <div className="space-y-4">
      <p className="text-sm text-secondary-foreground font-body leading-relaxed">
        Your faction's heart is a <span className="text-brass-bright">mobile fortress-base</span> — a crawling city of steel.
        It has three module bays. What you bolt into them decides whether it is a shield, an engine, or a factory.
        Try fitting the training hull below.
      </p>
      {Object.entries(MODULE_SLOTS).map(([family, meta]) => (
        <div key={family}>
          <p className="cq-label mb-1.5">{meta.icon} {meta.label} — <span className="normal-case tracking-normal">{meta.blurb}</span></p>
          <div className="grid sm:grid-cols-2 gap-1.5">
            {Object.entries(BASE_MODULES).filter(([, m]) => m.slot === family && !m.unlock).map(([key, m]) => {
              const active = modules[family] === key;
              return (
                <button key={key}
                  onClick={() => onChange({ ...modules, [family]: active ? undefined : key })}
                  className={`cq-metal text-left rounded-sm border px-3 py-2 transition-colors ${
                    active ? "border-rust bg-rust/10" : "border-border hover:border-brass/60"
                  }`}>
                  <span className={`font-heading text-sm tracking-wide flex items-center gap-1.5 ${active ? "text-brass-bright" : "text-secondary-foreground"}`}>
                    {getImage(`mod_${key}`) && <img src={getImage(`mod_${key}`)} alt="" aria-hidden="true" className="w-6 h-6 object-contain shrink-0 rounded-sm select-none" />}
                    <span>{m.label} {active && <span className="text-rust text-[10px]">● FITTED</span>}</span>
                  </span>
                  <span className="block text-[10px] text-muted-foreground">{m.desc}</span>
                  <span className="block font-mono text-[9px] text-muted-foreground mt-0.5">
                    COST: {Object.entries(m.cost).map(([r, v]) => `${v} ${r.toUpperCase()}`).join(" · ")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="border border-brass/40 bg-secondary/40 rounded-sm px-4 py-2.5 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[10px] text-secondary-foreground">
        <span className="text-brass-bright">TRAINING HULL READOUT</span>
        <span>DEF +{stats.defense}</span>
        <span>{stats.moves > 0 ? `SPEED ${stats.moves} ZONE/TURN${stats.allTerrain ? " · ALL-TERRAIN" : ""}` : "IMMOBILE — NO ENGINE"}</span>
        <span>{stats.income ? Object.entries(stats.income).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(" ") : "NO ON-BOARD WORKS"}</span>
      </div>
    </div>
  );
}