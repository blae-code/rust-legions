import React from "react";
import { Button } from "@/components/ui/button";

export default function UnitStepper({ label, value, max, onChange, cost }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-xs font-heading tracking-wide text-secondary-foreground flex-1">
        {label}
        {cost !== undefined && <span className="text-muted-foreground font-mono ml-1">({cost}₪)</span>}
        {max !== undefined && <span className="text-muted-foreground font-mono ml-1">/ {max}</span>}
      </span>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" className="h-6 w-6 p-0 border-border hover:border-brass/60" onClick={() => onChange(Math.max(0, value - 1))}>−</Button>
        <span className="w-6 text-center text-sm font-mono text-brass-bright">{value}</span>
        <Button size="sm" variant="outline" className="h-6 w-6 p-0 border-border hover:border-brass/60" onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}>+</Button>
      </div>
    </div>
  );
}