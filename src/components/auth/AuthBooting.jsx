import React from "react";
import { Shield } from "lucide-react";

// The pre-auth boot screen — shown while the app resolves the session. Themed to
// match the field terminal so there is never a flash of unstyled/SaaS chrome.
export default function AuthBooting() {
  return (
    <div className="fixed inset-0 z-[80] bg-background flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 cq-scanlines opacity-25 pointer-events-none" />
      <div className="absolute inset-0 cq-vignette pointer-events-none" />
      <div className="relative flex flex-col items-center gap-5 cq-flicker">
        <div className="relative">
          <Shield className="w-10 h-10 text-brass" />
          <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-brass-bright animate-spin" />
        </div>
        <p className="font-display uppercase tracking-[0.35em] text-brass text-lg">Rust Legions</p>
        <p className="font-mono text-[10px] text-muted-foreground tracking-[0.35em] animate-pulse">
          ESTABLISHING FIELD UPLINK…
        </p>
      </div>
    </div>
  );
}
