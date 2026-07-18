import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Volume2, VolumeX, Handshake, FlaskConical } from "lucide-react";
import { playSfx, sfxEnabled, setSfxEnabled } from "@/lib/sfx";
import { setScoreSuppressed } from "@/lib/ambience";
import CombatLog from "@/components/game/CombatLog";
import LobbyView from "@/components/game/LobbyView";
import WarChronicle from "@/components/game/WarChronicle";
import WarCharts from "@/components/game/charts/WarCharts";
import BattleView from "@/components/game/BattleView";
import BattleReport from "@/components/game/BattleReport";
import DispatchArchive from "@/components/game/DispatchArchive";
import NpcIntercepts from "@/components/game/NpcIntercepts";
import CampaignSummary from "@/components/game/CampaignSummary";
import WeatherBadge from "@/components/game/WeatherBadge";
import DiplomacyPanel from "@/components/game/diplomacy/DiplomacyPanel";
import DoctrinePanel from "@/components/game/research/DoctrinePanel";
import MacroWarRoom from "@/components/game/macro/MacroWarRoom";
import GameChat from "@/components/game/chat/GameChat";
import { RESOURCE_KEYS, RESOURCE_META } from "@/lib/units";
import { getImage } from "@/lib/imageLibrary";
import { WORLDS } from "@/lib/macro/worlds";

export default function GamePage() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sound, setSound] = useState(sfxEnabled());
  const [report, setReport] = useState(null);
  const [showDiplomacy, setShowDiplomacy] = useState(false);
  const [showDoctrine, setShowDoctrine] = useState(false);
  const pollRef = useRef(null);
  const prevBattleRef = useRef(false);
  const [turnStinger, setTurnStinger] = useState(0);
  const prevMyTurn = useRef(null);

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

  // The baton passes to us — telegraph key + orders stamp, and a stamped overlay.
  // battleActive is a dep so a handoff masked by an open battle fires on its close.
  useEffect(() => {
    if (!game) return;
    const mine = !!game.isMyTurn && game.status === "active" && !battleActive;
    const was = prevMyTurn.current;
    prevMyTurn.current = mine;
    if (was === false && mine) {
      playSfx("endTurn");
      setTurnStinger(Date.now());
      const t = setTimeout(() => setTurnStinger(0), 2200);
      return () => clearTimeout(t);
    }
  }, [game?.isMyTurn, game?.status, battleActive]);

  useEffect(() => {
    refresh();
    pollRef.current = setInterval(refresh, battleActive ? 2500 : 4000);
    return () => clearInterval(pollRef.current);
  }, [refresh, battleActive]);

  const act = async (payload) => {
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("gameEngine", { gameId, ...payload });
      const sfxMap = { endTurn: "endTurn", battleChoice: "attack", proposeDiplomacy: "purchase", respondDiplomacy: "purchase" };
      if (sfxMap[payload.action]) playSfx(sfxMap[payload.action]);
      await refresh();
    } catch (e) {
      setError(e.response?.data?.error || "Order failed");
    }
    setBusy(false);
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
      <div className="relative flex justify-center py-24 overflow-hidden">
        <div className="absolute inset-0 cq-scanlines opacity-25 pointer-events-none" />
        <div className="absolute inset-0 cq-vignette pointer-events-none" />
        {error ? (
          <p className="text-rust font-mono text-xs tracking-widest">{error}</p>
        ) : (
          <div className="relative flex flex-col items-center gap-4 cq-flicker">
            <div className="relative">
              <Loader2 className="w-9 h-9 animate-spin text-brass" />
            </div>
            <p className="cq-label text-brass">Signals Directorate</p>
            <p className="font-mono text-[10px] text-muted-foreground tracking-[0.35em] animate-pulse">
              RAISING THE FRONT ON THE WIRE…
            </p>
          </div>
        )}
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

  const currentFaction = game.factions[game.currentSlot];

  return (
    <div className="space-y-4">
      {/* Command bar */}
      <div className="cq-panel relative overflow-hidden px-4 pt-4 pb-3 flex flex-wrap items-center gap-3">
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <div>
          <h1 className="cq-display text-2xl leading-none">{game.name}</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            TURN {game.turnNumber} · {game.mode === "campaign" ? "CAMPAIGN" : "MULTIPLAYER"} ·{" "}
            <Link
              to={`/star-map?planet=${game.planetId || "cindara"}`}
              className="hover:text-brass-bright transition-colors"
              title="Survey the theater on the War Table"
            >
              {(WORLDS.find((p) => p.id === game.planetId)?.name || "Cindara").toUpperCase()}
            </Link>
          </p>
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
          {(() => {
            const meWon = !!game.winnerName && game.factions?.find((f) => f.isMe)?.factionName === game.winnerName;
            const bg = getImage(meWon ? "bg_victory" : "bg_defeat");
            return bg ? <img src={bg} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none select-none" /> : null;
          })()}
          <div className="cq-hazard absolute top-0 left-0 right-0" />
          <p className="cq-display text-2xl text-brass-bright relative">
            {game.winnerName ? `${game.winnerName} has won the war` : "The war has ended"}
          </p>
          <motion.span
            initial={{ scale: 2.4, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: -8 }}
            transition={{ type: "spring", stiffness: 420, damping: 22, delay: 0.35 }}
            className="cq-stamp absolute top-3 right-4 text-sm"
          >
            Armistice
          </motion.span>
        </div>
      )}

      {game.status === "complete" && <CampaignSummary gameId={game.id} />}

      {game.status === "complete" && <WarChronicle entries={game.combatLog} />}

      {error && <p className="text-xs text-rust font-mono">{error}</p>}

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          <MacroWarRoom game={game} busy={busy} onAction={act} />
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
                  <span key={k} title={RESOURCE_META[k].label} className="inline-flex items-center gap-1">
                    {getImage(`res_${k}`)
                      ? <img src={getImage(`res_${k}`)} alt="" aria-hidden="true" className="w-4 h-4 object-contain select-none" />
                      : <span>{RESOURCE_META[k].icon}</span>}
                    {game.myResources[k] || 0}
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
          <NpcIntercepts game={game} />
          <DispatchArchive archives={game.battleArchives} />
          <CombatLog entries={game.combatLog} />
          {game.mySlot !== null && game.mySlot !== undefined && (
            <GameChat gameId={game.id} myName={game.factions.find((f) => f.isMe)?.factionName || "Commander"} />
          )}
        </div>
      </div>

      <DiplomacyPanel open={showDiplomacy} onClose={() => setShowDiplomacy(false)} game={game} busy={busy} onAction={act} />
      <DoctrinePanel open={showDoctrine} onClose={() => setShowDoctrine(false)} research={game.myResearch} busy={busy} onSetFocus={setResearchFocus} game={game} onUnlock={unlockItem} />
      <BattleView battle={game.battle} busy={busy} onChoose={(maneuver) => act({ action: "battleChoice", maneuver })} />
      {!game.battle && <BattleReport report={report} onClose={() => setReport(null)} />}

      {/* Baton receipt — the War Ministry stamps the orders through */}
      <AnimatePresence>
        {turnStinger > 0 && (
          <motion.div
            key={turnStinger}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-0 bg-black/40" />
            <motion.div
              initial={{ scale: 2.6, opacity: 0, rotate: -18 }}
              animate={{ scale: 1, opacity: 1, rotate: -8 }}
              transition={{ type: "spring", stiffness: 520, damping: 20 }}
              className="relative cq-stamp text-3xl sm:text-4xl px-8 py-2"
            >
              Your turn, Commander
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}