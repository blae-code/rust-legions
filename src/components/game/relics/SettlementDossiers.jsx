import React from "react";
import { ScrollText } from "lucide-react";

// Survey Registry — histories filed on settlements as they were first taken,
// with the stores the survey parties carted off.
export default function SettlementDossiers({ game }) {
  const dossiers = game.macro?.dossiers || [];
  const mine = game.mySlot;

  return (
    <div className="cq-panel p-3 space-y-2">
      <div className="flex items-center gap-2">
        <ScrollText className="w-3.5 h-3.5 text-brass" />
        <p className="cq-label">Survey Registry</p>
        <span className="ml-auto font-mono text-[9px] text-muted-foreground tracking-widest">{dossiers.length} FILED</span>
      </div>

      {dossiers.length === 0 ? (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          No settlements surveyed. Every unclaimed site kept its own history through the collapse —
          march in and your survey parties will file it, along with whatever stores remain.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {dossiers.slice().reverse().map((d) => (
            <div key={d.nodeId} className={`rounded-sm border px-2.5 py-1.5 ${d.foundBy === mine ? "border-brass/40 bg-brass/5" : "border-border bg-secondary/20"}`}>
              <p className="font-heading uppercase tracking-[0.14em] text-xs text-brass-bright">{d.title}</p>
              <p className="text-[11px] text-secondary-foreground leading-snug mt-0.5">{d.text}</p>
              <p className="font-mono text-[9px] text-muted-foreground tracking-wider mt-1">
                DAY {d.foundTurn} · SURVEYED BY {String(d.faction || "?").toUpperCase()} · TERMS{" "}
                {d.charter ? d.charter.toUpperCase() : "PENDING"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}