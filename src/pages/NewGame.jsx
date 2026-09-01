import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import useUser from "@/hooks/useUser";
import { Input } from "@/components/ui/input";
import PlanetPicker from "@/components/setup/PlanetPicker";
import LabelTip from "@/components/ui/LabelTip";
import DirectiveHeader from "@/components/setup/DirectiveHeader";
import FactionSelect from "@/components/setup/FactionSelect";
import CommandRoster from "@/components/setup/CommandRoster";
import OrderOfBattle from "@/components/setup/OrderOfBattle";
import { PRESET_FACTIONS, presetToFactionRecord } from "@/lib/presetFactions";

// Numbered directive section — each field of Form 7-K
function Section({ step, title, tip, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="cq-panel p-4"
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        <span className="flex items-center justify-center w-7 h-7 rounded-sm border border-brass/50 bg-brass/10 font-display text-sm text-brass-bright">
          {step}
        </span>
        <label className="cq-label text-foreground/90">
          {title}
          {tip && <LabelTip title={title} body={tip} />}
        </label>
      </div>
      {children}
    </motion.div>
  );
}

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
  const [forgingId, setForgingId] = useState("");
  const [error, setError] = useState("");

  const totalSlots = humanCount + npcs.length;
  const isCampaign = humanCount === 1;

  useEffect(() => {
    if (!user) return;
    // A failed roster call must not leave the directive blank — report it and
    // still offer the standing preset factions below.
    base44.entities.Faction.filter({ created_by_id: user.id })
      .then((f) => {
        setFactions(f);
        if (f.length > 0) setFactionId(f[0].id);
      })
      .catch(() => {
        setFactions([]);
        setError("The registry could not be raised — requisition a standing faction below.");
      });
    base44.entities.GameMap.filter({ isPublished: true }, "-created_date", 50).then(setMaps).catch(() => setMaps([]));
  }, [user]);

  useEffect(() => {
    if (isCampaign && npcs.length === 0) setNpcs(["aggressive"]);
  }, [isCampaign, npcs.length]);

  const forgePreset = async (preset) => {
    setForgingId(preset.id);
    setError("");
    try {
      const created = await base44.entities.Faction.create(presetToFactionRecord(preset));
      setFactions((prev) => [...prev, created]);
      setFactionId(created.id);
    } catch (e) {
      setError(e.response?.data?.error || "Failed to requisition preset faction");
    }
    setForgingId("");
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
  const selectedFaction = factions.find((f) => f.id === factionId);
  const selectedMap = maps.find((m) => m.id === mapId);

  return (
    <div className="max-w-3xl xl:max-w-6xl mx-auto space-y-5 cq-page-in">
      <DirectiveHeader />

      <div className="grid xl:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="space-y-4">
          <Section step="01" title="Operation Name" delay={0.05}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Operation Ironfall — leave blank and the Ministry names it"
              className="bg-input border-border font-heading tracking-wide"
            />
          </Section>

          <Section step="02" title="Your Banner" tip="The banner you take the field under. Presets are ready-made; the Faction Foundry forges custom nations." delay={0.1}>
            <FactionSelect
              factions={factions}
              factionId={factionId}
              setFactionId={setFactionId}
              forgingId={forgingId}
              forgePreset={forgePreset}
            />
          </Section>

          <Section step="03" title="Command Roster" tip="Who takes the four chairs at the war table. One human alone opens a solo campaign against machine rivals." delay={0.15}>
            <CommandRoster
              humanCount={humanCount}
              setHumanCount={setHumanCount}
              npcs={npcs}
              setNpcs={setNpcs}
              isCampaign={isCampaign}
            />
            {isCampaign && (
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-3 mt-3">
                <div>
                  <label className="cq-label text-brass">Victory Condition<LabelTip title="Victory Condition" body="What wins the campaign: controlling a share of the world's settlements, or simply surviving a number of days." /></label>
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
          </Section>

          <Section step="04" title="Theater of War" delay={0.2}>
            <PlanetPicker value={planetId} onChange={setPlanetId} />
            <div className="border-t border-border pt-3 mt-3">
              <label className="cq-label">Charted Map (optional)<LabelTip title="Charted Map" body="Fight on a chart drafted in the Cartography Bureau. Leave blank and the theater world above is generated for you." /></label>
              <select
                value={mapId}
                onChange={(e) => setMapId(e.target.value)}
                className="w-full bg-input border border-border rounded-sm p-2 text-sm mt-1 text-secondary-foreground font-heading tracking-wide"
              >
                <option value="">— Generated theater world —</option>
                {maps.filter((m) => (m.nodes || []).length > 1).map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({(m.nodes || []).length} settlements)</option>
                ))}
              </select>
            </div>
          </Section>
        </div>

        <OrderOfBattle
          name={name}
          factionName={selectedFaction?.factionName}
          planetId={planetId}
          mapName={selectedMap?.name}
          humanCount={humanCount}
          npcs={npcs}
          isCampaign={isCampaign}
          winType={winType}
          winValue={winValue}
          canCreate={canCreate}
          creating={creating}
          error={error}
          onCreate={create}
        />
      </div>
    </div>
  );
}