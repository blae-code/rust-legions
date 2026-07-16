import React from "react";
import { Shield } from "lucide-react";

export default function HomeFooter() {
  return (
    <div className="-mx-4 border-t border-border mt-4">
      <div className="cq-hazard" />
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-brass/70 font-display tracking-[0.25em] uppercase text-sm">
          <Shield className="w-4 h-4" /> Conquest Tactics
        </div>
        <p className="font-mono text-[10px] text-muted-foreground tracking-widest text-center">
          MINISTRY OF WAR · FIELD MANUAL 7-A · BURN AFTER READING
        </p>
      </div>
    </div>
  );
}