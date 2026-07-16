import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Crosshair } from "lucide-react";
import { MACRO_ROUTES } from "@/lib/macro/graph";
import { computeTacticalOverlay } from "@/lib/macro/overlay";
import { armyDayRate, findPath, planMarch } from "@/lib/macro/march";
import MacroGraphMap from "@/components/macro/MacroGraphMap";
import MarchPlanner from "@/components/macro/MarchPlanner";

// Macro March Lab — sandbox for the node-and-route pathfinding layer.
// Compose a column, click origin and destination, and read the day-rate itinerary.
export default function MacroLab() {
  const [regiments, setRegiments] = useState({ riflemen: 2, crawler: 1, artillery: 0, fighter: 0 });
  const [origin, setOrigin] = useState(null);
  const [dest, setDest] = useState(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const overlay = useMemo(() => computeTacticalOverlay(), []);

  const dayRate = armyDayRate(regiments);
  const plan = useMemo(() => {
    if (!origin || !dest || !dayRate) return null;
    const found = findPath(origin, dest, dayRate);
    return found ? planMarch(found.path, dayRate) : null;
  }, [origin, dest, dayRate]);

  const onNodeClick = (id) => {
    if (!origin || (origin && dest) || id === origin) {
      setOrigin(id === origin ? null : id);
      setDest(null);
    } else {
      setDest(id);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-muted-foreground hover:text-brass-bright transition-colors">
          <ArrowLeft className="w-3 h-3" /> COMMAND DECK
        </Link>
        <div className="mt-2 mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="cq-label text-rust">Directorate of Logistics — Experimental</p>
            <h1 className="cq-display text-3xl">Macro March Lab</h1>
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest mt-1">
              NODE-AND-ROUTE GRAPH · 1 TURN = 1 DAY · SLOWEST GROUND ELEMENT SETS THE PACE
            </p>
          </div>
          <Link
            to="/star-map"
            className="cq-metal inline-flex items-center gap-1.5 font-heading uppercase tracking-widest text-[10px] px-3 py-1.5 rounded-sm border border-brass/50 text-brass-bright hover:border-brass transition-colors"
          >
            ◈ The Star Chart
          </Link>
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className={`cq-metal inline-flex items-center gap-1.5 font-heading uppercase tracking-widest text-[10px] px-3 py-1.5 rounded-sm border transition-colors ${
              showOverlay ? "border-rust/70 text-rust" : "border-border text-muted-foreground hover:text-brass-bright"
            }`}
          >
            <Crosshair className="w-3 h-3" />
            Tactical Overlay {showOverlay ? "ON" : "OFF"}
          </button>
        </div>
        <div className="grid lg:grid-cols-[1fr_300px] gap-4">
          <div className="cq-panel cq-brackets p-2 min-h-[420px]">
            <MacroGraphMap routes={MACRO_ROUTES} origin={origin} dest={dest} plan={plan} onNodeClick={onNodeClick}
              overlay={showOverlay ? overlay : null} />
          </div>
          <MarchPlanner regiments={regiments} setRegiments={setRegiments} dayRate={dayRate} origin={origin} dest={dest} plan={plan} />
        </div>
      </div>
    </div>
  );
}