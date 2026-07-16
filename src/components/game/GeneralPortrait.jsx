import React from "react";
import { getGeneralPortrait } from "@/lib/generalPortraits";

// Riveted-frame portrait plate for a general
export default function GeneralPortrait({ general, size = 40 }) {
  const url = getGeneralPortrait(general);
  if (!url) return null;
  return (
    <div
      className={`relative shrink-0 rounded-sm overflow-hidden border ${general?.supreme ? "border-brass" : "border-border"}`}
      style={{ width: size, height: size, boxShadow: "inset 0 0 8px hsl(0 0% 0% / 0.7), 0 1px 3px hsl(0 0% 0% / 0.6)" }}
      title={general?.name}
    >
      <img src={url} alt={general?.name || "General"} className="w-full h-full object-cover sepia-[.25] contrast-110" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, transparent 60%, hsl(0 0% 0% / 0.45))" }} />
    </div>
  );
}