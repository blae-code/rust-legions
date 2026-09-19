import React from "react";
import { ACTIVITIES, ORDER_GROUPS } from "@/lib/tactical/activities";

// Issue an activity to the selected stand. Each button fires that action's
// sound cue and strikes its badge onto the counter.
export default function OrderRail({ stand, current, onIssue, locked = false }) {
  if (!stand) {
    return (
      <p className="font-mono text-[10px] text-muted-foreground tracking-widest">
        SELECT A COUNTER TO ISSUE ORDERS
      </p>
    );
  }

  // A co-commander's stand: you may read its file, but its orders are theirs.
  if (locked) {
    return (
      <div className="space-y-1">
        <p className="font-mono text-[10px] text-brass-bright tracking-widest truncate">{stand.name}</p>
        <p className="font-mono text-[10px] text-muted-foreground tracking-widest">
          UNDER {String(stand.owner).toUpperCase()}'S COMMAND — COORDINATE ON THE WIRE
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <p className="font-mono text-[10px] text-brass-bright tracking-widest truncate">{stand.name}</p>
      {ORDER_GROUPS.map((g) => (
        <div key={g.label} className="cq-order-group">
          <p className="cq-label mb-1">{g.label}</p>
          <div className="flex flex-wrap gap-1">
            {g.keys.map((k) => {
              const spec = ACTIVITIES[k];
              const live = current === k;
              return (
                <button
                  key={k}
                  onClick={() => onIssue(stand.id, k)}
                  aria-pressed={live}
                  className={`cq-metal font-heading uppercase tracking-wider text-[11px] min-h-8 px-2.5 py-1.5 rounded-sm border transition-colors ${live ? "border-brass bg-brass/15 text-brass-bright" : "border-border bg-secondary/50 text-secondary-foreground hover:border-brass/60"}`}
                >
                  {spec.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}