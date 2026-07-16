import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import useUser from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Swords, Flag, Loader2 } from "lucide-react";
import HeroSection from "@/components/home/HeroSection";
import DispatchTicker from "@/components/home/DispatchTicker";
import CommandLedger from "@/components/home/CommandLedger";
import HomeFooter from "@/components/home/HomeFooter";
import SectionHeader from "@/components/home/SectionHeader";
import FrontCard from "@/components/home/FrontCard";
import FactionCard from "@/components/home/FactionCard";
import ToolsSection from "@/components/home/ToolsSection";
import DoctrineBriefing from "@/components/home/DoctrineBriefing";
import ServiceRecord from "@/components/home/ServiceRecord";
import FeaturedMaps from "@/components/home/FeaturedMaps";

export default function Home() {
  const { user } = useUser();
  const [games, setGames] = useState(null);
  const [factions, setFactions] = useState(null);
  const [profile, setProfile] = useState(null);
  const [maps, setMaps] = useState(null);

  useEffect(() => {
    if (!user) return;
    base44.functions.invoke("gameEngine", { action: "listMyGames" }).then((r) => setGames(r.data.games));
    base44.entities.Faction.filter({ created_by_id: user.id }).then(setFactions);
    base44.entities.GameMap.filter({ isPublished: true }, "-created_date", 3).then(setMaps);
    // Lazily ensure a UserProfile exists
    base44.entities.UserProfile.filter({ created_by_id: user.id }).then(async (profiles) => {
      if (profiles.length === 0) {
        setProfile(await base44.entities.UserProfile.create({ displayName: user.full_name || user.email }));
      } else {
        setProfile(profiles[0]);
      }
    });
  }, [user]);

  return (
    <div>
      <HeroSection firstName={user?.full_name?.split(" ")[0]} />
      <DispatchTicker />

      <div className="pt-8">
        <CommandLedger games={games} factions={factions} />
      </div>

      <div className="space-y-14 py-10">
        {/* Service Record */}
        <ServiceRecord profile={profile} />

        {/* Active Fronts */}
        <section>
          <SectionHeader icon={Swords} kicker="Situation Report" title="Active Fronts" />
          {games === null ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : games.length === 0 ? (
            <div className="cq-panel cq-brackets p-10 text-center">
              <p className="font-mono text-[10px] text-muted-foreground tracking-widest mb-2">NO ENGAGEMENTS ON RECORD</p>
              <p className="text-sm text-secondary-foreground font-heading tracking-wide mb-4">The map table sits silent. Open a front and set the continent ablaze.</p>
              <Link to="/new-game">
                <Button className="bg-rust hover:bg-destructive text-destructive-foreground font-heading uppercase text-xs tracking-[0.25em]">
                  <Swords className="w-3.5 h-3.5 mr-2" /> Open a Front
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {games.map((g, i) => (
                <FrontCard key={g.id} game={g} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* Factions */}
        <section>
          <SectionHeader icon={Flag} kicker="Ministry of Heraldry" title="Your Factions" />
          {factions === null ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : factions.length === 0 ? (
            <div className="cq-panel cq-brackets p-10 text-center">
              <p className="font-mono text-[10px] text-muted-foreground tracking-widest mb-2">NO BANNERS REGISTERED</p>
              <p className="text-sm text-secondary-foreground font-heading tracking-wide mb-4">You command no faction yet. Forge one through the lifepath builder.</p>
              <Link to="/faction-builder">
                <Button variant="outline" className="border-brass/60 text-brass-bright hover:bg-brass/10 font-heading uppercase text-xs tracking-[0.25em]">
                  <Flag className="w-3.5 h-3.5 mr-2" /> Forge a Faction
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {factions.map((f, i) => (
                <FactionCard key={f.id} faction={f} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* How the war is waged */}
        <section>
          <SectionHeader kicker="Field Manual 7-A" title="How the War Is Waged" />
          <DoctrineBriefing />
        </section>

        {/* Featured maps */}
        {maps && maps.length > 0 && (
          <section>
            <SectionHeader kicker="Cartographic Archive" title="Featured Theaters" />
            <FeaturedMaps maps={maps} />
          </section>
        )}

        {/* War Room Tools */}
        <section>
          <SectionHeader kicker="The War Room" title="Cartography & Archives" />
          <ToolsSection />
        </section>
      </div>

      <HomeFooter />
    </div>
  );
}