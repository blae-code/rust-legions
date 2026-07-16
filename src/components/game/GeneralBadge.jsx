import React from "react";
import GeneralPortrait from "@/components/game/GeneralPortrait";
import { MEDALS } from "@/lib/medals";
import { getCommandVehicle } from "@/lib/commandVehicles";

export default function GeneralBadge({ general }) {
  if (!general) return null;
  const vehicle = getCommandVehicle(general);
  return (
    <div className="flex items-center gap-2 border border-brass/40 rounded-sm bg-secondary/40 px-2 py-1.5">
      <GeneralPortrait general={general} size={36} />
      <div className="min-w-0">
        <p className="text-xs font-heading tracking-wide text-secondary-foreground truncate">
          {general.name}
          {general.epithet && <span className="text-muted-foreground"> {general.epithet}</span>}
          {general.traitLabel && <span className="text-brass"> “{general.traitLabel}”</span>}
        </p>
        {general.strategy !== undefined && (
          <p className="font-mono text-[9px] text-muted-foreground">
            STRATEGY {general.strategy} · LEADERSHIP {general.leadership}
            {(general.victories || 0) > 0 && <span className="text-olive"> · {general.victories} VICTOR{general.victories === 1 ? "Y" : "IES"}</span>}
            {general.supreme && <span className="text-brass"> · SUPREME COMMANDER</span>}
          </p>
        )}
        {vehicle && (
          <p className="font-mono text-[9px] text-brass/80 truncate cursor-help" title={`${vehicle.desc} — ${vehicle.effect}`}>
            {vehicle.icon} {vehicle.label} <span className="text-muted-foreground">({vehicle.effect})</span>
          </p>
        )}
        {(general.medals || []).length > 0 && (
          <p className="flex gap-1 mt-0.5">
            {general.medals.map((key) => {
              const m = MEDALS[key];
              if (!m) return null;
              return (
                <span
                  key={key}
                  title={`${m.label} — ${m.desc}`}
                  className="inline-flex items-center justify-center w-4 h-4 text-[10px] leading-none text-brass-bright border border-brass/50 rounded-full bg-brass/10 cursor-help"
                >
                  {m.icon}
                </span>
              );
            })}
          </p>
        )}
      </div>
    </div>
  );
}