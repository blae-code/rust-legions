import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Volume2, VolumeX, Handshake, FlaskConical } from "lucide-react";
import { playSfx, sfxEnabled, setSfxEnabled } from "@/lib/sfx";
import { setScoreSuppressed } from "@/lib/ambience";
import HexBoard3D from "@/components/hexmap3d/HexBoard3D";
import TilePanel from "@/components/game/TilePanel";
import PurchasePanel from "@/components/game/PurchasePanel";
import CombatLog from "@/components/game/CombatLog";
import BuildPanel from "@/components/game/BuildPanel";
import LobbyView from "@/components/game/LobbyView";
import WarChronicle from "@/components/game/WarChronicle";
import OverlayToggle from "@/components/game/OverlayToggle";
import WarCharts from "@/components/game/charts/WarCharts";
import ArmyPanel from "@/components/game/ArmyPanel";
import MusterPanel from "@/components/game/MusterPanel";
import BattleView from "@/components/game/BattleView";
import BattleReport from "@/components/game/BattleReport";
import ProbePanel from "@/components/game/ProbePanel";
import DispatchArchive from "@/components/game/DispatchArchive";
import CombatResolution from "@/components/game/CombatResolution";
import CampaignSummary from "@/components/game/CampaignSummary";
import WeatherBadge from "@/components/game/WeatherBadge";
import DiplomacyPanel from "@/components/game/diplomacy/DiplomacyPanel";
import DoctrinePanel from "@/components/game/research/DoctrinePanel";
import FortressBay from "@/components/game/fortress/FortressBay";
import GameChat from "@/components/game/chat/GameChat";
import { RESOURCE_KEYS, RESOURCE_META } from "@/lib/units";

