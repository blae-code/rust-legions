import React, { useState, useEffect } from "react";
import Typewriter from "@/components/home/Typewriter";

const BRIEFS = [
  "SUPPLY DOCTRINE: COLUMNS CUT OFF FROM A HUB SUFFER ATTRITION EVERY TURN. KEEP THE ROADS OPEN.",
  "GENERALS EARN DECORATIONS FOR STREAKS, DECISIVE WINS, AND VICTORIES AGAINST THE ODDS.",
  "ARTILLERY EMPLACEMENTS CAN SHELL ADJACENT ZONES FOR ONE FUEL — NO GROUND IS TAKEN BY GUNS ALONE.",
  "RECON PATROLS COST ONE FUEL AND RETURN PARTIAL INTEL ON GARRISONS AND ENEMY COMMANDERS.",
  "DOCTRINE DESIGNS FROM THE BUREAU OUTFIT ARMIES AT MUSTER FOR A RESOURCE SURCHARGE.",
  "TERRAIN FAVORS THE DEFENSE — MOUNTAINS, FORESTS, AND MARSH GRIND ASSAULTS TO A HALT.",
];

// Rotating field-intelligence dispatch with typewriter delivery
export default function IntelBrief() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % BRIEFS.length), 9000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="cq-panel p-3 relative overflow-hidden">
      <div className="flex items-center justify-between mb-1.5">
        <p className="cq-label">Field Intelligence</p>
        <span className="font-mono text-[8px] text-muted-foreground">BRIEF {String(idx + 1).padStart(2, "0")}/{String(BRIEFS.length).padStart(2, "0")}</span>
      </div>
      <p className="font-mono text-[10px] text-secondary-foreground/90 tracking-wider leading-relaxed min-h-[2.5rem]">
        <Typewriter key={idx} text={BRIEFS[idx]} speed={18} />
      </p>
    </div>
  );
}