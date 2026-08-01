import React from "react";
import { WORLDS } from "@/lib/macro/worlds";
import { PLANET_LORE, ERAS } from "@/lib/codex";
import CodexEntry from "./CodexEntry";

// Planetary histories and the ages that produced them.
export default function WorldArchive({ activePlanetId }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="cq-label">Planetary histories</p>
        {WORLDS.map((w) => {
          const lore = PLANET_LORE[w.id];
          return (
            <CodexEntry
              key={w.id}
              title={w.name}
              subtitle={lore?.epithet?.toUpperCase()}
              accent={w.palette.coast}
              defaultOpen={w.id === activePlanetId}
            >
              <p className="text-secondary-foreground">{w.blurb}</p>
              {(lore?.history || []).map((p, i) => <p key={i}>{p}</p>)}
              {lore?.notes && (
                <p className="text-[11px] border-l-2 border-brass/40 pl-2">{lore.notes}</p>
              )}
            </CodexEntry>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <p className="cq-label">Ages of the charted worlds</p>
        {ERAS.map((e) => (
          <CodexEntry key={e.name} title={e.name} subtitle="ERA">
            <p>{e.detail}</p>
          </CodexEntry>
        ))}
      </div>
    </div>
  );
}