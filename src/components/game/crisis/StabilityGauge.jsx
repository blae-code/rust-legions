import React from "react";
import { Gauge } from "lucide-react";

// The Ministry's read on how firmly the protectorate holds together
export default function StabilityGauge({ value }) {
  if (typeof value !== "number") return null;
  const tone = value < 35 ? "text-rust" : value < 60 ? "text-brass" : "text-olive";
  const label = value < 35 ? "FRACTURING" : value < 60 ? "STRAINED" : value < 85 ? "STEADY" : "FIRM";
  return (
    <div className="flex items-center gap-2" title="Faction stability — answer settlement crises to hold it. Below 35, held settlements may revolt.">
      <Gauge className={`w-3.5 h-3.5 ${tone}`} />
      <div className="flex-1 h-1.5 bg-secondary rounded-sm overflow-hidden">
        <div className={`h-full ${value < 35 ? "bg-rust" : value < 60 ? "bg-brass" : "bg-olive"}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`font-mono text-[9px] tracking-widest ${tone}`}>{label} {value}</span>
    </div>
  );
}