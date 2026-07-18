import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildWorldFromNodes } from "@/lib/macro/worlds";
import { NODE_KINDS, CHART } from "@/lib/macro/graph";
import MinistryChart from "@/components/chart/MinistryChart";
import { playSfx } from "@/lib/sfx";

const KIND_ORDER = ["city", "town", "depot", "crossroads", "ruin"];
const NAME_SEED = ["Ashfall", "Ironreach", "Rustmoor", "Greyhold", "Blackgate", "Paleyard", "Coldhaven", "Dustspur", "Slagcross", "Tarfield", "Bonequay", "Cinderridge", "Salthollow", "Stormworks", "Coalbarrow", "Brassmarch", "Mirepoint", "Fendeep", "Kraelwatch", "Voststead"];

// The Cartography Bureau — draft a war chart by placing settlements; the
// Ministry grows the world around them (continents form under node clusters,
// convoy lanes bridge the seas). Published charts are playable at operation setup.
export default function MapEditor() {
  const navigate = useNavigate();
  const [mapName, setMapName] = useState("");
  const [description, setDescription] = useState("");
  const [playerCount, setPlayerCount] = useState(2);
  const [nodes, setNodes] = useState([]);
  const [kind, setKind] = useState("city");
  const [selected, setSelected] = useState(null);
  const [survey, setSurvey] = useState(true); // live world preview
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [serial, setSerial] = useState(1);

  // The Ministry's survey of the drafted chart — same generator the game uses
  const world = useMemo(() => {
    if (nodes.length === 0) return { nodes: [], routes: [], continents: [], size: { ...CHART } };
    const built = buildWorldFromNodes(nodes.map((n) => ({ ...n })), [], 7);
    return survey ? built : { ...built, continents: [] };
  }, [nodes, survey]);

  const place = (x, y) => {
    if (selected) { setSelected(null); return; }
    if (nodes.some((n) => Math.hypot(n.x - x, n.y - y) < 26)) { setError("Too close to a charted settlement"); return; }
    setError("");
    playSfx("build");
    const name = NAME_SEED[(serial - 1) % NAME_SEED.length] + (serial > NAME_SEED.length ? ` ${Math.ceil(serial / NAME_SEED.length)}` : "");
    setNodes([...nodes, { id: `m${serial}`, name, kind, x, y }]);
    setSerial(serial + 1);
  };

  const selectedNode = nodes.find((n) => n.id === selected);
  const updateSelected = (patch) => setNodes(nodes.map((n) => (n.id === selected ? { ...n, ...patch } : n)));
  const removeSelected = () => { setNodes(nodes.filter((n) => n.id !== selected)); setSelected(null); playSfx("select"); };

  const cities = nodes.filter((n) => n.kind === "city").length;
  const canPublish = mapName && nodes.length >= 8 && cities >= Math.max(playerCount, 2);

  const publish = async () => {
    setSaving(true);
    setError("");
    try {
      await base44.entities.GameMap.create({
        name: mapName, description,
        nodes, routes: [],
        recommendedPlayerCount: playerCount,
        isPublished: true,
      });
      playSfx("endTurn");
      navigate("/maps");
    } catch (e) {
      setError(e.response?.data?.error || "Failed to file the chart");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Link to="/" className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-muted-foreground hover:text-brass-bright transition-colors">
        <ArrowLeft className="w-3 h-3" /> COMMAND DECK
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="cq-label text-rust">Cartography Bureau</p>
          <h1 className="cq-display text-3xl">Draft a War Chart</h1>
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest mt-1">
            CLICK THE BOARD TO PLACE A SETTLEMENT · THE MINISTRY GROWS THE WORLD AROUND YOUR CHART
          </p>
        </div>
        <button
          onClick={() => { playSfx("select"); setSurvey((v) => !v); }}
          className={`cq-metal font-heading uppercase tracking-widest text-[10px] px-3 py-1.5 rounded-sm border transition-colors ${survey ? "border-brass/70 text-brass-bright" : "border-border text-muted-foreground"}`}
        >
          Survey World {survey ? "ON" : "OFF"}
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <div className="cq-panel cq-brackets relative overflow-hidden p-1">
          <div className="cq-hazard absolute top-0 left-0 right-0 z-10" />
          <MinistryChart
            world={world}
            hovered={selectedNode || null}
            onNodeClick={(n) => { playSfx("select"); setSelected(n.id === selected ? null : n.id); }}
            onCanvasClick={place}
            height="64vh"
          />
          <div className="cq-scanlines absolute inset-0 pointer-events-none z-[5]" />
          <div className="cq-vignette absolute inset-0 pointer-events-none z-[5]" />
        </div>

        <div className="space-y-3">
          <div className="cq-panel p-4 space-y-3">
            <div>
              <label className="cq-label">Chart Name</label>
              <Input value={mapName} onChange={(e) => setMapName(e.target.value)} placeholder="The Sundered Reach" className="bg-input border-border mt-1 font-heading tracking-wide" />
            </div>
            <div>
              <label className="cq-label">Ministry Notes</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Two continents split by a convoy corridor" className="bg-input border-border mt-1 text-xs" />
            </div>
            <div>
              <label className="cq-label">Recommended Commanders</label>
              <select value={playerCount} onChange={(e) => setPlayerCount(Number(e.target.value))} className="w-full bg-input border border-border rounded-sm p-1.5 text-xs text-secondary-foreground font-heading tracking-wide mt-1">
                {[2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="cq-panel p-4">
            <p className="cq-label mb-2">Settlement Stamp</p>
            <div className="flex flex-wrap gap-1.5">
              {KIND_ORDER.map((k) => (
                <button
                  key={k}
                  onClick={() => { playSfx("hover"); setKind(k); }}
                  className={`cq-metal font-heading uppercase tracking-widest text-[10px] px-2.5 py-1.5 rounded-sm border transition-colors ${kind === k ? "border-brass text-brass-bright bg-brass/10" : "border-border text-muted-foreground hover:text-brass-bright"}`}
                >
                  {NODE_KINDS[k].label}
                </button>
              ))}
            </div>
            <p className="font-mono text-[9px] text-muted-foreground mt-2">
              {nodes.length} SETTLEMENTS · {cities} CITIES · {world.continents.length} LANDMASSES · {world.routes.length} ROUTES SURVEYED
            </p>
          </div>

          {selectedNode && (
            <div className="cq-panel p-4 border-brass/50 space-y-2">
              <p className="cq-label">Selected: {selectedNode.name}</p>
              <Input value={selectedNode.name} onChange={(e) => updateSelected({ name: e.target.value })} className="bg-input border-border text-xs" />
              <select value={selectedNode.kind} onChange={(e) => updateSelected({ kind: e.target.value })} className="w-full bg-input border border-border rounded-sm p-1.5 text-xs text-secondary-foreground font-heading tracking-wide">
                {KIND_ORDER.map((k) => <option key={k} value={k}>{NODE_KINDS[k].label}</option>)}
              </select>
              <Button size="sm" variant="outline" onClick={removeSelected} className="border-rust/60 text-rust font-heading uppercase text-[10px] w-full">
                <Trash2 className="w-3 h-3 mr-1" /> Strike from the Chart
              </Button>
            </div>
          )}

          {error && <p className="text-xs text-rust font-mono">{error}</p>}
          <Button disabled={!canPublish || saving} onClick={publish} className="w-full bg-brass hover:bg-brass-bright text-primary-foreground font-heading uppercase tracking-[0.25em] h-10 text-xs">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} File with the Registry
          </Button>
          {!canPublish && (
            <p className="font-mono text-[9px] text-muted-foreground tracking-wide">
              A CHART NEEDS A NAME, ≥ 8 SETTLEMENTS AND AT LEAST {Math.max(playerCount, 2)} CITIES (SPAWN GROUNDS).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
