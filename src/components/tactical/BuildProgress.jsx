import React from "react";

// The visible build ledger for the tactical art programme. Update a row's state
// as each batch lands so this page always reports the true position.
const BATCHES = [
  { id: "B1", label: "Hex Terrain Tiles", note: "16 terrain keys · 3 elevations · works", state: "done" },
  { id: "B2", label: "Unit Counters", note: "13 types · strength/ammo/fuel · vet & works", state: "done" },
  { id: "B3", label: "Command HUD", note: "orbat, signals, service cards, forecast", state: "done" },
  { id: "B4", label: "Orders & Movement", note: "move range, fire arcs, 16 order cards", state: "next" },
  { id: "B5", label: "Combat FX", note: "muzzle, burst, penetration, smoke", state: "pending" },
  { id: "B6", label: "Battle Audio", note: "per-class fire, impacts, beds", state: "pending" },
];

const TONE = {
  done: "border-olive/60 text-olive",
  next: "border-brass text-brass-bright",
  pending: "border-border text-muted-foreground",
};
const MARK = { done: "IN SERVICE", next: "IN WORKS", pending: "REQUISITIONED" };

export default function BuildProgress() {
  return (
    <div className="cq-panel p-3.5">
      <p className="cq-label text-rust mb-2.5">Establishment Progress</p>
      <div className="space-y-1.5">
        {BATCHES.map((b) => (
          <div key={b.id} className={`border rounded-sm p-2 ${TONE[b.state]}`}>
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs font-heading tracking-wide">
                {b.id} · {b.label}
              </span>
              <span className="font-mono text-[9px] tracking-widest shrink-0">{MARK[b.state]}</span>
            </div>
            <p className="font-mono text-[9px] text-muted-foreground mt-0.5">{b.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}