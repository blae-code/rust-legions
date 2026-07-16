import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2 } from "lucide-react";
import HexBoard from "@/components/hexmap/HexBoard";
import { NEIGHBOR_DIRS, keyOf } from "@/lib/hex";
import { TERRAIN_RESOURCE } from "@/lib/units";

const TERRAINS = ["plains", "hills", "forest", "marsh", "highlands"];
const RESOURCES = [
  { id: "", label: "None" },
  { id: "oil_field", label: "Oil Field (+2 Fuel)" },
  { id: "coal_depot", label: "Coal Depot (+1 Steel)" },
  { id: "iron_foundry", label: "Iron Works (Crawler −1 Steel)" },
];

export default function MapEditor() {
  const navigate = useNavigate();
  const [tiles, setTiles] = useState([{ id: "t0", q: 0, r: 0, name: "Heartland", terrain: "plains", baseIncome: 3, resourceBonus: null, isCapital: true, isSea: false }]);
  const [selectedId, setSelectedId] = useState("t0");
  const [mapName, setMapName] = useState("");
  const [description, setDescription] = useState("");
  const [playerCount, setPlayerCount] = useState(2);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [nextId, setNextId] = useState(1);

  const selected = tiles.find((t) => t.id === selectedId);

  const ghosts = useMemo(() => {
    const occupied = new Set(tiles.map((t) => keyOf(t.q, t.r)));
    const spots = new Map();
    for (const t of tiles) {
      for (const [dq, dr] of NEIGHBOR_DIRS) {
        const q = t.q + dq, r = t.r + dr;
        if (!occupied.has(keyOf(q, r))) spots.set(keyOf(q, r), { q, r });
      }
    }
    return [...spots.values()];
  }, [tiles]);

  const addTile = (g) => {
    const tile = { id: `t${nextId}`, q: g.q, r: g.r, name: `Zone ${nextId}`, terrain: "plains", baseIncome: 2, resourceBonus: null, isCapital: false, isSea: false };
    setNextId(nextId + 1);
    setTiles([...tiles, tile]);
    setSelectedId(tile.id);
  };

  const updateTile = (patch) => setTiles(tiles.map((t) => (t.id === selectedId ? { ...t, ...patch } : t)));
  const removeTile = () => {
    if (tiles.length <= 1) return;
    setTiles(tiles.filter((t) => t.id !== selectedId));
    setSelectedId(null);
  };

  const capitals = tiles.filter((t) => t.isCapital).length;

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const occupied = new Map(tiles.map((t) => [keyOf(t.q, t.r), t]));
      const withAdj = tiles.map((t) => ({
        ...t,
        adjacentIds: NEIGHBOR_DIRS.map(([dq, dr]) => occupied.get(keyOf(t.q + dq, t.r + dr))).filter(Boolean).map((n) => n.id),
      }));
      await base44.entities.GameMap.create({
        name: mapName, description, tiles: withAdj, recommendedPlayerCount: playerCount, isPublished: true,
      });
      navigate("/maps");
    } catch (e) {
      setError("Failed to save map");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="cq-label">Cartography Division · Drafting Table</p>
        <h1 className="cq-display text-4xl">Map Editor</h1>
        <p className="text-sm text-muted-foreground font-heading tracking-wide">Click dashed hexes to add zones. Click a zone to edit it. Place at least {playerCount} capitals.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <div className="cq-panel p-2 bg-gradient-to-b from-card to-background">
          <HexBoard
            tiles={tiles.map((t) => ({ ...t, visible: true }))}
            selectedId={selectedId}
            onTileClick={(t) => setSelectedId(t.id)}
            ghosts={ghosts}
            onGhostClick={addTile}
          />
        </div>

        <div className="space-y-4">
          {selected && (
            <div className="cq-panel p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="cq-label">Zone Properties</h3>
                <Button size="sm" variant="ghost" onClick={removeTile} className="h-6 text-rust hover:text-destructive p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <Input value={selected.name} onChange={(e) => updateTile({ name: e.target.value })} className="bg-input border-border text-sm font-heading tracking-wide" />
              <label className="flex items-center gap-2 text-xs text-secondary-foreground font-heading tracking-wide">
                <input type="checkbox" checked={selected.isSea} onChange={(e) => updateTile({ isSea: e.target.checked, isCapital: false, baseIncome: e.target.checked ? 0 : 2, resourceBonus: null, terrain: e.target.checked ? "sea" : "plains" })} />
                Sea zone
              </label>
              {!selected.isSea && (
                <>
                  <label className="flex items-center gap-2 text-xs text-secondary-foreground font-heading tracking-wide">
                    <input type="checkbox" checked={selected.isCapital} onChange={(e) => updateTile({ isCapital: e.target.checked })} />
                    Capital ★
                  </label>
                  <div>
                    <label className="text-xs text-muted-foreground">Terrain</label>
                    <select value={selected.terrain} onChange={(e) => updateTile({ terrain: e.target.value })} className="w-full bg-input border border-border rounded-sm p-1.5 text-xs text-secondary-foreground mt-1 font-heading tracking-wide">
                      {TERRAINS.map((t) => <option key={t} value={t}>{t} → {TERRAIN_RESOURCE[t] || "manpower"}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Base income: <span className="font-mono text-brass-bright">{selected.baseIncome}</span></label>
                    <input type="range" min={1} max={5} value={selected.baseIncome} onChange={(e) => updateTile({ baseIncome: Number(e.target.value) })} className="w-full accent-[hsl(var(--brass))]" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Resource</label>
                    <select value={selected.resourceBonus || ""} onChange={(e) => updateTile({ resourceBonus: e.target.value || null })} className="w-full bg-input border border-border rounded-sm p-1.5 text-xs text-secondary-foreground mt-1 font-heading tracking-wide">
                      {RESOURCES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="cq-panel p-4 space-y-3">
            <h3 className="cq-label">Publish Map</h3>
            <Input placeholder="Map name" value={mapName} onChange={(e) => setMapName(e.target.value)} className="bg-input border-border text-sm font-heading tracking-wide" />
            <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-input border-border text-sm" />
            <div>
              <label className="text-xs text-muted-foreground">Recommended players</label>
              <select value={playerCount} onChange={(e) => setPlayerCount(Number(e.target.value))} className="w-full bg-input border border-border rounded-sm p-1.5 text-xs text-secondary-foreground mt-1 font-heading tracking-wide">
                {[2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">{tiles.length} zones · {capitals} capitals {capitals < playerCount && <span className="text-brass-bright">(need {playerCount})</span>}</p>
            {error && <p className="text-xs text-rust font-mono">{error}</p>}
            <Button disabled={!mapName || tiles.length < 8 || capitals < playerCount || saving} onClick={save} className="w-full bg-brass hover:bg-brass-bright text-primary-foreground text-xs font-heading uppercase tracking-[0.2em]">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Publish to Library
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}