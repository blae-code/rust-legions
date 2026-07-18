import React, { useState, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Flag, Crosshair, Anchor, Ban, RotateCcw } from "lucide-react";
import { WORLDS } from "@/lib/macro/worlds";
import { armyDayRate, findPath, planMarch } from "@/lib/macro/march";
import { computeTacticalOverlay } from "@/lib/macro/overlay";
import { playSfx } from "@/lib/sfx";
import MinistryChart from "@/components/chart/MinistryChart";
import MarchPlanner from "@/components/macro/MarchPlanner";

// The War Table — the ministry tactical chart as a planning sandbox. The world
// is picked at operation setup and arrives here as ?planet=; marches are
// day-rate plotted by the slowest ground element of the staged column.
// See docs/MACRO_MAP.md.
export default function StarMap() {
  const [params] = useSearchParams();
  const world = WORLDS.find((w) => w.id === params.get("planet")) || WORLDS[0];
  return <WarTable key={world.id} world={world} />;
}

function WarTable({ world }) {
  const [regiments, setRegiments] = useState({ riflemen: 2, crawler: 1, artillery: 0, fighter: 0 });
  const [hovered, setHovered] = useState(null);
  const [march, setMarch] = useState({ origin: null, dest: null });
  const [menu, setMenu] = useState(null);
  const [base, setBase] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const lastHover = useRef(null);

  // Only pay the all-pairs betweenness when the intel layer is actually shown
  const overlay = useMemo(
    () => (showOverlay ? computeTacticalOverlay(world.nodes, world.routes) : null),
    [world, showOverlay]
  );
  const dayRate = armyDayRate(regiments);
  const plan = useMemo(() => {
    if (!march.origin || !march.dest || !dayRate) return null;
    const found = findPath(march.origin, march.dest, dayRate, world.routes);
    return found ? planMarch(found.path, dayRate, world.routes) : null;
  }, [march, dayRate, world]);

  const closeMenu = () => setMenu(null);
  const clearMarch = () => setMarch({ origin: null, dest: null });
  const nodeName = (id) => world.nodes.find((n) => n.id === id)?.name || "";

  const onHoverNode = (n) => {
    if (n && n.id !== lastHover.current) playSfx("hover");
    lastHover.current = n?.id || null;
    setHovered(n);
  };
  const onNodeClick = (node) => { playSfx("select"); setMenu((m) => (m === node.id ? null : node.id)); };

  // Smart flow — only orders that are actually eligible for the column & base appear
  const menuOptionsFor = (node) => {
    const done = (fn, sound = "select") => () => { playSfx(sound); fn(); closeMenu(); };
    const opts = [];
    const stagedHere = march.origin === node.id;
    const marching = march.origin && !march.dest;
    if (marching && !stagedHere) {
      opts.push({ key: "objective", label: "March Here", icon: Crosshair, act: done(() => setMarch((m) => ({ ...m, dest: node.id })), "move") });
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
    else opts.push({ key: "anchor", label: "Anchor Base", icon: Anchor, act: done(() => setBase(node.id), "build") });
    return opts;
  };

  const marchPaths = [
    ...(plan ? [{ id: "plan", path: [march.origin, ...plan.legs.map((l) => l.to)], color: "#E8C15A" }] : []),
    ...(overlay ? [...overlay.arteries].map((k, i) => ({ id: `artery-${i}`, path: k.split("|"), color: "#C2503C", dashed: true })) : []),
  ];
  const control = {};
  if (march.origin) control[march.origin] = 0;
  if (march.dest) control[march.dest] = 1;

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
              THEATER: {world.name.toUpperCase()} · {world.nodes.length} SETTLEMENTS · 1 TURN = 1 DAY · DRAG TO PAN · WHEEL TO ZOOM
            </p>
          </div>
          <button
            onClick={() => { playSfx("select"); setShowOverlay((v) => !v); }}
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
            <MinistryChart
              world={world}
              palette={world.palette}
              control={control}
              slotColors={{ 0: "#C9A227", 1: "#C2503C" }}
              bases={base ? [{ slot: 0, nodeId: base }] : []}
              marchPaths={marchPaths}
              hovered={hovered}
              onHoverNode={onHoverNode}
              onNodeClick={onNodeClick}
              menuNodeId={menu}
              menuOptions={menu ? menuOptionsFor(world.nodes.find((n) => n.id === menu)) : null}
              onCloseMenu={closeMenu}
              height="66vh"
            />
            <div className="cq-scanlines absolute inset-0 pointer-events-none z-[5]" />
            <div className="cq-vignette absolute inset-0 pointer-events-none z-[5]" />

            {/* Readout */}
            <div className="absolute bottom-3 left-3 z-10 max-w-xs cq-panel p-3 bg-card/90">
              <p className="cq-label text-brass">{world.name}</p>
              <p className="text-[11px] text-secondary-foreground leading-snug mt-0.5">{world.blurb}</p>
              <p className="font-mono text-[9px] text-muted-foreground mt-1.5">
                {world.continents.length} LANDMASSES · {world.nodes.length} SETTLEMENTS · {world.routes.length} ROUTES
              </p>
              {march.origin && !march.dest && (
                <p className="font-mono text-[9px] text-brass mt-1 border-t border-border pt-1">
                  ▸ COLUMN STAGED AT {nodeName(march.origin).toUpperCase()} — CLICK AN OBJECTIVE FOR ORDERS
                </p>
              )}
              {plan && (
                <p className="font-mono text-[9px] text-brass-bright mt-1 border-t border-border pt-1">
                  ▸ {nodeName(march.origin).toUpperCase()} → {nodeName(march.dest).toUpperCase()} · ARRIVES DAY {plan.arrivalDay}
                </p>
              )}
              {march.origin && march.dest && !plan && (
                <p className="font-mono text-[9px] text-rust mt-1 border-t border-border pt-1">
                  ▸ {dayRate ? "NO ROUTE REACHES THAT OBJECTIVE" : "NO GROUND ELEMENTS — FIELD A COLUMN FIRST"}
                </p>
              )}
            </div>

            {/* Route quality legend */}
            <div className="absolute bottom-3 right-3 z-10 cq-panel p-2.5 bg-card/90">
              {[["highway", "#C9A227"], ["road", "#9a927f"], ["track", "#6e675c"], ["trail", "#5a5348"], ["convoy lane", "#7A93A5"]].map(([q, c]) => (
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
