import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Send } from "lucide-react";
import { isLive, presenceMeta } from "@/lib/presence";

// Every commander who allows themselves to be listed — callsigns only, never names.
export default function CommanderRoster({ myUserId, onMessage }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    base44.entities.UserProfile.list("-lastSeenAt", 100)
      .then((all) => setRows(all.filter((p) => p.presence !== "dark" && p.created_by_id !== myUserId)))
      .catch(() => setRows([]));
  }, [myUserId]);

  if (rows === null) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  if (rows.length === 0) {
    return <p className="font-mono text-[10px] text-muted-foreground tracking-widest py-3 text-center">NO COMMANDERS LISTED</p>;
  }

  return (
    <div className="space-y-1.5">
      {rows.map((p) => {
        const live = isLive(p);
        const meta = presenceMeta(p.presence);
        return (
          <div key={p.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm border border-border bg-secondary/30">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${live ? meta.dot : "bg-muted-foreground/40"}`} />
            <span className="font-heading uppercase tracking-widest text-xs text-secondary-foreground truncate">{p.displayName}</span>
            <span className="font-mono text-[9px] text-muted-foreground ml-auto shrink-0">
              {live ? meta.label.toUpperCase() : "OFF WIRE"}
            </span>
            <button
              onClick={() => onMessage(p)}
              title={`Wire a dispatch to ${p.displayName}`}
              className="text-muted-foreground hover:text-brass transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}