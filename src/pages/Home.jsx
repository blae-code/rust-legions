import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useUser from "@/hooks/useUser";
import { Shield, Loader2 } from "lucide-react";
import WarTable3D from "@/components/home/WarTable3D";
import BootSequence from "@/components/home/BootSequence";
import GameMenu from "@/components/home/GameMenu";
import DossierPanel from "@/components/home/DossierPanel";
import FrontCard from "@/components/home/FrontCard";

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
    <div className="relative min-h-screen overflow-hidden bg-background">
      <WarTable3D />
      <BootSequence />
      {/* Readability + CRT atmosphere over the 3D table */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/55 to-background/30 pointer-events-none" />
      <div className="absolute inset-0 cq-scanlines opacity-20 pointer-events-none" />
      <div className="absolute inset-0 cq-vignette pointer-events-none" />

      <div className="relative z-10 min-h-screen max-w-7xl mx-auto px-6 md:px-10 py-6 flex flex-col">
        {/* HUD top strip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-brass font-display text-xl tracking-[0.25em] uppercase">
            <Shield className="w-5 h-5" /> Conquest
          </div>
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest hidden sm:block cq-flicker">
            ⁜ SECURE CHANNEL · CMDR {(user?.full_name || user?.email || "").split(" ")[0]?.toUpperCase()} ⁜
          </p>
        </div>

        <div className="flex-1 grid lg:grid-cols-[1fr_380px] gap-10 items-center py-10">
          {/* Title + main menu */}
          <div>
            <p className="cq-label text-rust mb-2">The continent burns · A commander is wanted</p>
            <div className="relative inline-block">
              <h1 className="cq-display text-6xl sm:text-7xl leading-[0.9]">
                Conquest<br />
                <span className="text-brass-bright">Tactics</span>
              </h1>
              <span className="cq-stamp absolute -right-8 -top-3 text-xs sm:text-sm whitespace-nowrap">Under Development</span>
            </div>
            <p className="font-mono text-[9px] text-rust/90 tracking-[0.25em] mt-2">⚠ FIELD TRIAL BUILD — SYSTEMS SUBJECT TO CHANGE WITHOUT NOTICE</p>
            <div className="cq-hazard w-40 mt-4" />
            <GameMenu continueGame={continueGame} />
          </div>

          {/* Operations log + dossier */}
          <div className="space-y-4">
            <div className="cq-panel cq-brackets p-4">
              <div className="flex items-center justify-between mb-3">
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
                <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-1">
                  {games.map((g, i) => (
                    <FrontCard key={g.id} game={g} index={i} />
                  ))}
                </div>
              )}
            </div>
            <DossierPanel profile={profile} factionCount={factions?.length} />
          </div>
        </div>

        {/* HUD bottom strip */}
        <p className="font-mono text-[9px] text-muted-foreground/70 tracking-[0.3em] text-center pb-1">
          MINISTRY OF WAR · FIELD TERMINAL 7-A · ALL TRANSMISSIONS MONITORED
        </p>
      </div>
    </div>
  );
}