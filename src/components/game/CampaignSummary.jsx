import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

// Final campaign summary — compiles each commander's record when the war ends
// and files it automatically to the War Ministry spreadsheet ledger.
export default function CampaignSummary({ gameId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.functions.invoke("logCampaignSummary", { gameId })
      .then((res) => setData(res.data))
      .catch((e) => setError(e.response?.data?.error || "Failed to file the summary report"));
  }, [gameId]);

  return (
    <div className="cq-panel cq-brackets relative overflow-hidden p-5">
      <div className="cq-hazard absolute top-0 left-0 right-0" />
      <div className="flex items-start justify-between gap-4 pt-1">
        <div>
          <p className="cq-label text-rust">Ministry of War · Office of Records</p>
          <h2 className="cq-display text-2xl">Final Campaign Summary</h2>
        </div>
        {data ? (
          <span className="cq-stamp text-xs mt-1">Filed</span>
        ) : !error ? (
          <span className="flex items-center gap-2 font-mono text-[9px] text-muted-foreground tracking-widest mt-2">
            <Loader2 className="w-3 h-3 animate-spin" /> FILING TO LEDGER…
          </span>
        ) : null}
      </div>
      {error && <p className="text-xs text-rust font-mono mt-3">{error}</p>}
      {data && (
        <div className="mt-4 space-y-3">
          {data.summary.map((r) => (
            <div key={r.faction} className="border border-border rounded-sm px-4 py-3 bg-secondary/30">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-heading uppercase tracking-widest text-sm text-foreground">{r.faction}</span>
                <span className={`cq-tag ${r.outcome === "Victory" ? "border-brass/60 text-brass-bright" : r.outcome === "Eliminated" ? "border-rust/60 text-rust" : "border-border text-muted-foreground"}`}>
                  {r.outcome}
                </span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground tracking-widest">
                  CAREER VICTORIES: {r.totalWins}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 mt-2 font-mono text-[10px] text-secondary-foreground tracking-wider">
                <span title="Manpower at war's end">⚑ MP {r.resources.manpower}</span>
                <span title="Steel at war's end">⚙ ST {r.resources.steel}</span>
                <span title="Fuel at war's end">⛽ FU {r.resources.fuel}</span>
              </div>
              {r.milestones.length > 0 && (
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  <span className="text-brass">Milestones:</span> {r.milestones.join(" · ")}
                </p>
              )}
            </div>
          ))}
          <p className="font-mono text-[9px] text-muted-foreground/70 tracking-widest">
            {data.alreadyLogged ? "PREVIOUSLY FILED — LEDGER UNCHANGED" : "APPENDED TO THE WAR RECORD · CAMPAIGN SUMMARY"}
          </p>
        </div>
      )}
    </div>
  );
}