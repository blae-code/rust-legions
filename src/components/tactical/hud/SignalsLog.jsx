import React from "react";
import { SAMPLE_LOG } from "@/lib/tactical/orbat";

const TONE = {
  kill: "border-l-olive text-olive",
  loss: "border-l-rust text-rust",
  warn: "border-l-brass text-brass",
  info: "border-l-border text-muted-foreground",
};

// The signals section's running feed — the right-hand event rail.
export default function SignalsLog() {
  return (
    <div className="space-y-1">
      {SAMPLE_LOG.map((e) => (
        <div key={e.id} className={`cq-slip border-l-2 px-2 py-1.5 ${TONE[e.tone]}`}>
          <p className="font-mono text-[10px] leading-snug">{e.text}</p>
        </div>
      ))}
    </div>
  );
}