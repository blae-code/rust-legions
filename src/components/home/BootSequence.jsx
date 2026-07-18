import React, { useState, useEffect } from "react";
import { getImage } from "@/lib/imageLibrary";

const LINES = [
  "> ESTABLISHING FIELD UPLINK…",
  "> CIPHER HANDSHAKE ACCEPTED",
  "> THEATER TELEMETRY SYNCED",
  "> ALL STATIONS REPORT READY",
  "> WELCOME BACK, COMMANDER",
];

// One-shot CRT boot intro — shown once per session, click to skip
export default function BootSequence() {
  const [done, setDone] = useState(() => sessionStorage.getItem("cq_boot") === "1");
  const [count, setCount] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (done) return;
    if (count < LINES.length) {
      const t = setTimeout(() => setCount((c) => c + 1), 380);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setFading(true), 500);
    return () => clearTimeout(t);
  }, [count, done]);

  useEffect(() => {
    if (!fading) return;
    const t = setTimeout(() => { sessionStorage.setItem("cq_boot", "1"); setDone(true); }, 700);
    return () => clearTimeout(t);
  }, [fading]);

  if (done) return null;

  const backdrop = getImage("bg_boot_uplink");

  return (
    <div
      onClick={() => setFading(true)}
      className={`fixed inset-0 z-[60] bg-background flex items-center justify-center cursor-pointer transition-opacity duration-700 ${fading ? "opacity-0" : "opacity-100"}`}
    >
      {backdrop && (
        <img src={backdrop} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none select-none" />
      )}
      <div className="absolute inset-0 cq-scanlines opacity-40" />
      <div className="absolute inset-0 cq-vignette" />
      <div className="relative font-mono text-xs sm:text-sm text-brass-bright space-y-2 px-6 cq-flicker">
        {LINES.slice(0, count).map((l, i) => (
          <p key={i} className={i === LINES.length - 1 ? "text-foreground" : ""}>{l}</p>
        ))}
        <span className="inline-block w-2 h-4 bg-brass-bright animate-pulse" />
        <p className="absolute -bottom-10 left-6 text-[9px] text-muted-foreground tracking-[0.3em]">CLICK TO SKIP</p>
      </div>
    </div>
  );
}