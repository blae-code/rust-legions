import React, { useState } from "react";
import { FolderArchive, ChevronRight } from "lucide-react";
import DispatchViewer from "@/components/game/DispatchViewer";

const OUTCOME_TAG = {
  captured: "border-brass/60 text-brass-bright",
  retreated: "border-steel/50 text-steel",
  repelled: "border-rust/60 text-rust",
};

// Filed battle records — open one to step back through its rounds
export default function DispatchArchive({ archives }) {
  const [open, setOpen] = useState(null);
  if (!archives || archives.length === 0) return null;
  return (
    <div className="cq-panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <FolderArchive className="w-3.5 h-3.5 text-brass" />
        <h3 className="cq-label">Dispatch Archive</h3>
        <span className="ml-auto font-mono text-[9px] text-muted-foreground">{archives.length} FILED</span>
      </div>
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {[...archives].reverse().map((b) => (
          <button
            key={b.id}
            onClick={() => setOpen(b)}
            className="w-full flex items-center gap-2 border border-border rounded-sm bg-background/50 px-2.5 py-2 text-left hover:border-brass/60 transition-colors group"
          >
            <div className="min-w-0 flex-1">
              <p className="font-heading text-xs tracking-wide text-secondary-foreground truncate group-hover:text-brass-bright transition-colors">
                Battle of {b.tileName}
              </p>
              <p className="font-mono text-[9px] text-muted-foreground">TURN {b.turn} · {b.rounds} ROUNDS</p>
            </div>
            <span className={`cq-tag ${OUTCOME_TAG[b.outcome] || "border-border text-muted-foreground"}`}>{b.outcome}</span>
            <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-brass-bright" />
          </button>
        ))}
      </div>
      <DispatchViewer battle={open} onClose={() => setOpen(null)} />
    </div>
  );
}