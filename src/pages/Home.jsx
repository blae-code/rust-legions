import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useUser from "@/hooks/useUser";
import { Shield, Loader2 } from "lucide-react";
import WarTable3D from "@/components/home/WarTable3D";
import BootSequence from "@/components/home/BootSequence";
import GameMenu from "@/components/home/GameMenu";
import DossierPanel from "@/components/home/DossierPanel";
import FrontCard from "@/components/home/FrontCard";
import DispatchTicker from "@/components/home/DispatchTicker";
import HudTelemetry from "@/components/home/HudTelemetry";
import IntelBrief from "@/components/home/IntelBrief";
import StandingOrders from "@/components/home/StandingOrders";

export default function Home() {
  const { user } = useUser();
  const [games, setGames] = useState(null);
  const [factions, setFactions] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user) return;
    base44.functions.invoke("gameEngine", { action: "listMyGames" }).then((r) => setGames(r.data.games));
    base44.entities.Faction.filter({ created_by_id: user.id }).then(setFactions);
    // Lazily ensure a UserProfile exists
    base44.entities.UserProfile.filter({ created_by_id: user.id }).then(async (profiles) => {
      if (profiles.length === 0) {
        setProfile(await base44.entities.UserProfile.create({ displayName: user.full_name || user.email }));
      } else {
        setProfile(profiles[0]);
      }
    });
  }, [user]);

  const continueGame =
    games?.find((g) => g.status === "active" && g.isMyTurn) ||
    games?.find((g) => g.status === "active") ||
    games?.find((g) => g.status === "lobby") ||
    null;

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-background">
      <WarTable3D />
      <BootSequence />
      {/* Readability + CRT atmosphere over the 3D table */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/55 to-background/30 pointer-events-none" />
      <div className="absolute inset-0 cq-scanlines opacity-20 pointer-events-none" />
      <div className="absolute inset-0 cq-vignette pointer-events-none" />

      <div className="relative z-10 h-full max-w-[1600px] mx-auto px-4 md:px-8 pt-4 pb-2 flex flex-col">
        {/* HUD top strip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-brass font-display text-xl tracking-[0.25em] uppercase">
            <Shield className="w-5 h-5" /> Conquest
          </div>
          <div className="hidden md:block"><HudTelemetry /></div>
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest hidden sm:block cq-flicker">
            ⁜ SECURE CHANNEL · CMDR {(user?.full_name || user?.email || "").split(" ")[0]?.toUpperCase()} ⁜
          </p>
        </div>

        <div className="mt-3">
          <DispatchTicker />
        </div>

        {/* Command deck — everything fits the viewport; panels scroll internally */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1.1fr_minmax(320px,380px)] xl:grid-cols-[1.05fr_minmax(300px,360px)_minmax(260px,300px)] gap-4 xl:gap-5 pt-4 overflow-y-auto lg:overflow-hidden">
          {/* Left: title + main menu + rotating intel */}
          <div className="flex flex-col min-h-0 lg:overflow-y-auto lg:pr-1">
            <p className="cq-label text-rust mb-1.5">The continent burns · A commander is wanted</p>
            <div className="relative inline-block self-start">
              <h1 className="cq-display text-5xl sm:text-6xl leading-[0.9]">
                Conquest<br />
                <span className="text-brass-bright">Tactics</span>
              </h1>
              <span className="cq-stamp absolute -right-10 -top-2 text-xs whitespace-nowrap">Under Development</span>
            </div>
            <p className="font-mono text-[9px] text-rust/90 tracking-[0.25em] mt-1.5">⚠ FIELD TRIAL BUILD — SYSTEMS SUBJECT TO CHANGE WITHOUT NOTICE</p>
            <div className="cq-hazard w-40 mt-3" />
            <GameMenu continueGame={continueGame} />
            <div className="mt-auto pt-4 hidden lg:block max-w-md">
              <IntelBrief />
            </div>
          </div>

          {/* Middle: operations log — full-height, scrolls internally */}
          <div className="cq-panel cq-brackets p-4 flex flex-col min-h-0 lg:max-h-full">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <p className="cq-label">Operations Log</p>
              <span className="font-mono text-[9px] text-muted-foreground">{games?.length ?? 0} ON RECORD</span>
            </div>
            {games === null ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : games.length === 0 ? (
              <p className="font-mono text-[10px] text-muted-foreground tracking-widest py-4 text-center">
                NO ENGAGEMENTS ON RECORD — OPEN A NEW OPERATION
              </p>
            ) : (
              <div className="space-y-2.5 flex-1 min-h-0 overflow-y-auto pr-1 max-h-[45vh] lg:max-h-none">
                {games.map((g, i) => (
                  <FrontCard key={g.id} game={g} index={i} />
                ))}
              </div>
            )}
            {/* Dossier joins this column when the right rail is hidden */}
            <div className="xl:hidden pt-3 shrink-0">
              <DossierPanel profile={profile} factionCount={factions?.length} />
            </div>
          </div>

          {/* Right rail: dossier + standing orders */}
          <div className="hidden xl:flex flex-col gap-4 min-h-0 overflow-y-auto">
            <DossierPanel profile={profile} factionCount={factions?.length} />
            <StandingOrders />
            <div className="flex-1" />
            <p className="font-mono text-[8px] text-muted-foreground/60 tracking-[0.25em] leading-relaxed">
              DOCUMENT CLASS: RESTRICTED<br />
              DISTRIBUTION: FIELD COMMANDERS ONLY<br />
              DESTROY AFTER READING
            </p>
          </div>
        </div>

        {/* HUD bottom strip */}
        <p className="font-mono text-[9px] text-muted-foreground/70 tracking-[0.3em] text-center pt-2 pb-1 shrink-0">
          MINISTRY OF WAR · FIELD TERMINAL 7-A · ALL TRANSMISSIONS MONITORED
        </p>
      </div>
    </div>
  );
}