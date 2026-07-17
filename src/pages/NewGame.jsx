import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import useUser from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw } from "lucide-react";
import HexBoard from "@/components/hexmap/HexBoard";
import PlanetPicker from "@/components/setup/PlanetPicker";

const DOCTRINE_OPTS = ["aggressive", "economic", "defensive"];

export default function NewGame() {
  const { user } = useUser();
  const navigate = useNavigate();
  const preselectedMapId = new URLSearchParams(window.location.search).get("mapId");

  const [name, setName] = useState("");
  const [factions, setFactions] = useState([]);
  const [factionId, setFactionId] = useState("");
  const [worldModel, setWorldModel] = useState("hex");
  const [mapSource, setMapSource] = useState(preselectedMapId ? "library" : "generate");
  const [maps, setMaps] = useState([]);
  const [mapId, setMapId] = useState(preselectedMapId || "");
  const [planetId, setPlanetId] = useState("cindara");
  const [genPreview, setGenPreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [tileCount, setTileCount] = useState(26);
  const [humanCount, setHumanCount] = useState(2);
  const [npcs, setNpcs] = useState([]);
  const [winType, setWinType] = useState("capitals");
  const [winValue, setWinValue] = useState(15);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const totalSlots = humanCount + npcs.length;
  const isCampaign = humanCount === 1;

  useEffect(() => {
    if (!user) return;
    base44.entities.Faction.filter({ created_by_id: user.id }).then((f) => {
      setFactions(f);
      if (f.length > 0) setFactionId(f[0].id);
    });
    base44.entities.GameMap.filter({ isPublished: true }, "-created_date", 50).then(setMaps);
  }, [user]);

  useEffect(() => {
    if (isCampaign && npcs.length === 0) setNpcs(["aggressive"]);
  }, [isCampaign, npcs.length]);

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await base44.functions.invoke("generateMap", {
        tileCount, playerCount: Math.max(totalSlots, 2),
      });
      setGenPreview(res.data.map);
    } catch (e) {
      setError(e.response?.data?.error || "Map generation failed");
    }
    setGenerating(false);
  };

  const create = async () => {
    setCreating(true);
    setError("");
    try {
      const payload = {
        action: "createGame",
        name: name || "Operation " + ["Ironfall", "Cinder", "Bulwark", "Longwatch", "Redline"][Math.floor(Math.random() * 5)],
        mode: isCampaign ? "campaign" : "multiplayer",
        factionId,
        humanCount,
        npcConfigs: npcs.map((d) => ({ doctrine: d })),
      };
      if (isCampaign) payload.campaignWinCondition = { type: winType, value: Number(winValue) };
      payload.planetId = planetId;
      payload.worldModel = worldModel;
      if (worldModel === "hex") {
        if (mapSource === "library") payload.mapId = mapId;
        else payload.mapData = genPreview;
      }
      const res = await base44.functions.invoke("gameEngine", payload);
      navigate(`/game/${res.data.gameId}`);
    } catch (e) {
      setError(e.response?.data?.error || "Failed to create game");
      setCreating(false);
    }
  };

  const canCreate =
    factionId && totalSlots >= 2 && totalSlots <= 4 &&
    (worldModel === "macro" ||
      (mapSource === "library" && mapId) || (mapSource === "generate" && genPreview));

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <p className="cq-label">War Ministry · Directive</p>
        <h1 className="cq-display text-4xl">Open a New Front</h1>
      </div>

      <div className="cq-panel p-5 space-y-4">
        <div>
          <label className="cq-label">Operation Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Operation Ironfall" className="bg-input border-border mt-1 font-heading tracking-wide" />
        </div>

        <div>
          <label className="cq-label">Your Faction</label>
          {factions.length === 0 ? (
            <p className="text-xs text-muted-foreground mt-1">No factions yet — forge one in the Faction Builder first.</p>
          ) : (
            <select value={factionId} onChange={(e) => setFactionId(e.target.value)} className="w-full bg-input border border-border rounded-sm p-2 text-sm mt-1 text-secondary-foreground font-heading tracking-wide">
              {factions.map((f) => <option key={f.id} value={f.id}>{f.factionName}</option>)}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="cq-label">Human Commanders</label>
            <select value={humanCount} onChange={(e) => { setHumanCount(Number(e.target.value)); setNpcs(npcs.slice(0, 4 - Number(e.target.value))); }} className="w-full bg-input border border-border rounded-sm p-2 text-sm mt-1 text-secondary-foreground font-heading tracking-wide">
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}{n === 1 ? " (solo campaign)" : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="cq-label">NPC Factions ({npcs.length})</label>
            <div className="flex gap-1 mt-1 flex-wrap">
              {npcs.map((d, i) => (
                <select key={i} value={d} onChange={(e) => setNpcs(npcs.map((x, j) => (j === i ? e.target.value : x)))} className="bg-input border border-border rounded-sm p-1.5 text-xs text-secondary-foreground font-heading tracking-wide">
                  {DOCTRINE_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ))}
              {totalSlots < 4 && (
                <Button size="sm" variant="outline" className="border-border text-xs h-8 font-heading" onClick={() => setNpcs([...npcs, "aggressive"])}>+ NPC</Button>
              )}
              {npcs.length > (isCampaign ? 1 : 0) && (
                <Button size="sm" variant="outline" className="border-border text-xs h-8" onClick={() => setNpcs(npcs.slice(0, -1))}>−</Button>
              )}
            </div>
          </div>
        </div>

        {isCampaign && (
          <div className="grid grid-cols-2 gap-4 border-t border-border pt-3">
            <div>
              <label className="cq-label text-brass">Campaign Victory Condition</label>
              <select value={winType} onChange={(e) => setWinType(e.target.value)} className="w-full bg-input border border-border rounded-sm p-2 text-sm mt-1 text-secondary-foreground font-heading tracking-wide">
                <option value="capitals">Capture all capitals</option>
                <option value="survive">Survive N turns</option>
                <option value="territory">Control % of territory</option>
              </select>
            </div>
            {winType !== "capitals" && (
              <div>
                <label className="cq-label">{winType === "survive" ? "Turns" : "Percent"}</label>
                <Input type="number" value={winValue} onChange={(e) => setWinValue(e.target.value)} className="bg-input border-border mt-1" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="cq-panel p-5 space-y-3">
        <div>
          <label className="cq-label">Theater Model</label>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setWorldModel("hex")}
              className={`text-xs font-heading uppercase tracking-[0.2em] px-3 py-1.5 rounded-sm border ${worldModel === "hex" ? "border-brass bg-brass/15 text-brass-bright" : "border-border text-muted-foreground hover:text-brass-bright"}`}
            >
              Hex Front · Classic
            </button>
            <button
              onClick={() => setWorldModel("macro")}
              className={`text-xs font-heading uppercase tracking-[0.2em] px-3 py-1.5 rounded-sm border ${worldModel === "macro" ? "border-rust bg-rust/15 text-rust" : "border-border text-muted-foreground hover:text-brass-bright"}`}
            >
              Macro March · Experimental
            </button>
          </div>
          {worldModel === "macro" && (
            <p className="font-mono text-[10px] text-muted-foreground tracking-wide mt-1.5">
              THE WAR IS FOUGHT ACROSS THE WHOLE THEATER WORLD — DAY-RATE COLUMNS ON THE ROUTE GRAPH. NO HEX MAP.
            </p>
          )}
        </div>
        <div className="border-t border-border pt-3">
          <PlanetPicker value={planetId} onChange={setPlanetId} />
        </div>
        {worldModel === "hex" && (
        <div className="flex gap-2 border-t border-border pt-3">
          <button onClick={() => setMapSource("generate")} className={`text-xs font-heading uppercase tracking-[0.2em] px-3 py-1.5 rounded-sm ${mapSource === "generate" ? "bg-brass/15 text-brass-bright border-b-2 border-brass" : "text-muted-foreground"}`}>Generate Map</button>
          <button onClick={() => setMapSource("library")} className={`text-xs font-heading uppercase tracking-[0.2em] px-3 py-1.5 rounded-sm ${mapSource === "library" ? "bg-brass/15 text-brass-bright border-b-2 border-brass" : "text-muted-foreground"}`}>From Library</button>
        </div>
        )}

        {worldModel === "macro" ? null : mapSource === "generate" ? (
          <div className="space-y-3">
            <div className="flex items-end gap-3">
              <div>
                <label className="cq-label">Territories</label>
                <Input type="number" min={12} max={60} value={tileCount} onChange={(e) => setTileCount(Number(e.target.value))} className="bg-input border-border w-24 mt-1" />
              </div>
              <Button onClick={generate} disabled={generating} variant="outline" className="border-brass/60 text-brass-bright hover:bg-brass/10 font-heading uppercase text-xs tracking-[0.2em]">
                {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                {genPreview ? "Regenerate" : "Generate"}
              </Button>
            </div>
            {genPreview && (
              <div className="bg-background rounded-sm border border-border p-2">
                <p className="text-xs text-muted-foreground font-mono mb-1">{genPreview.name} · {genPreview.tiles.length} zones</p>
                <HexBoard tiles={genPreview.tiles} maxHeight={300} />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <select
              value={mapId}
              onChange={(e) => {
                setMapId(e.target.value);
                const m = maps.find((x) => x.id === e.target.value);
                if (m?.planetId) setPlanetId(m.planetId);
              }}
              className="w-full bg-input border border-border rounded-sm p-2 text-sm text-secondary-foreground font-heading tracking-wide"
            >
              <option value="">Select a map…</option>
              {maps.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.tiles?.length} zones, {m.recommendedPlayerCount}p)</option>)}
            </select>
            {mapId && maps.find((m) => m.id === mapId) && (
              <div className="bg-background rounded-sm border border-border p-2">
                <HexBoard tiles={maps.find((m) => m.id === mapId).tiles} maxHeight={300} />
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-rust font-mono">{error}</p>}
      <Button disabled={!canCreate || creating} onClick={create} className="w-full bg-rust hover:bg-destructive text-destructive-foreground font-heading uppercase tracking-[0.3em] h-11 text-sm">
        {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Muster Forces
      </Button>
    </div>
  );
}