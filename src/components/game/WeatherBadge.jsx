import React from "react";
import { WEATHER_META } from "@/lib/weather";
import { getImage } from "@/lib/imageLibrary";

export default function WeatherBadge({ weather = "clear" }) {
  const m = WEATHER_META[weather] || WEATHER_META.clear;
  const seal = getImage(`wx_${weather}`);
  return (
    <div className="relative group">
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-sm border font-heading text-xs tracking-wide cursor-default ${
        weather === "clear" ? "border-border text-muted-foreground bg-secondary/40" : "border-brass/50 text-brass-bright bg-brass/10"
      }`}>
        {seal ? <img src={seal} alt="" aria-hidden="true" className="w-4 h-4 object-contain -my-0.5 select-none" /> : <span>{m.icon}</span>}
        <span className="uppercase">{m.label}</span>
      </div>
      {m.effects.length > 0 && (
        <div className="absolute right-0 top-full mt-1 z-40 hidden group-hover:block w-60 cq-panel p-2.5">
          <p className="cq-label mb-1">Front Conditions</p>
          {m.effects.map((e, i) => (
            <p key={i} className="text-[10px] font-mono text-secondary-foreground leading-relaxed">· {e}</p>
          ))}
        </div>
      )}
    </div>
  );
}