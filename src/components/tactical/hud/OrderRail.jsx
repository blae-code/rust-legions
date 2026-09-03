import React from "react";
import { ACTIVITIES, ORDER_GROUPS } from "@/lib/tactical/activities";

// Issue an activity to the selected stand. Each button fires that action's
// sound cue and strikes its badge onto the counter.
export default function OrderRail({ stand, current, onIssue }) {
  if (!stand) {
    return (
      <p className="font-mono text-[10px] text-muted-foreground tracking-widest">
        SELECT A COUNTER TO ISSUE ORDERS
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      <p className="font-mono text-[10px] text-brass-bright tracking-widest truncate">{stand.name}</p>
      {ORDER_GROUPS.map((g) => (
        <div key={g.label}>
          <p className="cq-label mb-1">{g.label}</p>
          <div className="flex flex-wrap gap-1">
            {g.keys.map((k) => {
              const spec = ACTIVITIES[k];
              const live = current === k;
              return (
                <button
                  key={k}
                  onClick={() => onIssue(stand.id, k)}
                  className="cq-metal font-heading uppercase tracking-widest text-[9px] px-2 py-1 rounded-sm border transition-colors"
                  style={{
                    borderColor: live ? spec.tone : "hsl(var(--border))",
                    color: live ? spec.tone : "hsl(var(--secondary-foreground))",
                    background: live ? `${spec.tone}1A` : undefined,
                  }}
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