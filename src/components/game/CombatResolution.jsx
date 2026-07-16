import React from "react";
import { X } from "lucide-react";
import { MODULE_SLOTS, BASE_MODULES } from "@/lib/baseModules";

const OUTCOME_META = {
  captured: { label: "Zone Captured", cls: "text-brass-bright border-brass/70" },
  repelled: { label: "Assault Repelled", cls: "text-rust border-rust/70" },
  retreated: { label: "Attackers Withdrew", cls: "text-muted-foreground border-border" },
};

const MOD_ROWS = [
  { key: "terrain", icon: "⛰", label: "Terrain" },
  { key: "elevation", icon: "↗", label: "Elevation" },
  { key: "fort", icon: "🏰", label: "Fortifications" },
];

// Post-combat resolution screen for quick attacks — losses, modifiers,
// and the defending fortress-base's module contribution.
export default function CombatResolution({ report, onClose }) {
  if (!report) return null;
  const meta = OUTCOME_META[report.outcome] || OUTCOME_META.retreated;
  const mods = report.modifiers || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="cq-panel relative w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>

        <p className="cq-label">Action at {report.tileName} · {report.rounds} round{report.rounds === 1 ? "" : "s"}</p>
        <p className={`cq-stamp inline-block mt-2 text-lg ${meta.cls}`}>{meta.label}</p>

        {/* Unit losses */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {[{ name: report.attacker, n: report.attLosses, tag: "Attacker" }, { name: report.defender, n: report.defLosses, tag: "Defender" }].map((s) => (
            <div key={s.tag} className="border border-border rounded-sm bg-secondary/20 p-2.5 text-center">
              <p className="font-mono text-[9px] text-muted-foreground tracking-widest">{s.tag.toUpperCase()}</p>
              <p className="text-xs font-heading tracking-wide text-secondary-foreground truncate">{s.name}</p>
              <p className="font-display text-2xl text-rust mt-1">−{s.n}</p>
              <p className="font-mono text-[9px] text-muted-foreground">COMPAN{s.n === 1 ? "Y" : "IES"} LOST</p>
            </div>
          ))}
        </div>

        {/* Battle modifiers */}
        <div className="mt-3 space-y-1">
          {MOD_ROWS.filter((r) => (mods[r.key] || 0) !== 0).map((r) => (
            <div key={r.key} className="flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>{r.icon} {r.label}</span>
              <span className="text-secondary-foreground">{mods[r.key] > 0 ? `+${mods[r.key]}` : mods[r.key]} {r.key === "elevation" ? "attack" : "defense"}</span>
            </div>
          ))}
          {mods.weather && mods.weather !== "clear" && (
            <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>☁ Weather</span><span className="text-secondary-foreground uppercase">{mods.weather}</span>
            </div>
          )}
        </div>

        {/* Fortress-base module impact */}
        {report.baseModules && (
          <div className="mt-3 border-t border-border pt-3">
            <p className="cq-label text-rust">Fortress-Base on the Field · +{mods.baseDefense || 1} defense</p>
            <div className="space-y-1 mt-1.5">
              {Object.entries(MODULE_SLOTS).map(([slot, sm]) => {
                const m = report.baseModules[slot] ? BASE_MODULES[report.baseModules[slot]] : null;
                return (
                  <div key={slot} className="flex justify-between font-mono text-[10px] text-muted-foreground">
                    <span>{sm.icon} {m ? m.label : `${sm.label} — empty`}</span>
                    <span className="text-secondary-foreground">{m?.defense ? `+${m.defense} defense` : m ? "no combat effect" : "—"}</span>
                  </div>
                );
              })}
              <p className="font-mono text-[9px] text-muted-foreground/70">Hull integrity contributes +1 defense.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}