import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { playSfx } from "@/lib/sfx";

// One collapsible archive entry — a stenciled header over folded lore.
export default function CodexEntry({ title, subtitle, accent, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-sm bg-secondary/20 overflow-hidden">
      <button
        onClick={() => { playSfx("select"); setOpen(!open); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-secondary/40 transition-colors"
      >
        <ChevronRight className={`w-3.5 h-3.5 text-brass shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
        {accent && <span className="w-2 h-2 rounded-full ring-1 ring-black/50 shrink-0" style={{ background: accent }} />}
        <span className="font-heading uppercase tracking-[0.16em] text-sm text-secondary-foreground">{title}</span>
        {subtitle && <span className="ml-auto font-mono text-[9px] text-muted-foreground tracking-widest">{subtitle}</span>}
      </button>
      {open && <div className="px-4 pb-3 pt-1 space-y-2 text-xs text-muted-foreground leading-relaxed">{children}</div>}
    </div>
  );
}