import React, { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Flag, Crosshair, Anchor, Ban, RotateCcw } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import { PLANETS } from "@/lib/macro/planets";
import { NODE_KINDS } from "@/lib/macro/graph";
import { armyDayRate, findPath, planMarch } from "@/lib/macro/march";
import { computeTacticalOverlay } from "@/lib/macro/overlay";
import PlanetSystem from "@/components/starmap/PlanetSystem";
import MarchPlanner from "@/components/macro/MarchPlanner";
import SceneErrorBoundary from "@/components/SceneErrorBoundary";

const LEGEND = [["highway", "#C9A227"], ["road", "#9a927f"], ["track", "#6e675c"], ["trail", "#5a5348"]];

// The canonical macro map — one campaign world, orbited, with its full node-and-route
// network as a brass industrial overlay above the crust. The world is picked at
// operation setup (PlanetPicker) and arrives here as ?planet=; marches are day-rate
// plotted by the slowest ground element of the staged column. See docs/MACRO_MAP.md.
export default function StarMap() {
  const [params] = useSearchParams();
  const planet = PLANETS.find((p) => p.id === params.get("planet")) || PLANETS[0];
  return <WarTable key={planet.id} planet={planet} />;
}

function WarTable({ planet }) {
  const [regiments, setRegiments] = useState({ riflemen: 2, crawler: 1, artillery: 0, fighter: 0 });
  const [hovered, setHovered] = useState(null);
  const [march, setMarch] = useState({ origin: null, dest: null });
  const [menu, setMenu] = useState(null); // node id with an open orders menu
  const [base, setBase] = useState(null); // node id — anchored fortress-base
  const [showOverlay, setShowOverlay] = useState(false); // tactical intel layer

  // Only pay the all-pairs betweenness when the intel layer is actually shown
  const overlay = useMemo(
    () => (showOverlay ? computeTacticalOverlay(planet.nodes, planet.routes) : null),
    [planet, showOverlay]
  );
  const dayRate = armyDayRate(regiments);
  const plan = useMemo(() => {
    if (!march.origin || !march.dest || !dayRate) return null;
    const found = findPath(march.origin, march.dest, dayRate, planet.routes);
    return found ? planMarch(found.path, dayRate, planet.routes) : null;
  }, [march, dayRate, planet]);

  const onNodeClick = (_p, node) => setMenu((m) => (m === node.id ? null : node.id));
  const closeMenu = () => setMenu(null);
  const clearMarch = () => setMarch({ origin: null, dest: null });
  const nodeName = (id) => planet.nodes.find((n) => n.id === id)?.name || "";

  // Smart flow — only orders that are actually eligible for the column & base appear
  const menuOptionsFor = (_p, node) => {
    const done = (fn) => () => { fn(); closeMenu(); };
    const opts = [];
    const stagedHere = march.origin === node.id;
    const marching = march.origin && !march.dest;
    if (marching && !stagedHere) {
      opts.push({ key: "objective", label: "March Here", icon: Crosshair, act: done(() => setMarch((m) => ({ ...m, dest: node.id }))) });
      opts.push({ key: "restage", label: "Restage Column", icon: RotateCcw, act: done(() => setMarch({ origin: node.id, dest: null })) });
    } else if (stagedHere && !march.dest) {
      opts.push({ key: "standdown", label: "Stand Down", icon: Ban, tone: "rust", act: done(clearMarch) });
    } else {
      opts.push({ key: "stage", label: "Stage Column", icon: Flag, act: done(() => setMarch({ origin: node.id, dest: null })) });
    }
    if (march.dest) {
      opts.push({ key: "clearplot", label: "Clear Plot", icon: Ban, tone: "rust", act: done(clearMarch) });
    }
    if (base === node.id) opts.push({ key: "weigh", label: "Weigh Anchor", icon: Anchor, tone: "rust", act: done(() => setBase(null)) });
    else opts.push({ key: "anchor", label: "Anchor Base", icon: Anchor, act: done(() => setBase(node.id)) });
    return opts;
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-muted-foreground hover:text-brass-bright transition-colors">
          <ArrowLeft className="w-3 h-3" /> COMMAND DECK
        </Link>
        <div className="mt-2 mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="cq-label text-rust">Astrocartography Directorate</p>
            <h1 className="cq-display text-3xl">The War Table</h1>
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest mt-1">
              THEATER: {planet.name.toUpperCase()} · {planet.nodes.length} SETTLEMENTS · 1 TURN = 1 DAY · CLICK A SETTLEMENT FOR ORDERS
            </p>
          </div>
          <button
            onClick={() => setShowOverlay((v) => !v)}
            className={`cq-metal inline-flex items-center gap-1.5 font-heading uppercase tracking-widest text-[10px] px-3 py-1.5 rounded-sm border transition-colors ${
              showOverlay ? "border-rust/70 text-rust" : "border-border text-muted-foreground hover:text-brass-bright"
            }`}
          >
            <Crosshair className="w-3 h-3" /> Tactical Overlay {showOverlay ? "ON" : "OFF"}
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-4">
          <div className="cq-panel cq-brackets relative overflow-hidden p-1">
            <div className="cq-hazard absolute top-0 left-0 right-0 z-10" />
            <div className="h-[68vh] min-h-[440px] rounded">
              <SceneErrorBoundary>
              <Canvas camera={{ position: [0, 4, 14], fov: 50 }} dpr={[1, 2]}>
                <color attach="background" args={["#07090c"]} />
                <ambientLight intensity={0.4} />
                <directionalLight position={[25, 14, 10]} intensity={1.25} color="#f5e2c0" />
                <Stars radius={140} depth={60} count={4000} factor={3} fade speed={0.4} />
                <PlanetSystem
                  planet={planet}
                  position={[0, 0, 0]}
                  selected
                  onSelect={closeMenu}
                  hoveredId={hovered?.id || null}
                  onHoverNode={setHovered}
                  origin={march.origin}
                  dest={march.dest}
                  plan={plan}
                  onNodeClick={onNodeClick}
                  menuNodeId={menu}
                  menuOptionsFor={menuOptionsFor}
                  onCloseMenu={closeMenu}
                  baseNodeId={base}
                  overlay={overlay}
                />
                <OrbitControls enablePan={false} minDistance={5} maxDistance={45} />
              </Canvas>
              </SceneErrorBoundary>
            </div>

            {/* Selected world readout */}
            <div className="absolute bottom-3 left-3 z-10 max-w-xs cq-panel p-3 bg-card/90">
              <p className="cq-label text-brass">{planet.name}</p>
              <p className="text-[11px] text-secondary-foreground leading-snug mt-0.5">{planet.blurb}</p>
              <p className="font-mono text-[9px] text-muted-foreground mt-1.5">
                {planet.nodes.length} SETTLEMENTS · {planet.routes.length} SUPPLY ROUTES
              </p>
              {hovered && (
                <p className="font-mono text-[9px] text-brass-bright mt-1 border-t border-border pt-1">
                  ▸ {hovered.name.toUpperCase()} — {(NODE_KINDS[hovered.kind]?.label || hovered.kind).toUpperCase()}
                </p>
              )}
              {march.origin && !march.dest && (
                <p className="font-mono text-[9px] text-brass mt-1 border-t border-border pt-1">
                  ▸ COLUMN STAGED AT {nodeName(march.origin).toUpperCase()} — CLICK AN OBJECTIVE FOR ORDERS
                </p>
              )}
              {base && (
                <p className="font-mono text-[9px] text-brass mt-1 border-t border-border pt-1">
                  ⌂ FORTRESS-BASE ANCHORED AT {nodeName(base).toUpperCase()}
                </p>
              )}
              {plan && (
                <p className="font-mono text-[9px] text-brass-bright mt-1 border-t border-border pt-1">
                  ▸ {nodeName(march.origin).toUpperCase()} → {nodeName(march.dest).toUpperCase()} · ARRIVES DAY {plan.arrivalDay}
                </p>
              )}
              {march.origin && march.dest && !plan && (
                <p className="font-mono text-[9px] text-rust mt-1 border-t border-border pt-1">
                  ▸ {dayRate ? "NO OVERLAND ROUTE REACHES THAT OBJECTIVE" : "NO GROUND ELEMENTS — FIELD A COLUMN FIRST"}
                </p>
              )}
            </div>

            {/* Route quality legend */}
            <div className="absolute bottom-3 right-3 z-10 cq-panel p-2.5 bg-card/90">
              {LEGEND.map(([q, c]) => (
                <div key={q} className="flex items-center gap-2 font-mono text-[9px] text-muted-foreground">
                  <span className="inline-block w-5 h-0.5" style={{ background: c }} />
                  {q.toUpperCase()}
                </div>
              ))}
            </div>
          </div>

          <MarchPlanner
            regiments={regiments}
            setRegiments={setRegiments}
            dayRate={dayRate}
            origin={march.origin}
            dest={march.dest}
            plan={plan}
            nodeName={nodeName}
          />
        </div>

        <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-2">
          COMPOSE THE COLUMN AT RIGHT — THE SLOWEST GROUND ELEMENT SETS THE MARCH PACE · THEATER WORLD IS FIXED AT OPERATION SETUP
        </p>
      </div>
    </div>
  );
}
