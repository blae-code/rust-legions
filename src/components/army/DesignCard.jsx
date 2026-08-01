import React, { useState } from "react";
import { Trash2, Check, X } from "lucide-react";
import { SLOT_KEYS, DESIGN_SLOTS, DEFAULT_DESIGN } from "@/lib/armyDesign";

// A filed pattern on the shelf — clicking the card recalls it into the drafting
// table. Striking a pattern from the register takes a second, deliberate press.
export default function DesignCard({ design, active, onRecall, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  const summary = SLOT_KEYS
    .map((s) => DESIGN_SLOTS[s].options[design[s] ?? DEFAULT_DESIGN[s]]?.label)
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      role="button"
      tabIndex={0}
      title="Recall this pattern"
      onClick={() => onRecall(design)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRecall(design); } }}
      className={`cq-panel p-3 cursor-pointer transition-colors ${active ? "border-brass" : "hover:border-brass/50"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-heading font-semibold text-sm tracking-wide text-foreground">{design.name || "Unnamed Pattern"}</p>
        {confirming ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              title="Confirm — strike this pattern from the register"
              onClick={(e) => { e.stopPropagation(); setConfirming(false); onDelete(design.id); }}
              className="text-rust hover:text-destructive"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              title="Keep the pattern"
              onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
              className="text-muted-foreground hover:text-brass-bright"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            title="Strike from the register"
            onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
            className="text-muted-foreground hover:text-rust shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <p className="text-[10px] font-mono text-muted-foreground mt-1">{summary}</p>
      <p className={`text-[9px] font-mono tracking-widest mt-1 ${confirming ? "text-rust" : "text-brass/70"}`}>
        {confirming ? "PRESS ✓ TO STRIKE THIS PATTERN" : active ? "LOADED ON THE DRAFTING TABLE" : "CLICK TO RECALL"}
      </p>
    </div>
  );
}