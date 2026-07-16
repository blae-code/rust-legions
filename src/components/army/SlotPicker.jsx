import React from "react";
import { DESIGN_SLOTS } from "@/lib/armyDesign";

export default function SlotPicker({ slotKey, value, onChange }) {
  const slot = DESIGN_SLOTS[slotKey];
  return (
    <div>
      <p className="cq-label mb-1.5">{slot.label}</p>
      <div className="grid sm:grid-cols-2 gap-1.5">
        {Object.entries(slot.options).map(([key, opt]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`text-left border rounded-sm p-2 transition-colors ${
              value === key ? "border-brass bg-brass/10" : "border-border hover:border-steel"
            }`}
          >
            <p className={`text-xs font-heading tracking-wide ${value === key ? "text-brass-bright" : "text-secondary-foreground"}`}>{opt.label}</p>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5 leading-snug">{opt.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}