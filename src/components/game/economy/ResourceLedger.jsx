import React from "react";
import { RESOURCE_KEYS, RESOURCE_META } from "@/lib/units";

// Stockpile totals + per-zone production table
export default function ResourceLedger({ resources = {}, production = {}, zones = [] }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {RESOURCE_KEYS.map((k) => (
          <div key={k} className="cq-panel p-3 text-center">
            <p className="cq-label">{RESOURCE_META[k].label}</p>
            <p className="font-display text-2xl text-brass-bright mt-1">{RESOURCE_META[k].icon} {resources[k] || 0}</p>
            <p className="font-mono text-[10px] text-olive mt-0.5">+{production[k] || 0} / turn</p>
          </div>
        ))}
      </div>
      <div>
        <p className="cq-label mb-1.5">Zone production ledger</p>
        <div className="border border-border rounded-sm max-h-64 overflow-y-auto">
          <table className="w-full text-[11px] font-mono">
            <thead className="sticky top-0 bg-card">
              <tr className="text-muted-foreground text-left">
                <th className="px-2 py-1.5 font-normal">Zone</th>
                {RESOURCE_KEYS.map((k) => <th key={k} className="px-2 py-1.5 font-normal text-right">{RESOURCE_META[k].short}</th>)}
                <th className="px-2 py-1.5 font-normal text-right">Supply</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id} className="border-t border-border/60 text-secondary-foreground">
                  <td className="px-2 py-1.5">
                    {z.name}
                    {z.isCapital && <span className="text-brass"> ★</span>}
                    {z.bonus && <span className="text-olive"> ◈</span>}
                  </td>
                  {RESOURCE_KEYS.map((k) => (
                    <td key={k} className={`px-2 py-1.5 text-right ${z.production[k] ? "" : "text-muted-foreground/40"}`}>{z.production[k] || "—"}</td>
                  ))}
                  <td className={`px-2 py-1.5 text-right ${z.inSupply ? "text-olive" : "text-rust"}`}>{z.inSupply ? "OPEN" : "CUT"}</td>
                </tr>
              ))}
              {zones.length === 0 && (
                <tr><td colSpan={5} className="px-2 py-3 text-center text-muted-foreground">No zones under your control</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}