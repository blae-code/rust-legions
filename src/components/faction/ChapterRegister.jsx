import React from "react";
import { Check } from "lucide-react";

// The chapter register — a numbered filing strip across the top of the form.
export default function ChapterRegister({ labels, step, onJump }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {labels.map((label, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <React.Fragment key={label}>
            {i > 0 && <div className={`h-px w-3 sm:w-5 shrink-0 ${done || current ? "bg-brass/50" : "bg-border"}`} />}
            <button
              onClick={() => done && onJump(i)}
              disabled={!done}
              className={`flex items-center gap-1.5 shrink-0 rounded-sm border px-2 py-1 transition-colors ${
                current
                  ? "border-rust/70 bg-rust/10 text-rust"
                  : done
                  ? "border-brass/50 bg-brass/10 text-brass-bright hover:bg-brass/20"
                  : "border-border text-muted-foreground/60"
              }`}
            >
              <span className="font-display text-[11px] leading-none">
                {done ? <Check className="w-3 h-3" /> : String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-heading uppercase tracking-[0.12em] text-[9px] leading-none hidden sm:inline">{label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}