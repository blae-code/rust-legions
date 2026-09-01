import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Volume2, VolumeX, Handshake, FlaskConical, ClipboardList, HelpCircle } from "lucide-react";
import CommandTip from "@/components/ui/CommandTip";
import TourGuide from "@/components/tour/TourGuide";
import { GAME_TOUR_STEPS, TOUR_DONE_KEY } from "@/lib/tourSteps";
import QuartermasterLedger from "@/components/game/ledger/QuartermasterLedger";
import FactionOverview from "@/components/game/overview/FactionOverview";
import { LayoutDashboard } from "lucide-react";
import CodexPanel from "@/components/codex/CodexPanel";
import { BookOpen } from "lucide-react";
import { playSfx, sfxEnabled, setSfxEnabled } from "@/lib/sfx";
import { setScoreSuppressed } from "@/lib/ambience";
import { setSoundscape, stopSoundscape } from "@/lib/soundscape";
import SoundscapeControl from "@/components/audio/SoundscapeControl";
import CombatLog from "@/components/game/CombatLog";
import FieldReportSummary from "@/components/game/FieldReportSummary";
import RelicVault from "@/components/game/relics/RelicVault";
import SettlementDossiers from "@/components/game/relics/SettlementDossiers";
import CharterParley from "@/components/game/relics/CharterParley";
import CrisisDispatch from "@/components/game/crisis/CrisisDispatch";
import StabilityGauge from "@/components/game/crisis/StabilityGauge";
import LocalAccordsPanel from "@/components/game/relics/LocalAccordsPanel";
import ProtectorateRegister from "@/components/game/relics/ProtectorateRegister";
import { Landmark, Building2 } from "lucide-react";
import ReplayTheater from "@/components/game/replay/ReplayTheater";
import AfterActionScreen from "@/components/game/summary/AfterActionScreen";
import { ScrollText } from "lucide-react";
import StalemateAlert from "@/components/game/StalemateAlert";
import AttritionBanner from "@/components/game/AttritionBanner";
import { Film } from "lucide-react";
import LobbyView from "@/components/game/LobbyView";
import BriefingScreen from "@/components/game/briefing/BriefingScreen";
import WarChronicle from "@/components/game/WarChronicle";
import WarCharts from "@/components/game/charts/WarCharts";
import BattleView from "@/components/game/BattleView";
import BattleReport from "@/components/game/BattleReport";
import DispatchArchive from "@/components/game/DispatchArchive";
import NpcIntercepts from "@/components/game/NpcIntercepts";
import CampaignSummary from "@/components/game/CampaignSummary";
import WeatherBadge from "@/components/game/WeatherBadge";
import WeatherOverlay from "@/components/game/weather/WeatherOverlay";
import WeatherAlert from "@/components/game/weather/WeatherAlert";
import DiplomacyPanel from "@/components/game/diplomacy/DiplomacyPanel";
import DoctrinePanel from "@/components/game/research/DoctrinePanel";
import MacroWarRoom from "@/components/game/macro/MacroWarRoom";
import NoChartNotice from "@/components/game/macro/NoChartNotice";
import GameChat from "@/components/game/chat/GameChat";
import OperationControls from "@/components/game/manage/OperationControls";
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
  const [showReplay, setShowReplay] = useState(false);
  const [showDoctrine, setShowDoctrine] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [showCodex, setShowCodex] = useState(false);
  const [showAccords, setShowAccords] = useState(false);
  const [showProtectorate, setShowProtectorate] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [showAfterAction, setShowAfterAction] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const briefingShown = useRef(false);
  const afterActionShown = useRef(false);
  const pollRef = useRef(null);
  const prevBattleRef = useRef(false);
  const [turnStinger, setTurnStinger] = useState(0);
  const prevMyTurn = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("gameEngine", { action: "getState", gameId });
      // A malformed dispatch must never reach the war room — hold the front screen instead
      if (!res.data?.id) {
        setError(res.data?.error || "The Signals Directorate could not raise this front");
        return;
      }
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

  // First war: open the guided tour once the front is live and we hold a slot
  useEffect(() => {
    if (game?.status !== "active" || game.mySlot === null || game.mySlot === undefined) return;
    if (localStorage.getItem(TOUR_DONE_KEY)) return;
    const t = setTimeout(() => setTourOpen(true), 1200);
    return () => clearTimeout(t);
  }, [game?.status, game?.mySlot]);

  // The front goes live — the sealed operation file lands on the desk, once per war
  useEffect(() => {
    if (game?.status !== "active" || briefingShown.current) return;
    briefingShown.current = true;
    if (localStorage.getItem(`cq_briefing_${gameId}`)) return;
    setShowBriefing(true);
  }, [game?.status, gameId]);

  // The war ends — the Ministry files its dossier and puts it straight on the desk
  useEffect(() => {
    if (game?.status !== "complete" || afterActionShown.current) return;
    afterActionShown.current = true;
    const t = setTimeout(() => setShowAfterAction(true), 900);
    return () => clearTimeout(t);
  }, [game?.status]);

  // The field bed follows the theater: planet sets the air, weather reshapes it
  useEffect(() => {
    if (game?.status === "active") setSoundscape({ planetId: game.planetId, weather: game.weather });
    else stopSoundscape();
  }, [game?.status, game?.planetId, game?.weather]);
  useEffect(() => () => stopSoundscape(), []);

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
      setBusy(false);
      return null;
    } catch (e) {
      const msg = e.response?.data?.error || "Order failed";
      setError(msg);
      setBusy(false);
      return msg;
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

  // Bartering at a settlement market — errors surface inside the Bazaar window
  const barter = async (payload) => {
    try {
      await base44.functions.invoke("gameEngine", { gameId, action: "macroBarter", ...payload });
      playSfx("purchase");
      await refresh();
    } catch (e) {
      throw new Error(e.response?.data?.error || "The market turns you away");
    }
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
      <>
      <OperationControls game={game} onChanged={refresh} floating />
      <LobbyView
        game={game}
        busy={busy}
        error={error}
        onJoin={(factionId) => act({ action: "joinGame", factionId })}
        onStart={() => act({ action: "startGame" })}
        onAction={act}
      />
      </>
    );
  }

  const currentFaction = game.factions[game.currentSlot];

  return (
    <div className="space-y-4">
      {game.status === "active" && <WeatherOverlay weather={game.weather} />}
      {game.status === "active" && (
        <WeatherAlert
          weather={game.weather}
          planetName={WORLDS.find((p) => p.id === game.planetId)?.name || "Cindara"}
        />
      )}
      {/* Command bar */}
      <div data-tour="command-bar" className="cq-panel relative overflow-hidden px-4 pt-4 pb-3 flex flex-wrap items-center gap-3">
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
        {game.status === "active" && (
          <SoundscapeControl
            planetName={WORLDS.find((p) => p.id === game.planetId)?.name || "Cindara"}
            weather={game.weather}
          />
        )}
        {game.status === "active" && <WeatherBadge weather={game.weather} />}
        {game.status === "active" && game.myResearch && (
          <CommandTip title="Doctrine Research" body="Set your research focus and unlock prototypes — this may be done off-turn, while you wait.">
            <button
              onClick={() => setShowDoctrine(true)}
              className={`relative p-1.5 rounded-sm border transition-colors ${game.myResearch.focus ? "border-brass/50 text-brass-bright" : "border-border text-muted-foreground hover:text-brass-bright hover:border-brass/50"}`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              {!game.myResearch.focus && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rust cq-lamp text-rust" />}
            </button>
          </CommandTip>
        )}
        {game.status === "active" && game.mySlot !== null && game.mySlot !== undefined && (
          <CommandTip title="Faction Overview" body="Holdings, supply network and standing bonuses, gathered on one dashboard.">
            <button
              data-tour="desks"
              onClick={() => { playSfx("select"); setShowOverview(true); }}
              className="p-1.5 rounded-sm border border-border text-muted-foreground hover:text-brass-bright hover:border-brass/50 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
            </button>
          </CommandTip>
        )}
        {game.status === "active" && game.mySlot !== null && game.mySlot !== undefined && (
          <CommandTip title="Quartermaster's Ledger" body="Every holding, its daily income, and whether it sits inside your supply network.">
            <button
              onClick={() => { playSfx("select"); setShowLedger(true); }}
              className="p-1.5 rounded-sm border border-border text-muted-foreground hover:text-brass-bright hover:border-brass/50 transition-colors"
            >
              <ClipboardList className="w-3.5 h-3.5" />
            </button>
          </CommandTip>
        )}
        {game.status === "active" && game.mySlot !== null && game.mySlot !== undefined && (
          <CommandTip title="Protectorate Register" body="Settlement histories, accords, and standing tribute across your protectorates.">
            <button
              onClick={() => { playSfx("select"); setShowProtectorate(true); }}
              className="p-1.5 rounded-sm border border-border text-muted-foreground hover:text-brass-bright hover:border-brass/50 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
            </button>
          </CommandTip>
        )}
        {game.status === "active" && game.mySlot !== null && game.mySlot !== undefined && (
          <CommandTip title="Governor's Desk" body="Set policy for your settlements — integrate, trade, or tax — and open the bazaar.">
            <button
              onClick={() => { playSfx("select"); setShowAccords(true); }}
              className="p-1.5 rounded-sm border border-border text-muted-foreground hover:text-brass-bright hover:border-brass/50 transition-colors"
            >
              <Landmark className="w-3.5 h-3.5" />
            </button>
          </CommandTip>
        )}
        <CommandTip title="Operation Briefing" body="Reopen the sealed briefing file — objectives, terrain and weather conditions.">
          <button
            onClick={() => { playSfx("select"); setShowBriefing(true); }}
            className="p-1.5 rounded-sm border border-border text-muted-foreground hover:text-brass-bright hover:border-brass/50 transition-colors"
          >
            <ScrollText className="w-3.5 h-3.5" />
          </button>
        </CommandTip>
        <CommandTip title="The Archive" body="Factions, worlds, and the annals of past campaigns.">
          <button
            onClick={() => { playSfx("select"); setShowCodex(true); }}
            className="p-1.5 rounded-sm border border-border text-muted-foreground hover:text-brass-bright hover:border-brass/50 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
          </button>
        </CommandTip>
        {game.status === "active" && game.diplomacy && (
          <CommandTip title="Envoy Desk" body="Diplomacy — propose pacts and trades. A red lamp means an offer awaits your answer.">
            <button
              onClick={() => setShowDiplomacy(true)}
              className="relative p-1.5 rounded-sm border border-border text-muted-foreground hover:text-brass-bright hover:border-brass/50 transition-colors"
            >
              <Handshake className="w-3.5 h-3.5" />
              {game.diplomacy.incoming.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rust cq-lamp text-rust" />}
            </button>
          </CommandTip>
        )}
        <OperationControls game={game} onChanged={refresh} />
        <CommandTip title="Battlefield Audio" body={sound ? "Mute clicks, marches and battle effects." : "Enable clicks, marches and battle effects."}>
          <button
            onClick={() => { setSfxEnabled(!sound); setSound(!sound); }}
            className={`p-1.5 rounded-sm border transition-colors ${sound ? "border-brass/50 text-brass-bright" : "border-border text-muted-foreground"}`}
          >
            {sound ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </CommandTip>
        {game.status === "active" && (
          <CommandTip title="Guided Tour" body="Replay the walkthrough of the war room.">
            <button
              onClick={() => { playSfx("select"); setTourOpen(true); }}
              className="p-1.5 rounded-sm border border-border text-muted-foreground hover:text-brass-bright hover:border-brass/50 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </CommandTip>
        )}
        {game.status === "active" && (
          game.isMyTurn ? (
            <Button data-tour="end-turn" size="sm" disabled={busy} onClick={() => act({ action: "endTurn" })} className="bg-brass hover:bg-brass-bright text-primary-foreground font-heading uppercase text-xs tracking-[0.2em]">
              End Turn
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-2 font-heading tracking-wide">
              <Loader2 className="w-3 h-3 animate-spin" /> {currentFaction?.factionName}'s turn
            </span>
          )
        )}
      </div>

      {game.status === "paused" && (
        <div className="relative cq-panel border-brass/60 p-4 text-center overflow-hidden">
          <div className="cq-hazard absolute top-0 left-0 right-0" />
          <p className="cq-display text-xl text-brass-bright">Operations Suspended</p>
          <p className="font-mono text-[9px] text-muted-foreground tracking-[0.25em] mt-1">
            THE MINISTRY HOLDS ALL ORDERS — THE FRONT RESUMES ON THE HOST'S COMMAND
          </p>
        </div>
      )}

      {game.status === "cancelled" && (
        <div className="relative cq-panel border-rust/60 p-5 text-center overflow-hidden">
          <div className="cq-hazard absolute top-0 left-0 right-0" />
          <p className="cq-display text-2xl text-rust">Struck from the Register</p>
          <p className="font-mono text-[9px] text-muted-foreground tracking-[0.25em] mt-1">
            THE WAR ENDED WITHOUT DECISION — THIS FILE IS CLOSED
          </p>
          <span className="cq-stamp absolute top-3 right-4 text-sm">Void</span>
        </div>
      )}

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
          <div className="relative mt-3 flex flex-wrap gap-2 justify-center">
            <Button
              size="sm"
              className="font-heading uppercase text-xs tracking-[0.2em]"
              onClick={() => { playSfx("select"); setShowAfterAction(true); }}
            >
              <ScrollText className="w-3.5 h-3.5" /> After-Action Dossier
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-brass/50 text-brass-bright font-heading uppercase text-xs tracking-[0.2em]"
              onClick={() => { playSfx("select"); setShowReplay(true); }}
            >
              <Film className="w-3.5 h-3.5" /> Watch War Replay
            </Button>
          </div>
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

      <AttritionBanner attrition={game.attrition} turnNumber={game.turnNumber} />
      <StalemateAlert game={game} />

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          {game.macro?.nodes?.length ? <MacroWarRoom game={game} busy={busy} onAction={act} /> : <NoChartNotice />}
          <WarCharts history={game.statHistory} factions={game.factions} />
        </div>
        <div className="space-y-4">
          {game.status === "active" && game.myResources && (
            <div data-tour="resources" className={`relative overflow-hidden rounded border px-4 py-2.5 space-y-1.5 ${game.isMyTurn ? "border-brass/50 bg-brass/10" : "border-border bg-card"}`}>
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
              <StabilityGauge value={game.myStability} />
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>Army {game.myArmyPoints}/{game.myArmyCap} pts</span>
                <span>Control {game.myLandControl}% / {game.mapControlTarget}%</span>
              </div>
            </div>
          )}
          {game.status === "active" && <RelicVault game={game} />}
          {game.status === "active" && <SettlementDossiers game={game} />}
          <FieldReportSummary entries={game.combatLog} factions={game.factions} turnNumber={game.turnNumber} />
          <NpcIntercepts game={game} />
          <DispatchArchive archives={game.battleArchives} />
          <CombatLog entries={game.combatLog} />
          {game.mySlot !== null && game.mySlot !== undefined && (
            <div data-tour="field-wire">
              <GameChat gameId={game.id} myName={game.factions.find((f) => f.isMe)?.factionName || "Commander"} />
            </div>
          )}
        </div>
      </div>

      {game.status === "active" && !game.battle && (
        <CrisisDispatch
          crisis={game.macro?.crisis}
          resources={game.myResources || {}}
          onChoose={(nodeId, choiceId) => act({ action: "macroResolveCrisis", nodeId, choiceId })}
        />
      )}

      {game.status === "active" && !game.battle && !game.macro?.crisis && (
        <CharterParley
          charter={game.macro?.charter}
          onChoose={(nodeId, choiceId) => act({ action: "macroResolveCharter", nodeId, choiceId })}
          game={game}
          onBarter={barter}
        />
      )}

      {showAfterAction && game.status === "complete" && (
        <AfterActionScreen game={game} onClose={() => setShowAfterAction(false)} />
      )}
      {showBriefing && (
        <BriefingScreen
          game={game}
          onClose={() => { setShowBriefing(false); localStorage.setItem(`cq_briefing_${gameId}`, "1"); }}
        />
      )}
      {showReplay && <ReplayTheater game={game} onClose={() => setShowReplay(false)} />}
      <LocalAccordsPanel
        open={showAccords}
        onClose={() => setShowAccords(false)}
        game={game}
        busy={busy}
        onSet={(nodeId, policy) => act({ action: "macroSetPolicy", nodeId, policy })}
        onBarter={barter}
      />
      <ProtectorateRegister open={showProtectorate} onClose={() => setShowProtectorate(false)} game={game} />
      <FactionOverview open={showOverview} onClose={() => setShowOverview(false)} game={game} />
      <QuartermasterLedger open={showLedger} onClose={() => setShowLedger(false)} game={game} />
      <CodexPanel open={showCodex} onClose={() => setShowCodex(false)} activePlanetId={game.planetId} />
      <DiplomacyPanel open={showDiplomacy} onClose={() => setShowDiplomacy(false)} game={game} busy={busy} onAction={act} />
      <DoctrinePanel open={showDoctrine} onClose={() => setShowDoctrine(false)} research={game.myResearch} busy={busy} onSetFocus={setResearchFocus} game={game} onUnlock={unlockItem} />
      <BattleView battle={game.battle} busy={busy} onChoose={(maneuver) => act({ action: "battleChoice", maneuver })} onAction={act} />
      {!game.battle && <BattleReport report={report} onClose={() => setReport(null)} />}

      <TourGuide
        open={tourOpen}
        steps={GAME_TOUR_STEPS}
        onClose={() => { setTourOpen(false); localStorage.setItem(TOUR_DONE_KEY, "1"); }}
      />

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