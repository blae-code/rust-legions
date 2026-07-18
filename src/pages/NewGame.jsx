import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import useUser from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import PlanetPicker from "@/components/setup/PlanetPicker";

const DOCTRINE_OPTS = ["aggressive", "economic", "defensive"];

export default function NewGame() {
  const { user } = useUser();
  const navigate = useNavigate();
  const preselectedMapId = new URLSearchParams(window.location.search).get("mapId");

  const [name, setName] = useState("");
  const [factions, setFactions] = useState([]);
  const [factionId, setFactionId] = useState("");
  const [maps, setMaps] = useState([]);
  const [mapId, setMapId] = useState(preselectedMapId || "");
  const [planetId, setPlanetId] = useState("cindara");
  const [humanCount, setHumanCount] = useState(2);
  const [npcs, setNpcs] = useState([]);
  const [winType, setWinType] = useState("territory");
  const [winValue, setWinValue] = useState(60);
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
        worldModel: "macro",
        planetId,
      };
      if (isCampaign) payload.campaignWinCondition = { type: winType, value: Number(winValue) };
      if (mapId) payload.mapId = mapId;
      const res = await base44.functions.invoke("gameEngine", payload);
      navigate(`/game/${res.data.gameId}`);
    } catch (e) {
      setError(e.response?.data?.error || "Failed to create game");
      setCreating(false);
    }
  };

  const canCreate = factionId && totalSlots >= 2 && totalSlots <= 4;

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
                <option value="territory">Control % of settlements</option>
                <option value="survive">Survive N days</option>
              </select>
            </div>
            <div>
              <label className="cq-label">{winType === "survive" ? "Days" : "Percent"}</label>
              <Input type="number" value={winValue} onChange={(e) => setWinValue(e.target.value)} className="bg-input border-border mt-1" />
            </div>
          </div>
        )}
      </div>

      <div className="cq-panel p-5 space-y-3">
        <PlanetPicker value={planetId} onChange={setPlanetId} />
        <div className="border-t border-border pt-3">
          <label className="cq-label">Charted Map (optional)</label>
          <p className="font-mono text-[10px] text-muted-foreground tracking-wide mt-0.5 mb-1">
            USE A CHART DRAFTED IN THE CARTOGRAPHY BUREAU — THE WORLD IS GROWN AROUND ITS SETTLEMENTS. LEAVE BLANK FOR THE THEATER WORLD ABOVE.
          </p>
          <select
            value={mapId}
            onChange={(e) => setMapId(e.target.value)}
            className="w-full bg-input border border-border rounded-sm p-2 text-sm text-secondary-foreground font-heading tracking-wide"
          >
            <option value="">— Generated theater world —</option>
            {maps.filter((m) => (m.nodes || []).length > 1).map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({(m.nodes || []).length} settlements)</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-rust font-mono">{error}</p>}
      <Button disabled={!canCreate || creating} onClick={create} className="w-full bg-rust hover:bg-destructive text-destructive-foreground font-heading uppercase tracking-[0.3em] h-11 text-sm">
        {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Muster Forces
      </Button>
    </div>
  );
}
