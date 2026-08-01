import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { WORLDS } from "@/lib/macro/worlds";
import { playSfx } from "@/lib/sfx";

// Host staging orders — the theater, the mode and the terms of victory may all
// be re-issued right up until war is declared.
export default function HostLobbyPanel({ game, busy, onConfigure }) {
  const [maps, setMaps] = useState([]);
  const [planetId, setPlanetId] = useState(game.planetId || "cindara");
  const [mapId, setMapId] = useState(game.mapId || "");
  const [mode, setMode] = useState(game.mode || "multiplayer");
  const [winType, setWinType] = useState(game.campaignWinCondition?.type || "");
  const [winValue, setWinValue] = useState(game.campaignWinCondition?.value || 10);

  useEffect(() => {
    base44.entities.GameMap.filter({ isPublished: true }, "-created_date", 100)
      .then((all) => setMaps(all.filter((m) => (m.nodes || []).length > 0)));
  }, []);

  const apply = () => {
    playSfx("build");
    onConfigure({
      planetId,
      mapId: mapId || null,
      mode,
      campaignWinCondition: winType ? { type: winType, value: Number(winValue) } : {},
    });
  };

  return (
    <div className="cq-panel p-4 space-y-3">
      <p className="cq-label flex items-center gap-1.5 text-brass">
        <Settings2 className="w-3 h-3" /> Host Staging Orders
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="cq-label">Theater Planet</label>
          <select
            value={planetId}
            onChange={(e) => setPlanetId(e.target.value)}
            className="w-full bg-input border border-border rounded-sm p-1.5 text-xs text-secondary-foreground font-heading tracking-wide mt-1"
          >
            {WORLDS.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="cq-label">War Chart</label>
          <select
            value={mapId}
            onChange={(e) => setMapId(e.target.value)}
            className="w-full bg-input border border-border rounded-sm p-1.5 text-xs text-secondary-foreground font-heading tracking-wide mt-1"
          >
            <option value="">Ministry-generated world</option>
            {maps.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="cq-label">Operation Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full bg-input border border-border rounded-sm p-1.5 text-xs text-secondary-foreground font-heading tracking-wide mt-1"
          >
            <option value="multiplayer">Multiplayer</option>
            <option value="campaign">Campaign (solo)</option>
          </select>
        </div>
        <div>
          <label className="cq-label">Terms of Victory</label>
          <div className="flex gap-1.5 mt-1">
            <select
              value={winType}
              onChange={(e) => setWinType(e.target.value)}
              className="flex-1 bg-input border border-border rounded-sm p-1.5 text-xs text-secondary-foreground font-heading tracking-wide"
            >
              <option value="">Standard conquest</option>
              <option value="territory">Hold territory %</option>
              <option value="survive">Survive turns</option>
            </select>
            {winType && (
              <input
                type="number"
                min="1"
                value={winValue}
                onChange={(e) => setWinValue(e.target.value)}
                className="w-16 bg-input border border-border rounded-sm p-1.5 text-xs text-secondary-foreground font-mono"
                aria-label="Win condition value"
              />
            )}
          </div>
        </div>
      </div>

      <Button
        size="sm"
        disabled={busy}
        onClick={apply}
        className="w-full bg-brass hover:bg-brass-bright text-primary-foreground font-heading uppercase text-xs tracking-[0.2em]"
      >
        Issue Amended Orders
      </Button>
    </div>
  );
}