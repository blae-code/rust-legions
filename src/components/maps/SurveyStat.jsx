import React from "react";

// One stamped figure on the survey plate.
export default function SurveyStat({ icon: Icon, label, value }) {
  return (
    <div className="border border-border/70 bg-secondary/25 rounded-sm px-2.5 py-1.5">
      <p className="font-heading uppercase tracking-[0.15em] text-[8px] text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="w-2.5 h-2.5" />} {label}
      </p>
      <p className="font-display text-base text-brass-bright leading-tight mt-0.5">{value}</p>
    </div>
  );
}