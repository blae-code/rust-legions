import React from "react";

// One stamped figure on the overview plate
export default function OverviewStat({ value, label, tone = "brass" }) {
  const color = tone === "rust" ? "text-rust" : tone === "olive" ? "text-olive" : "text-brass-bright";
  return (
    <div className={`border rounded-sm p-3 text-center ${tone === "rust" ? "border-rust/60 bg-rust/10" : "border-border bg-secondary/30"}`}>
      <p className={`cq-display text-2xl leading-none ${color}`}>{value}</p>
      <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-1">{label}</p>
    </div>
  );
}