import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { PRESET_FACTIONS } from "@/lib/presetFactions";
import { DOCTRINE_LORE } from "@/lib/codex";
import CodexEntry from "./CodexEntry";

// Faction dossiers — the standing nations plus every faction this commander has forged.
export default function FactionArchive() {
  const [mine, setMine] = useState(null);

  useEffect(() => {
    base44.entities.Faction.list("-created_date", 40).then(setMine).catch(() => setMine([]));
  }, []);

  const dossier = (f, key) => (
    <CodexEntry key={key} title={f.factionName} subtitle={(f.doctrine || "").toUpperCase()}>
      {f.lore && <p>{f.lore}</p>}
      {f.insigniaDescription && (
        <p className="italic text-[11px]">Insignia — {f.insigniaDescription}</p>
      )}
      {(f.traits || []).length > 0 && (
        <div className="space-y-0.5 pt-1">
          {f.traits.map((t, i) => (
            <p key={i} className="text-[11px]">
              <span className="text-brass font-heading uppercase tracking-wider">{t.name}</span> — {t.description}
            </p>
          ))}
        </div>
      )}
      {DOCTRINE_LORE[f.doctrine] && (
        <p className="text-[11px] border-l-2 border-brass/40 pl-2 mt-1">
          {DOCTRINE_LORE[f.doctrine].summary}
        </p>
      )}
    </CodexEntry>
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="cq-label">Doctrines of war</p>
        {Object.entries(DOCTRINE_LORE).map(([k, d]) => (
          <CodexEntry key={k} title={d.label} subtitle="DOCTRINE">
            <p className="text-secondary-foreground italic">{d.summary}</p>
            <p>{d.body}</p>
          </CodexEntry>
        ))}
      </div>

      <div className="space-y-1.5">
        <p className="cq-label">Standing nations</p>
        {PRESET_FACTIONS.map((f) => dossier(f, f.id))}
      </div>

      <div className="space-y-1.5">
        <p className="cq-label">Forged factions</p>
        {!mine ? (
          <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-brass" /></div>
        ) : mine.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No factions forged yet — the lifepath builder files each new nation here.
          </p>
        ) : (
          mine.map((f) => dossier(f, f.id))
        )}
      </div>
    </div>
  );
}