export default function GamePage() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedArmyId, setSelectedArmyId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sound, setSound] = useState(sfxEnabled());
  const [overlay, setOverlay] = useState(null);
  const [report, setReport] = useState(null);
  const [resolution, setResolution] = useState(null);
  const [mapFx, setMapFx] = useState(null);
  const [showDiplomacy, setShowDiplomacy] = useState(false);
  const [showDoctrine, setShowDoctrine] = useState(false);
  const pollRef = useRef(null);
  const prevBattleRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("gameEngine", { action: "getState", gameId });
      setGame(res.data);
    } catch (e) {
      setError(e.response?.data?.error || "Failed to load game");
    }
  }, [gameId]);

  const battleActive = !!game?.battle;

  // The pregame score keeps playing through the lobby; it yields once the war is live
  useEffect(() => {
    setScoreSuppressed(!!game && game.status !== "lobby");
  }, [game?.status]);
  useEffect(() => () => setScoreSuppressed(false), []);

  // Surface the after-action report when a battle we were watching concludes
  useEffect(() => {
    if (prevBattleRef.current && !battleActive && game?.battleReport) setReport(game.battleReport);
    prevBattleRef.current = battleActive;
  }, [battleActive, game?.battleReport]);

  useEffect(() => {
    refresh();
    pollRef.current = setInterval(refresh, battleActive ? 2500 : 4000);
    return () => clearInterval(pollRef.current);
  }, [refresh, battleActive]);

  const act = async (payload) => {
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("gameEngine", { gameId, ...payload });
      if (payload.action === "attack" && res.data?.report) setResolution(res.data.report);
      const sfxMap = { moveUnits: "move", attack: "attack", bombard: "attack", build: "build", purchaseUnits: "purchase", endTurn: "endTurn", musterArmy: "purchase", reinforceArmy: "purchase", moveArmy: "move", battleChoice: "attack", disbandArmy: "move", proposeDiplomacy: "purchase", respondDiplomacy: "purchase", installModule: "build", moveBase: "move" };
      if (sfxMap[payload.action]) playSfx(sfxMap[payload.action]);
      if ((payload.action === "attack" || payload.action === "bombard") && payload.toTileId) {
        setMapFx({ tileId: payload.toTileId, key: Date.now() });
      }
      await refresh();
    } catch (e) {
      setError(e.response?.data?.error || "Order failed");
    }
    setBusy(false);
  };

  const probe = async (tileId) => {
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("gameEngine", { gameId, action: "probe", tileId });
      playSfx("move");
      await refresh();
      setBusy(false);
      return res.data.intel;
    } catch (e) {
      setError(e.response?.data?.error || "Probe failed");
      setBusy(false);
      return null;
      }
      };

      // Research focus is an off-turn ("concurrent play") action — routed to its own engine
      const setResearchFocus = async (techId) => {
      setBusy(true);
      setError("");
      try {
        await base44.functions.invoke("concurrentPlay", { gameId, action: "setResearchFocus", techId });
        playSfx("build");
        await refresh();
      } catch (e) {
        setError(e.response?.data?.error || "Directive failed");
      }
      setBusy(false);
      };

  // Armory unlocks are also off-turn — spend treasury on prototypes & decrees while waiting
  const unlockItem = async (itemId) => {
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("concurrentPlay", { gameId, action: "unlockItem", itemId });
      playSfx("build");
      await refresh();
    } catch (e) {
      setError(e.response?.data?.error || "Requisition failed");
    }
    setBusy(false);
  };

  if (!game) {
    return (
      <div className="flex justify-center py-20">
        {error ? <p className="text-rust">{error}</p> : <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />}
      </div>
    );
  }

  if (game.status === "lobby") {
    return (
      <LobbyView
        game={game}
        busy={busy}
        error={error}
        onJoin={(factionId) => act({ action: "joinGame", factionId })}
        onStart={() => act({ action: "startGame" })}
      />
    );
  }

  const slotColors = Object.fromEntries(game.factions.map((f) => [f.slotIndex, f.color]));
  const currentFaction = game.factions[game.currentSlot];
  const selectedTile = game.tiles.find((t) => t.id === selectedId);
  const selectedArmy = (game.armies || []).find((a) => a.id === selectedArmyId && a.owner === game.mySlot);

  return (
    <div className="space-y-4">
      {/* Command bar */}
      <div className="cq-panel relative overflow-hidden px-4 pt-4 pb-3 flex flex-wrap items-center gap-3">
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <div>
          <h1 className="cq-display text-2xl leading-none">{game.name}</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">TURN {game.turnNumber} · {game.mode === "campaign" ? "CAMPAIGN" : "MULTIPLAYER"}</p>
        </div>
        <div className="flex gap-2 flex-wrap ml-auto items-center">
          {game.factions.map((f) => (
            <div key={f.slotIndex} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-sm border font-heading tracking-wide bg-secondary/40 ${
              game.currentSlot === f.slotIndex && game.status === "active" ? "border-brass bg-brass/15" : "border-border"
            } ${f.eliminated ? "opacity-40 line-through" : ""}`}>
              <div className={`w-2.5 h-2.5 rounded-full ring-1 ring-black/50 ${game.currentSlot === f.slotIndex && game.status === "active" ? "cq-lamp" : ""}`} style={{ background: f.color, color: f.color }} />
              <span className="text-secondary-foreground">{f.factionName}{f.isNPC && <span className="text-muted-foreground"> (NPC)</span>}</span>
            </div>
          ))}
        </div>
        {game.status === "active" && <WeatherBadge weather={game.weather} />}
        {game.status === "active" && game.myResearch && (
          <button
            onClick={() => setShowDoctrine(true)}
            title="Doctrine Research — may be set off-turn"
            className={`relative p-1.5 rounded-sm border transition-colors ${game.myResearch.focus ? "border-brass/50 text-brass-bright" : "border-border text-muted-foreground hover:text-brass-bright hover:border-brass/50"}`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            {!game.myResearch.focus && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rust cq-lamp text-rust" />}
          </button>
        )}
        {game.status === "active" && game.diplomacy && (
          <button
            onClick={() => setShowDiplomacy(true)}
            title="Envoy Desk — diplomacy"
            className="relative p-1.5 rounded-sm border border-border text-muted-foreground hover:text-brass-bright hover:border-brass/50 transition-colors"
          >
            <Handshake className="w-3.5 h-3.5" />
            {game.diplomacy.incoming.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rust cq-lamp text-rust" />}
          </button>
        )}
        <button
          onClick={() => { setSfxEnabled(!sound); setSound(!sound); }}
          title={sound ? "Mute battlefield audio" : "Enable battlefield audio"}
          className={`p-1.5 rounded-sm border transition-colors ${sound ? "border-brass/50 text-brass-bright" : "border-border text-muted-foreground"}`}
        >
          {sound ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
        {game.status === "active" && (
          game.isMyTurn ? (
            <Button size="sm" disabled={busy} onClick={() => act({ action: "endTurn" })} className="bg-brass hover:bg-brass-bright text-primary-foreground font-heading uppercase text-xs tracking-[0.2em]">
              End Turn
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-2 font-heading tracking-wide">
              <Loader2 className="w-3 h-3 animate-spin" /> {currentFaction?.factionName}'s turn
            </span>
          )
        )}
      </div>

      {game.status === "complete" && (
        <div className="relative cq-panel border-brass/70 p-5 text-center overflow-hidden">
          <div className="cq-hazard absolute top-0 left-0 right-0" />
          <p className="cq-display text-2xl text-brass-bright">
            {game.winnerName ? `${game.winnerName} has won the war` : "The war has ended"}
          </p>
        </div>
      )}

      {game.status === "complete" && <CampaignSummary gameId={game.id} />}

      {game.status === "complete" && <WarChronicle entries={game.combatLog} />}

      {error && <p className="text-xs text-rust font-mono">{error}</p>}

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          <div className="cq-panel cq-brackets relative overflow-hidden p-2 pt-6">
            <div className="absolute inset-0 cq-board" />
            <div className="absolute inset-0 cq-scanlines opacity-25" />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 font-mono text-[9px] text-brass/60 tracking-[0.35em] pointer-events-none whitespace-nowrap cq-flicker">
              ⁜ TACTICAL THEATER · LIVE FEED ⁜
            </div>
            <div className="relative">
              <div className="px-2 pb-2">
                <OverlayToggle overlay={overlay} onChange={setOverlay} factions={game.factions} />
              </div>
              <HexBoard3D
                tiles={game.tiles}
                weather={game.status === "active" ? game.weather : "clear"}
                slotColors={slotColors}
                selectedId={selectedId}
                overlay={overlay}
                fx={mapFx}
                armies={game.armies || []}
                selectedArmyId={selectedArmyId}
                onArmyClick={(a) => {
                  if (a.owner === game.mySlot) { setSelectedArmyId(a.id === selectedArmyId ? null : a.id); setSelectedId(null); }
                  else { setSelectedId(a.tileId); setSelectedArmyId(null); }
                }}
                onTileClick={(t) => { setSelectedId(t.id === selectedId ? null : t.id); setSelectedArmyId(null); }}
              />
            </div>
          </div>
          <WarCharts history={game.statHistory} factions={game.factions} />
        </div>
        <div className="space-y-4">
          {game.status === "active" && game.myResources && (
            <div className={`relative overflow-hidden rounded border px-4 py-2.5 space-y-1.5 ${game.isMyTurn ? "border-brass/50 bg-brass/10" : "border-border bg-card"}`}>
              {game.isMyTurn && (
                <>
                  <div className="cq-hazard absolute top-0 left-0 right-0" />
                  <p className="text-xs text-brass-bright font-heading uppercase tracking-[0.2em] pt-1">Your turn, Commander</p>
                </>
              )}
              <div className="flex justify-between text-xs font-mono text-secondary-foreground">
                {RESOURCE_KEYS.map((k) => (
                  <span key={k} title={RESOURCE_META[k].label}>
                    {RESOURCE_META[k].icon} {game.myResources[k] || 0}
                    <span className="text-muted-foreground"> +{game.myProduction?.[k] || 0}</span>
                  </span>
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>Army {game.myArmyPoints}/{game.myArmyCap} pts</span>
                <span>Control {game.myLandControl}% / {game.mapControlTarget}%</span>
              </div>
            </div>
          )}
          <FortressBay game={game} busy={busy} onAction={act} />
          <ArmyPanel
            game={game}
            army={selectedArmy}
            busy={busy}
            onMarch={(armyId, toTileId) => act({ action: "moveArmy", armyId, toTileId })}
            onEngage={(armyId, toTileId) => act({ action: "moveArmy", armyId, toTileId })}
            onDisband={(armyId) => { act({ action: "disbandArmy", armyId }); setSelectedArmyId(null); }}
            onReinforce={(armyId, regiments) => act({ action: "reinforceArmy", armyId, regiments })}
          />
          <MusterPanel
            game={game}
            tile={selectedTile}
            busy={busy}
            onMuster={(tileId, regiments, generalId, designId) => act({ action: "musterArmy", tileId, regiments, generalId, designId })}
          />
          <ProbePanel game={game} tile={selectedTile} busy={busy} onProbe={probe} />
          <TilePanel
            game={game}
            tile={selectedTile}
            busy={busy}
            onMove={(from, to, units) => act({ action: "moveUnits", fromTileId: from, toTileId: to, units })}
            onAttack={(from, to, units) => act({ action: "attack", fromTileId: from, toTileId: to, units })}
            onBombard={(from, to) => act({ action: "bombard", fromTileId: from, toTileId: to })}
          />
          <BuildPanel game={game} tile={selectedTile} busy={busy} onBuild={(tileId, buildingType) => act({ action: "build", tileId, buildingType })} />
          <PurchasePanel game={game} busy={busy} onPurchase={(tileId, units) => act({ action: "purchaseUnits", tileId, units })} />
          <DispatchArchive archives={game.battleArchives} />
          <CombatLog entries={game.combatLog} />
          {game.mySlot !== null && game.mySlot !== undefined && (
            <GameChat gameId={game.id} myName={game.factions.find((f) => f.isMe)?.factionName || "Commander"} />
          )}
        </div>
      </div>

      <DiplomacyPanel open={showDiplomacy} onClose={() => setShowDiplomacy(false)} game={game} busy={busy} onAction={act} />
      <DoctrinePanel open={showDoctrine} onClose={() => setShowDoctrine(false)} research={game.myResearch} busy={busy} onSetFocus={setResearchFocus} game={game} onUnlock={unlockItem} />
      <CombatResolution report={resolution} onClose={() => setResolution(null)} />
      <BattleView battle={game.battle} busy={busy} onChoose={(maneuver) => act({ action: "battleChoice", maneuver })} />
      {!game.battle && <BattleReport report={report} onClose={() => setReport(null)} />}
    </div>
  );
}