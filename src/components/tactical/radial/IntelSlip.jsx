import React from "react";
import { X } from "lucide-react";
import { FIDELITY_LABEL } from "@/lib/tactical/intel";

const FID = { known: "text-brass-bright", est: "text-amber-500/90", dark: "text-muted-foreground" };
const STAMP = { confirmed: "text-brass-bright border-brass/60", probable: "text-amber-500 border-amber-600/50", unknown: "text-rust border-rust/50" };

// The intel file pulled on a hostile or neutral counter. Values are printed at
// whatever fidelity observation allows — estimates in amber, blanks in grey, so
// a player can see WHAT they don't know, not just what they do.
export default function IntelSlip({ standName, report, obs, onClose }) {
  return (
    <div className="cq-slip p-2.5 w-60">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <p className="cq-label text-rust">{report.title}</p>
          <p className="font-mono text-[9px] text-brass-bright tracking-widest truncate">{standName}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-rust shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <span className={`cq-tag ${STAMP[obs.level]}`}>{FIDELITY_LABEL[obs.level]}</span>

      <div className="mt-2 space-y-1">
        {report.rows.map((r) => (
          <div key={r.k} className="flex items-baseline justify-between gap-2 border-b border-border/60 pb-0.5">
            <span className="font-mono text-[9px] text-muted-foreground tracking-widest">{r.k.toUpperCase()}</span>
            <span className={`font-mono text-[10px] text-right ${FID[r.fid]}`}>{r.v}</span>
          </div>
        ))}
      </div>

      <ul className="mt-2 space-y-0.5">
        {obs.reasons.map((why) => (
          <li key={why} className="font-mono text-[8px] text-muted-foreground leading-snug">
            · {why}
          </li>
        ))}
      </ul>
    </div>
  );
}