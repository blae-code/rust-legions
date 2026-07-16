import React from "react";
import { Button } from "@/components/ui/button";
import ReportForce from "@/components/game/ReportForce";

const OUTCOME_TEXT = {
  captured: "ZONE CAPTURED",
  retreated: "ATTACK REPULSED — SURVIVORS WITHDRAW",
  repelled: "ATTACKING FORCE DESTROYED",
};

export default function BattleReport({ report, onClose }) {
  if (!report) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="cq-panel cq-brackets w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 relative">
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <div className="text-center pt-2 mb-1">
          <p className="cq-label text-rust">After-Action Report · Turn {report.turn}</p>
          <h2 className="cq-display text-2xl">The Battle of {report.tileName}</h2>
        </div>
        <div className="flex justify-center my-3">
          <span className="cq-stamp text-sm">{OUTCOME_TEXT[report.outcome] || report.outcome}</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mb-4 font-mono text-[9px] text-steel">
          <span className="border border-border rounded-sm px-2 py-0.5">ROUNDS FOUGHT: {report.rounds}</span>
          {report.terrainBonus > 0 && (
            <span className="border border-border rounded-sm px-2 py-0.5">{report.terrain?.toUpperCase()} TERRAIN · DEFENDER +{report.terrainBonus}</span>
          )}
          {report.fortBonus > 0 && (
            <span className="border border-border rounded-sm px-2 py-0.5">FORTIFICATIONS · DEFENDER +{report.fortBonus}</span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <ReportForce side={report.attacker} title="Attacker" accent="#C9752E" won={report.outcome === "captured"} />
          <ReportForce side={report.defender} title="Defender" accent="#7A93A5" won={report.outcome !== "captured"} />
        </div>
        <div className="text-center">
          <Button size="sm" onClick={onClose}>File Report</Button>
        </div>
      </div>
    </div>
  );
}