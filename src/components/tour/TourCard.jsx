import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// One page of the guided tour — a stamped ministry briefing card
export default function TourCard({ step, idx, total, onPrev, onNext, onSkip, style }) {
  const last = idx === total - 1;
  return (
    <div className="absolute w-[340px] max-w-[calc(100vw-24px)] cq-panel border-brass/50 bg-card p-4" style={{ ...style, transition: "top 0.55s cubic-bezier(0.3, 0, 0.2, 1), left 0.55s cubic-bezier(0.3, 0, 0.2, 1)" }}>
      <div className="cq-hazard absolute top-0 left-0 right-0" />
      <div className="flex items-start justify-between pt-1.5">
        <p className="font-mono text-[9px] text-muted-foreground tracking-[0.3em]">
          BRIEFING {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
        <button onClick={onSkip} className="text-muted-foreground hover:text-rust transition-colors -mt-1" title="Dismiss the tour">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="cq-display text-xl text-brass-bright mt-1">{step.title}</p>
      <p className="font-body text-xs text-secondary-foreground leading-relaxed mt-1.5">{step.body}</p>
      <div className="flex items-center gap-1 mt-3">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={`h-1 rounded-full transition-all duration-300 ${i === idx ? "w-5 bg-brass" : "w-1.5 bg-border"}`} />
        ))}
        <div className="ml-auto flex gap-2">
          {idx > 0 && (
            <Button size="sm" variant="outline" className="h-7 px-3 text-[10px]" onClick={onPrev}>Back</Button>
          )}
          <Button size="sm" className="h-7 px-3 text-[10px] bg-brass hover:bg-brass-bright text-primary-foreground" onClick={onNext}>
            {last ? "To War" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}