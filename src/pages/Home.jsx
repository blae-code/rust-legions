import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import useUser from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Swords, Flag, Map, Loader2, PenTool } from "lucide-react";

const HERO_IMG = "https://media.base44.com/images/public/6a58196dcd485ecc774cae1b/ca29f8b58_generated_image.png";

export default function Home() {
  const { user } = useUser();
  const [games, setGames] = useState(null);
  const [factions, setFactions] = useState(null);

  useEffect(() => {
    if (!user) return;
    base44.functions.invoke("gameEngine", { action: "listMyGames" }).then((r) => setGames(r.data.games));
    base44.entities.Faction.filter({ created_by_id: user.id }).then(setFactions);
    // Lazily ensure a UserProfile exists
    base44.entities.UserProfile.filter({ created_by_id: user.id }).then((profiles) => {
      if (profiles.length === 0) {
        base44.entities.UserProfile.create({ displayName: user.full_name || user.email });
      }
    });
  }, [user]);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="relative rounded overflow-hidden border border-border">
        <img src={HERO_IMG} alt="Crawlers advancing at dawn" className="w-full h-64 sm:h-80 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <p className="cq-label mb-1">Dispatch · The Front Awaits</p>
          <h1 className="cq-display text-4xl sm:text-6xl leading-none">Conquest Tactics</h1>
          <p className="text-sm text-secondary-foreground font-heading tracking-wide mt-2 max-w-lg">
            Command your faction through fog and fire. Seize territory, requisition armor, and break the enemy line — Commander {user?.full_name?.split(" ")[0] || ""}.
          </p>
          <div className="flex gap-3 mt-4">
            <Link to="/new-game">
              <Button className="bg-rust hover:bg-destructive text-destructive-foreground font-heading uppercase tracking-[0.2em]">
                <Swords className="w-4 h-4 mr-2" /> Open a Front
              </Button>
            </Link>
            <Link to="/faction-builder">
              <Button variant="outline" className="border-brass/60 text-brass-bright hover:bg-brass/10 font-heading uppercase tracking-[0.2em]">
                <Flag className="w-4 h-4 mr-2" /> Forge a Faction
              </Button>
            </Link>
          </div>
        </div>
        <div className="cq-hazard absolute bottom-0 left-0 right-0" />
      </div>

      {/* Active Fronts */}
      <section>
        <h2 className="cq-label mb-3 flex items-center gap-2">
          <Swords className="w-3.5 h-3.5 text-brass" /> Active Fronts
        </h2>
        {games === null ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : games.length === 0 ? (
          <p className="text-sm text-muted-foreground border border-dashed border-border rounded p-6 text-center font-heading tracking-wide">
            No active wars. Open a front to begin the campaign.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => (
              <Link key={g.id} to={`/game/${g.id}`} className="cq-panel p-4 hover:border-brass/60 transition-colors group">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-heading font-semibold text-lg tracking-wide text-foreground group-hover:text-brass-bright transition-colors">{g.name}</h3>
                  <span className={`cq-tag ${
                    g.status === "lobby" ? "border-steel/50 text-steel" :
                    g.status === "active" ? (g.isMyTurn ? "border-brass text-brass-bright bg-brass/10" : "border-border text-muted-foreground") :
                    "border-border text-muted-foreground"
                  }`}>
                    {g.status === "lobby" ? "Staging" : g.status === "active" ? (g.isMyTurn ? "Your turn" : `Turn ${g.turnNumber}`) : "Concluded"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {g.mode === "campaign" ? "CAMPAIGN" : "MULTIPLAYER"} · {g.playerCount} FACTIONS
                  {g.winnerName && ` · VICTOR: ${g.winnerName.toUpperCase()}`}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Factions */}
      <section>
        <h2 className="cq-label mb-3 flex items-center gap-2">
          <Flag className="w-3.5 h-3.5 text-brass" /> Your Factions
        </h2>
        {factions === null ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : factions.length === 0 ? (
          <div className="border border-dashed border-border rounded p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3 font-heading tracking-wide">You command no faction yet. Forge one through the lifepath builder.</p>
            <Link to="/faction-builder">
              <Button variant="outline" className="border-brass/60 text-brass-bright hover:bg-brass/10 font-heading uppercase text-xs tracking-[0.2em]">Forge a Faction</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {factions.map((f) => (
              <div key={f.id} className="cq-panel p-4">
                <h3 className="font-heading font-semibold text-lg tracking-wide text-foreground">{f.factionName}</h3>
                <p className="cq-tag border-rust/60 text-rust mb-2 mt-0.5">{f.doctrine} doctrine</p>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{f.lore}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(f.traits || []).map((t, i) => (
                    <span key={i} className="text-[10px] font-heading uppercase tracking-wider bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-sm">{t.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tools */}
      <section className="flex gap-3">
        <Link to="/maps">
          <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground text-xs font-heading uppercase tracking-[0.2em]">
            <Map className="w-3.5 h-3.5 mr-2" /> Map Library
          </Button>
        </Link>
        <Link to="/map-editor">
          <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground text-xs font-heading uppercase tracking-[0.2em]">
            <PenTool className="w-3.5 h-3.5 mr-2" /> Map Editor
          </Button>
        </Link>
      </section>
    </div>
  );
}