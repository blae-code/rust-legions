import React from "react";
import { BASE_MODULES, MODULE_SLOTS } from "@/lib/baseModules";
import { costString } from "@/lib/units";

// One bay column — every module for this slot family, with installed/selected states
export default function RefitBay({ family, installedKey, selectedKey, onSelect, unlocks = [] }) {
  const meta = MODULE_SLOTS[family];
  const options = Object.entries(BASE_MODULES).filter(([, m]) => m.slot === family);

  return (
    <div className="border border-border rounded-sm bg-secondary/20 p-2.5">
      <div className="flex items-center gap-2">
        <span>{meta.icon}</span>
        <span className="cq-label">{meta.label}</span>
      </div>
      <p className="font-mono text-[9px] text-muted-foreground mt-0.5 mb-2">{meta.blurb}</p>
      <div className="space-y-1.5">
        {options.map(([key, m]) => {
          const isInstalled = key === installedKey;
          const isSelected = key === selectedKey;
          const locked = m.unlock && !unlocks.includes(key);
          return (
            <button key={key} disabled={locked} onClick={() => onSelect(key)}
              className={`w-full text-left border rounded-sm p-2 transition-colors ${
                locked ? "border-border opacity-50 cursor-not-allowed"
                : isSelected ? "border-brass bg-brass/15" : "border-border hover:border-brass/50 hover:bg-brass/5"
              }`}>
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-heading tracking-wide text-secondary-foreground">{m.label}</span>
                {locked ? (
                  <span className="font-mono text-[9px] text-rust tracking-widest shrink-0">🔒 ARMORY</span>
                ) : isInstalled ? (
                  <span className="font-mono text-[9px] text-olive tracking-widest shrink-0">FITTED</span>
                ) : (
                  <span className="font-mono text-[9px] text-brass shrink-0">{costString(m.cost)}</span>
                )}
              </div>
              <p className="font-mono text-[9px] text-muted-foreground mt-0.5">{m.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}