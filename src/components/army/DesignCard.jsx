import React from "react";
import { Trash2 } from "lucide-react";
import { SLOT_KEYS, DESIGN_SLOTS, DEFAULT_DESIGN } from "@/lib/armyDesign";

// A filed pattern on the shelf — clicking the card recalls it into the drafting table
export default function DesignCard({ design, active, onRecall, onDelete }) {
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
        <button
          title="Delete"
          onClick={(e) => { e.stopPropagation(); onDelete(design.id); }}
          className="text-muted-foreground hover:text-rust"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-[10px] font-mono text-muted-foreground mt-1">{summary}</p>
      <p className="text-[9px] font-mono text-brass/70 tracking-widest mt-1">
        {active ? "LOADED ON THE DRAFTING TABLE" : "CLICK TO RECALL"}
      </p>
    </div>
  );
}