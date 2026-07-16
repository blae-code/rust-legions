import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import useUser from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Swords, Flag, Map, Loader2 } from "lucide-react";

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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-widest text-stone-100">Command HQ</h1>
          <p className="text-sm text-stone-500">The front awaits your orders, Commander.</p>
        </div>
        <Link to="/new-game">
          <Button className="bg-red-900 hover:bg-red-800 uppercase tracking-wider">
            <Swords className="w-4 h-4 mr-2" /> New Game
          </Button>
        </Link>
      </div>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
          <Swords className="w-3.5 h-3.5" /> Active Fronts
        </h2>
        {games === null ? (
          <Loader2 className="w-5 h-5 animate-spin text-stone-600" />
        ) : games.length === 0 ? (
          <p className="text-sm text-stone-600 border border-dashed border-stone-800 rounded-lg p-6 text-center">
            No active wars. Start a new game to open a front.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => (
              <Link key={g.id} to={`/game/${g.id}`} className="border border-stone-800 bg-[#1C1714] rounded-lg p-4 hover:border-amber-800 transition-colors">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-stone-200">{g.name}</h3>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                    g.status === "lobby" ? "bg-stone-800 text-stone-400" :
                    g.status === "active" ? (g.isMyTurn ? "bg-amber-900/60 text-amber-400" : "bg-stone-800 text-stone-400") :
                    "bg-stone-800 text-stone-500"
                  }`}>
                    {g.status === "lobby" ? "Staging" : g.status === "active" ? (g.isMyTurn ? "Your turn" : `Turn ${g.turnNumber}`) : "Concluded"}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  {g.mode === "campaign" ? "Campaign" : "Multiplayer"} · {g.playerCount} factions
                  {g.winnerName && ` · Victor: ${g.winnerName}`}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
          <Flag className="w-3.5 h-3.5" /> Your Factions
        </h2>
        {factions === null ? (
          <Loader2 className="w-5 h-5 animate-spin text-stone-600" />
        ) : factions.length === 0 ? (
          <div className="border border-dashed border-stone-800 rounded-lg p-6 text-center">
            <p className="text-sm text-stone-600 mb-3">You command no faction yet. Forge one through the lifepath builder.</p>
            <Link to="/faction-builder">
              <Button variant="outline" className="border-amber-800 text-amber-500 uppercase text-xs tracking-wider">Forge a Faction</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {factions.map((f) => (
              <div key={f.id} className="border border-stone-800 bg-[#1C1714] rounded-lg p-4">
                <h3 className="font-bold text-stone-200">{f.factionName}</h3>
                <p className="text-[10px] uppercase tracking-wider text-amber-700 mb-1">{f.doctrine} doctrine</p>
                <p className="text-xs text-stone-500 line-clamp-2">{f.lore}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(f.traits || []).map((t, i) => (
                    <span key={i} className="text-[10px] bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded">{t.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex gap-3">
        <Link to="/maps">
          <Button variant="outline" className="border-stone-700 text-stone-400 text-xs uppercase tracking-wider">
            <Map className="w-3.5 h-3.5 mr-2" /> Map Library
          </Button>
        </Link>
        <Link to="/map-editor">
          <Button variant="outline" className="border-stone-700 text-stone-400 text-xs uppercase tracking-wider">
            Map Editor
          </Button>
        </Link>
      </section>
    </div>
  );
}