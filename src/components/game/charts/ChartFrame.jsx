import React from "react";

export default function ChartFrame({ kicker, title, children }) {
  return (
    <div className="cq-panel cq-brackets relative overflow-hidden p-4">
      <div className="cq-hazard absolute top-0 left-0 right-0" />
      <div className="pt-1 mb-2 flex items-baseline justify-between">
        <div>
          <p className="cq-label text-brass">{kicker}</p>
          <h3 className="font-heading font-semibold uppercase tracking-wide text-foreground">{title}</h3>
        </div>
        <span className="font-mono text-[8px] text-muted-foreground tracking-[0.3em] cq-flicker">⁜ TELEMETRY ⁜</span>
      </div>
      {children}
    </div>
  );
}