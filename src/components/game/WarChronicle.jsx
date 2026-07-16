import React from "react";
import { RESOURCE_META, RESOURCE_LABELS, BUILDINGS } from "@/lib/units";

function CaptureLine({ e }) {
  return (
    <p className="text-xs text-secondary-foreground">
      <span className="text-brass-bright font-semibold">{e.faction}</span> seized{" "}
      <span className="font-semibold">{e.isCapital ? "★ " : ""}{e.tileName}</span> from {e.from}
      {e.resource && (
        <span className="text-olive"> · +{e.amount} {RESOURCE_META[e.resource]?.label || e.resource}/turn</span>
      )}
      {e.bonus && <span className="text-brass"> · {RESOURCE_LABELS[e.bonus] || e.bonus}</span>}
      {(e.buildings || []).length > 0 && (
        <span className="text-steel"> · captured {e.buildings.map((b) => BUILDINGS[b]?.label || b).join(", ")}</span>
      )}
    </p>
  );
}

function CombatLine({ e }) {
  return (
    <p className="text-xs text-muted-foreground">
      {e.attacker} assaulted {e.tileName} ({e.defender}) —{" "}
      {e.outcome === "captured" && <span className="text-olive">zone captured</span>}
      {e.outcome === "repelled" && <span className="text-rust">assault repelled</span>}
      {e.outcome === "retreated" && <span className="text-brass-bright">forces withdrew</span>}
      {" "}over {e.rounds} rounds · losses {e.attLosses}/{e.defLosses}
    </p>
  );
}

export default function WarChronicle({ entries = [] }) {
  const byTurn = {};
  for (const e of entries) (byTurn[e.turn] = byTurn[e.turn] || []).push(e);
  const turns = Object.keys(byTurn).map(Number).sort((a, b) => a - b);

  return (
    <div className="cq-panel cq-brackets p-5 relative overflow-hidden">
      <div className="cq-hazard absolute top-0 left-0 right-0" />
      <div className="pt-1 mb-4">
        <p className="cq-label text-brass">Ministry of War · Official Record</p>
        <h2 className="cq-display text-2xl">War Chronicle</h2>
      </div>
      <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-2">
        {turns.length === 0 && <p className="text-xs text-muted-foreground">No engagements were recorded in this war.</p>}
        {turns.map((t) => (
          <div key={t}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[10px] text-brass-bright tracking-widest">TURN {t}</span>
              <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            </div>
            <div className="space-y-1 border-l-2 border-brass/30 pl-3">
              {byTurn[t].map((e, i) =>
                e.type === "capture" ? (
                  <CaptureLine key={i} e={e} />
                ) : e.type === "event" ? (
                  <p key={i} className="text-xs text-brass italic">{e.text}</p>
                ) : (
                  <CombatLine key={i} e={e} />
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}