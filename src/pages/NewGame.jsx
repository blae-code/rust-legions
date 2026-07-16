import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import useUser from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw } from "lucide-react";
import HexBoard from "@/components/hexmap/HexBoard";

const DOCTRINE_OPTS = ["aggressive", "economic", "defensive"];

export default function NewGame() {
  const { user } = useUser();
  const navigate = useNavigate();
  const preselectedMapId = new URLSearchParams(window.location.search).get("mapId");

  const [name, setName] = useState("");
  const [factions, setFactions] = useState([]);
  const [factionId, setFactionId] = useState("");
  const [mapSource, setMapSource] = useState(preselectedMapId ? "library" : "generate");
  const [maps, setMaps] = useState([]);
  const [mapId, setMapId] = useState(preselectedMapId || "");
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
      if (mapSource === "library") payload.mapId = mapId;
      else payload.mapData = genPreview;
      const res = await base44.functions.invoke("gameEngine", payload);
      navigate(`/game/${res.data.gameId}`);
    } catch (e) {
      setError(e.response?.data?.error || "Failed to create game");
      setCreating(false);
    }
  };

  const canCreate =
    factionId && totalSlots >= 2 && totalSlots <= 4 &&
    ((mapSource === "library" && mapId) || (mapSource === "generate" && genPreview));

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold uppercase tracking-widest text-stone-100">Open a New Front</h1>

      <div className="border border-stone-800 bg-[#1C1714] rounded-lg p-5 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-stone-500">Operation Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Operation Ironfall" className="bg-stone-900 border-stone-700 mt-1" />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-stone-500">Your Faction</label>
          {factions.length === 0 ? (
            <p className="text-xs text-stone-500 mt-1">No factions yet — forge one in the Faction Builder first.</p>
          ) : (
            <select value={factionId} onChange={(e) => setFactionId(e.target.value)} className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-sm mt-1 text-stone-300">
              {factions.map((f) => <option key={f.id} value={f.id}>{f.factionName}</option>)}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-stone-500">Human Commanders</label>
            <select value={humanCount} onChange={(e) => { setHumanCount(Number(e.target.value)); setNpcs(npcs.slice(0, 4 - Number(e.target.value))); }} className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-sm mt-1 text-stone-300">
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}{n === 1 ? " (solo campaign)" : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-stone-500">NPC Factions ({npcs.length})</label>
            <div className="flex gap-1 mt-1 flex-wrap">
              {npcs.map((d, i) => (
                <select key={i} value={d} onChange={(e) => setNpcs(npcs.map((x, j) => (j === i ? e.target.value : x)))} className="bg-stone-900 border border-stone-700 rounded p-1.5 text-xs text-stone-300">
                  {DOCTRINE_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ))}
              {totalSlots < 4 && (
                <Button size="sm" variant="outline" className="border-stone-700 text-xs h-8" onClick={() => setNpcs([...npcs, "aggressive"])}>+ NPC</Button>
              )}
              {npcs.length > (isCampaign ? 1 : 0) && (
                <Button size="sm" variant="outline" className="border-stone-700 text-xs h-8" onClick={() => setNpcs(npcs.slice(0, -1))}>−</Button>
              )}
            </div>
          </div>
        </div>

        {isCampaign && (
          <div className="grid grid-cols-2 gap-4 border-t border-stone-800 pt-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-amber-700">Campaign Victory Condition</label>
              <select value={winType} onChange={(e) => setWinType(e.target.value)} className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-sm mt-1 text-stone-300">
                <option value="capitals">Capture all capitals</option>
                <option value="survive">Survive N turns</option>
                <option value="territory">Control % of territory</option>
              </select>
            </div>
            {winType !== "capitals" && (
              <div>
                <label className="text-xs uppercase tracking-wider text-stone-500">{winType === "survive" ? "Turns" : "Percent"}</label>
                <Input type="number" value={winValue} onChange={(e) => setWinValue(e.target.value)} className="bg-stone-900 border-stone-700 mt-1" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border border-stone-800 bg-[#1C1714] rounded-lg p-5 space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setMapSource("generate")} className={`text-xs uppercase tracking-wider px-3 py-1.5 rounded ${mapSource === "generate" ? "bg-amber-900/40 text-amber-400" : "text-stone-500"}`}>Generate Map</button>
          <button onClick={() => setMapSource("library")} className={`text-xs uppercase tracking-wider px-3 py-1.5 rounded ${mapSource === "library" ? "bg-amber-900/40 text-amber-400" : "text-stone-500"}`}>From Library</button>
        </div>

        {mapSource === "generate" ? (
          <div className="space-y-3">
            <div className="flex items-end gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-stone-500">Territories</label>
                <Input type="number" min={12} max={60} value={tileCount} onChange={(e) => setTileCount(Number(e.target.value))} className="bg-stone-900 border-stone-700 w-24 mt-1" />
              </div>
              <Button onClick={generate} disabled={generating} variant="outline" className="border-amber-800 text-amber-500 uppercase text-xs tracking-wider">
                {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                {genPreview ? "Regenerate" : "Generate"}
              </Button>
            </div>
            {genPreview && (
              <div className="bg-stone-950 rounded p-2">
                <p className="text-xs text-stone-500 mb-1">{genPreview.name} · {genPreview.tiles.length} zones</p>
                <HexBoard tiles={genPreview.tiles} maxHeight={300} />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <select value={mapId} onChange={(e) => setMapId(e.target.value)} className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-sm text-stone-300">
              <option value="">Select a map…</option>
              {maps.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.tiles?.length} zones, {m.recommendedPlayerCount}p)</option>)}
            </select>
            {mapId && maps.find((m) => m.id === mapId) && (
              <div className="bg-stone-950 rounded p-2">
                <HexBoard tiles={maps.find((m) => m.id === mapId).tiles} maxHeight={300} />
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button disabled={!canCreate || creating} onClick={create} className="w-full bg-red-900 hover:bg-red-800 uppercase tracking-widest">
        {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Muster Forces
      </Button>
    </div>
  );
}