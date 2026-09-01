import React from "react";

// One platform's installation procedure — a stamped ministry work order
export default function PlatformCard({ icon: Icon, platform, via, steps }) {
  return (
    <div className="cq-panel cq-brackets relative overflow-hidden p-4">
      <div className="cq-hazard absolute top-0 left-0 right-0" />
      <div className="flex items-center gap-2 pt-1.5">
        <Icon className="w-4 h-4 text-brass" />
        <div>
          <p className="font-heading uppercase tracking-[0.2em] text-sm text-brass-bright leading-none">{platform}</p>
          <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-0.5">{via.toUpperCase()}</p>
        </div>
      </div>
      <ol className="mt-3 space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-2.5 items-start">
            <span className="cq-metal shrink-0 w-5 h-5 rounded-sm border border-brass/40 flex items-center justify-center font-mono text-[10px] text-brass-bright">
              {i + 1}
            </span>
            <span className="font-body text-xs text-secondary-foreground leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}