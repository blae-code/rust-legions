import React from "react";
import GeneralPortrait from "@/components/game/GeneralPortrait";

export default function GeneralBadge({ general }) {
  if (!general) return null;
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
      </div>
    </div>
  );
}