import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// A brass nib pointing back at the spotlit surface, so the card always reads
// as a label for that box rather than a floating note.
const NIB = {
  below: "-top-[5px] left-1/2 -translate-x-1/2",
  above: "-bottom-[5px] left-1/2 -translate-x-1/2",
  right: "-left-[5px] top-1/2 -translate-y-1/2",
  left: "-right-[5px] top-1/2 -translate-y-1/2",
};

// One page of the guided tour — a stamped ministry briefing card
const TourCard = React.forwardRef(function TourCard(
  { step, idx, total, onPrev, onNext, onSkip, style, arrow },
  ref,
) {
  const last = idx === total - 1;
  return (
    <div
      ref={ref}
      className="cq-slip absolute w-[340px] max-w-[calc(100vw-24px)] rounded-sm p-4"
      style={{ ...style, transition: "top 0.55s cubic-bezier(0.3, 0, 0.2, 1), left 0.55s cubic-bezier(0.3, 0, 0.2, 1)" }}
    >
      <div className="cq-hazard absolute top-0 left-0 right-0" />
      {NIB[arrow] && (
        <span className={`absolute ${NIB[arrow]} w-2.5 h-2.5 rotate-45 bg-brass/80 border border-brass`} />
      )}
      {/* Rivets on the plate corners */}
      {[["top-2 left-2"], ["top-2 right-2"], ["bottom-2 left-2"], ["bottom-2 right-2"]].map(([pos]) => (
        <span key={pos} className={`absolute ${pos} w-1 h-1 rounded-full bg-brass/50 shadow-[inset_0_1px_1px_rgba(0,0,0,0.8)]`} />
      ))}
      <div className="flex items-start justify-between gap-3 pt-2 pl-3 pr-1">
        <p className="font-mono text-[9px] text-muted-foreground tracking-[0.3em] leading-none">
          BRIEFING {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
        <button onClick={onSkip} className="text-muted-foreground hover:text-rust transition-colors -mt-1 shrink-0" title="Dismiss the tour">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="cq-display text-xl text-brass-bright mt-1.5 pl-3 pr-6 leading-tight drop-shadow-[0_2px_0_rgba(0,0,0,0.75)]">
        {step.title}
      </p>
      <p className="font-body text-xs text-secondary-foreground leading-relaxed mt-1.5 pl-3 pr-3">{step.body}</p>
      <div className="flex items-center gap-1 mt-3.5 pl-3 pr-3 pb-1">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={`h-1 rounded-full transition-all duration-300 ${i === idx ? "w-5 bg-brass" : "w-1.5 bg-border"}`} />
        ))}
        <div className="ml-auto flex gap-2">
          {!last && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-muted-foreground hover:text-rust" onClick={onSkip}>
              Skip
            </Button>
          )}
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
});

export default TourCard;