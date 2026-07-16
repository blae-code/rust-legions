import React from "react";
import { Star } from "lucide-react";

export default function GeneralBadge({ general }) {
  if (!general) return null;
  return (
    <div className="flex items-center gap-2 border border-brass/40 rounded-sm bg-secondary/40 px-2 py-1.5">
      <Star className={`w-3.5 h-3.5 ${general.supreme ? "text-brass-bright" : "text-steel"}`} />
      <div className="min-w-0">
        <p className="text-xs font-heading tracking-wide text-secondary-foreground truncate">
          {general.name}
          {general.epithet && <span className="text-muted-foreground"> {general.epithet}</span>}
        </p>
        {general.strategy !== undefined && (
          <p className="font-mono text-[9px] text-muted-foreground">
            STRATEGY {general.strategy} · LEADERSHIP {general.leadership}
            {general.supreme && <span className="text-brass"> · SUPREME COMMANDER</span>}
          </p>
        )}
      </div>
    </div>
  );
}