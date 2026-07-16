import React from "react";
import { RESOURCE_KEYS, RESOURCE_META } from "@/lib/units";

const STATUS_LABEL = { truce: "Ceasefire Truce", nap: "Non-Aggression Pact" };
const fmtRes = (r = {}) =>
  RESOURCE_KEYS.filter((k) => (r[k] || 0) > 0).map((k) => `${RESOURCE_META[k].icon}${r[k]}`).join(" ") || "—";

export default function AccordsLog({ accords = [], trades = [], turnNumber }) {
  return (
    <div className="mt-4 border border-border rounded-sm bg-background/60 p-3">
      <p className="cq-label mb-2">Standing Accords Ledger</p>
      {accords.length === 0 ? (
        <p className="text-[10px] font-mono text-muted-foreground">No accords currently in force — the front is at open war.</p>
      ) : (
        <div className="space-y-1.5">
          {accords.map((a, i) => {
            const left = a.until !== null ? a.until - turnNumber : null;
            return (
              <div key={i} className="flex items-center justify-between gap-2 text-[11px] font-mono border-l-2 border-brass/40 pl-2">
                <span className="text-secondary-foreground">
                  {a.aName} ⇆ {a.bName}
                  <span className="text-muted-foreground"> · {STATUS_LABEL[a.status] || a.status}</span>
                </span>
                {left !== null && (
                  <span className={`shrink-0 tracking-wide ${left <= 2 ? "text-rust" : "text-brass"}`}>
                    EXPIRES T{a.until} · {left} TURN{left === 1 ? "" : "S"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
      {trades.length > 0 && (
        <div className="mt-3">
          <p className="cq-label mb-1.5">Concluded Exchanges</p>
          <div className="space-y-1">
            {trades.map((t, i) => (
              <p key={i} className="text-[10px] font-mono text-muted-foreground border-l-2 border-border pl-2">
                T{t.turn} — {t.a} gave {fmtRes(t.give)} for {fmtRes(t.want)} from {t.b}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}