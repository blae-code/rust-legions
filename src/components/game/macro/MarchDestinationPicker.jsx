import React, { useState } from "react";
import { Button } from "@/components/ui/button";

// A written objective slip — pick the destination from the surveyed register
// instead of hunting for it on the chart.
export default function MarchDestinationPicker({ destinations, busy, error, onConfirm, onCancel }) {
  const [target, setTarget] = useState("");

  return (
    <div className="border border-brass/50 rounded-sm p-2 space-y-1.5 bg-brass/5">
      <p className="font-mono text-[9px] text-brass-bright tracking-widest">SELECT AN OBJECTIVE</p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="bg-input border border-border rounded-sm p-1.5 text-xs text-secondary-foreground font-heading tracking-wide"
        >
          <option value="">Choose ground…</option>
          {destinations.map((n) => (
            <option key={n.id} value={n.id}>{n.name}</option>
          ))}
        </select>
        <Button
          size="sm"
          disabled={!target || busy}
          className="h-7 px-3 text-[10px] font-heading uppercase tracking-widest"
          onClick={() => onConfirm(target)}
        >
          Issue Order
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-3 text-[10px] border-border text-muted-foreground font-heading uppercase"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <span className="font-mono text-[9px] text-muted-foreground">OR CLICK A MARKED SITE ON THE CHART</span>
      </div>
      {error && <p className="font-mono text-[9px] text-rust tracking-widest">✕ {error.toUpperCase()}</p>}
    </div>
  );
}