import React, { useState, useEffect } from "react";

// Live HUD readouts — clock, grid reference, signal status
export default function HudTelemetry() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <div className="hidden md:flex items-center gap-5 font-mono text-[9px] tracking-[0.2em]">
      <span className="text-muted-foreground">GRID 47-KILO · SECTOR IX</span>
      <span className="text-olive flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-current cq-lamp animate-pulse" /> SIGNAL STRONG
      </span>
      <span className="text-brass-bright">{pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())} LOCAL</span>
    </div>
  );
}