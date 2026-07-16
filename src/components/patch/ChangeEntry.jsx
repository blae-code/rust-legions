import React from "react";
import { CHANGE_CATEGORIES } from "@/components/patch/patchMeta";

// A single amendment line in a patch dispatch — stamped code, detail, and player impact
export default function ChangeEntry({ change }) {
  const meta = CHANGE_CATEGORIES[change.category] || CHANGE_CATEGORIES.mechanics;
  return (
    <div className={`border-l-2 ${meta.border} pl-3 py-1.5`}>
      <div className="flex items-baseline gap-2">
        <span className={`cq-tag ${meta.border} ${meta.color} shrink-0`}>{meta.code}</span>
        <p className="font-heading font-semibold text-sm text-foreground tracking-wide">{change.title}</p>
      </div>
      {change.description && (
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{change.description}</p>
      )}
      {change.impact && (
        <p className="font-mono text-[10px] text-brass/80 mt-1.5 tracking-wide">
          ► IMPACT ON THE FRONT: <span className="text-secondary-foreground normal-case">{change.impact}</span>
        </p>
      )}
    </div>
  );
}