import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { buildWorldFromNodes } from "@/lib/macro/worlds";
import { CHART } from "@/lib/macro/graph";
import MinistryChart from "@/components/chart/MinistryChart";

export default function MapLibrary() {
  const [maps, setMaps] = useState(null);
  const [previewId, setPreviewId] = useState(null);

  useEffect(() => {
    // Only node-based war charts survive the hex retirement
    base44.entities.GameMap.filter({ isPublished: true }, "-created_date", 100)
      .then((all) => setMaps(all.filter((m) => (m.nodes || []).length > 0)));
  }, []);

  const preview = maps?.find((m) => m.id === previewId);
  const previewWorld = preview
    ? buildWorldFromNodes(preview.nodes.map((n) => ({ ...n })), (preview.routes || []).map((r) => [...r]), 7)
    : { nodes: [], routes: [], continents: [], size: { ...CHART } };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <p className="cq-label">Cartography Division</p>
          <h1 className="cq-display text-4xl">Map Library</h1>
          <p className="text-sm text-muted-foreground font-heading tracking-wide">Theaters of war, built by commanders.</p>
        </div>
        <Link to="/map-editor">
          <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground text-xs font-heading uppercase tracking-[0.2em]">Build a Map</Button>
        </Link>
      </div>

      {maps === null ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : maps.length === 0 ? (
        <p className="text-sm text-muted-foreground border border-dashed border-border rounded p-10 text-center font-heading tracking-wide">
          The library is empty. Build a map or generate one when starting a game.
        </p>
      ) : (
        <div className="grid lg:grid-cols-[320px_1fr] gap-4">
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {maps.map((m) => (
              <button
                key={m.id}
                onClick={() => setPreviewId(m.id)}
                className={`w-full text-left border rounded-sm p-3 transition-colors ${previewId === m.id ? "border-brass bg-brass/10" : "border-border bg-card hover:border-steel"}`}
              >
                <p className="font-heading font-semibold tracking-wide text-foreground text-sm">{m.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{(m.nodes || []).length} settlements · {m.recommendedPlayerCount} players</p>
                {m.description && <p className="text-[11px] text-muted-foreground/70 mt-1 line-clamp-2">{m.description}</p>}
              </button>
            ))}
          </div>
          <div className="cq-panel p-3 bg-gradient-to-b from-card to-background">
            {preview ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h2 className="font-heading font-semibold text-lg tracking-wide text-foreground">{preview.name}</h2>
                  <Link to={`/new-game?mapId=${preview.id}`}>
                    <Button size="sm" className="bg-rust hover:bg-destructive text-destructive-foreground text-xs font-heading uppercase tracking-[0.2em]">Play This Map</Button>
                  </Link>
                </div>
                <MinistryChart world={previewWorld} height="56vh" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-16 font-heading tracking-wide">Select a map to preview it.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}