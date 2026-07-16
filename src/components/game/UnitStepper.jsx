import React from "react";
import { Button } from "@/components/ui/button";

export default function UnitStepper({ label, value, max, onChange, cost }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-xs text-stone-300 flex-1">
        {label}
        {cost !== undefined && <span className="text-stone-500 ml-1">({cost}₪)</span>}
        {max !== undefined && <span className="text-stone-500 ml-1">/ {max}</span>}
      </span>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" className="h-6 w-6 p-0 border-stone-700" onClick={() => onChange(Math.max(0, value - 1))}>−</Button>
        <span className="w-6 text-center text-sm font-mono">{value}</span>
        <Button size="sm" variant="outline" className="h-6 w-6 p-0 border-stone-700" onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}>+</Button>
      </div>
    </div>
  );
}