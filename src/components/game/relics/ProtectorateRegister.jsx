import React from "react";
import { X, Building2 } from "lucide-react";
import { protectorateReport } from "@/lib/protectorate";
import { RESOURCE_META } from "@/lib/units";
import ProtectorateRow from "@/components/game/relics/ProtectorateRow";

const RES = ["manpower", "steel", "fuel"];

// The Protectorate Register — one desk for every settlement you've taken:
// its filed history, the terms standing with its populace, and what it pays you.
export default function ProtectorateRegister({ open, onClose, game }) {
  if (!open) return null;
  const { entries, totals, unsettled } = protectorateReport(game);

  return (
    <div className="fixed inset-0 z-[75] flex items-start justify-center overflow-y-auto p-4 bg-black/70">
      <div className="cq-panel cq-brackets relative overflow-hidden w-full max-w-2xl my-8 p-5">
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-brass-bright">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 pt-1">
          <Building2 className="w-4 h-4 text-brass" />
          <p className="cq-label">Protectorate Register</p>
        </div>
        <h2 className="cq-display text-2xl mt-1">Settlements Under Your Flag</h2>

        {entries.length === 0 ? (
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest mt-4">
            NO SURVEYED SETTLEMENTS UNDER YOUR FLAG — MARCH IN AND THE SURVEY PARTIES WILL FILE THEM.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4 mt-3 border-y border-border py-2">
              <span className="font-mono text-[10px] text-muted-foreground tracking-widest">
                {entries.length} HELD · {unsettled} AWAITING TERMS
              </span>
              <span className="font-mono text-[10px] text-muted-foreground tracking-widest ml-auto">DAILY TRIBUTE</span>
              {RES.map((k) => (
                <span key={k} className="inline-flex items-center gap-1 font-mono text-xs text-brass-bright">
                  <span>{RESOURCE_META[k]?.icon}</span> +{totals[k]}
                </span>
              ))}
            </div>
            <div className="space-y-2 mt-3">
              {entries.map((e) => <ProtectorateRow key={e.id} entry={e} />)}
            </div>
            <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-3">
              TERMS ARE CUT AT THE GOVERNOR'S DESK.
            </p>
          </>
        )}
      </div>
    </div>
  );
}