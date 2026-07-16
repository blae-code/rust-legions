import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Shared shell for each induction step — header, progress pips, navigation
export default function StepFrame({ step, total, title, kicker, canNext, nextLabel, hint, onBack, onNext, children }) {
  return (
    <div className="cq-panel cq-brackets relative overflow-hidden p-6 max-w-3xl mx-auto">
      <div className="cq-hazard absolute top-0 left-0 right-0" />
      <div className="flex items-center justify-between pt-2 mb-1">
        <p className="cq-label">{kicker}</p>
        <span className="font-mono text-[9px] text-muted-foreground tracking-widest">STEP {step + 1} / {total}</span>
      </div>
      <h2 className="cq-display text-3xl mb-4">{title}</h2>
      {children}
      {!canNext && hint && (
        <p className="font-mono text-[9px] text-rust tracking-widest mt-4">▲ {hint.toUpperCase()}</p>
      )}
      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" size="sm" disabled={step === 0} onClick={onBack} className="border-border text-secondary-foreground font-heading uppercase text-xs tracking-widest">
          <ChevronLeft className="w-3 h-3 mr-1" /> Back
        </Button>
        <div className="flex gap-1">
          {[...Array(total)].map((_, i) => (
            <span key={i} className={`w-6 h-1 rounded-full ${i <= step ? "bg-rust" : "bg-border"}`} />
          ))}
        </div>
        <Button size="sm" disabled={!canNext} onClick={onNext} className="bg-rust hover:bg-destructive text-destructive-foreground font-heading uppercase text-xs tracking-[0.2em]">
          {nextLabel || "Next"} <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}