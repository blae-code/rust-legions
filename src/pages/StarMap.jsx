import React, { useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { PLANETS } from "@/lib/macro/planets";
import { NODE_KINDS } from "@/lib/macro/graph";
import { findPath, planMarch } from "@/lib/macro/march";
import PlanetSystem from "@/components/starmap/PlanetSystem";

// A standard mixed column — crawlers set the pace at 16 miles a day
const DAY_RATE = 16;

const POSITIONS = [[-15, 1, -2], [0, -1, 0], [15, 2, -3]];

// Glides the orbit target over to the selected world
function Rig({ controlsRef, focus }) {
  useFrame(() => {
    const c = controlsRef.current;
    if (!c) return;
    c.target.lerp(focus, 0.06);
    c.update();
  });
  return null;
}

const LEGEND = [["highway", "#C9A227"], ["road", "#9a927f"], ["track", "#6e675c"], ["trail", "#5a5348"]];

// The Star Chart — three detailed worlds carrying the node-and-route system.
export default function StarMap() {
  const [selectedId, setSelectedId] = useState(PLANETS[0].id);
  const [hovered, setHovered] = useState(null);
  const [march, setMarch] = useState({ planetId: null, origin: null, dest: null });
  const controls = useRef();
  const idx = PLANETS.findIndex((p) => p.id === selectedId);
  const selected = PLANETS[idx];
  const focus = useMemo(() => new THREE.Vector3(...POSITIONS[idx]), [idx]);

  const marchPlanet = PLANETS.find((p) => p.id === march.planetId);
  const plan = useMemo(() => {
    if (!marchPlanet || !march.origin || !march.dest) return null;
    const found = findPath(march.origin, march.dest, DAY_RATE, marchPlanet.routes);
    return found ? planMarch(found.path, DAY_RATE, marchPlanet.routes) : null;
  }, [march, marchPlanet]);

  // Two clicks plot a march: first sets the origin, second the objective
  const onNodeClick = (planet, node) => {
    setSelectedId(planet.id);
    setMarch((m) => {
      if (m.planetId === planet.id && m.origin === node.id) return { planetId: null, origin: null, dest: null };
      if (m.planetId !== planet.id || !m.origin || m.dest) return { planetId: planet.id, origin: node.id, dest: null };
      return { ...m, dest: node.id };
    });
  };
  const nodeName = (id) => marchPlanet?.nodes.find((n) => n.id === id)?.name || "";

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-muted-foreground hover:text-brass-bright transition-colors">
          <ArrowLeft className="w-3 h-3" /> COMMAND DECK
        </Link>
        <div className="mt-2 mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="cq-label text-rust">Astrocartography Directorate</p>
            <h1 className="cq-display text-3xl">The Star Chart</h1>
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest mt-1">
              THREE WORLDS · {PLANETS.reduce((s, p) => s + p.nodes.length, 0)} CHARTED SETTLEMENTS · CLICK TWO SETTLEMENTS TO PLOT A MARCH
            </p>
          </div>
          <div className="flex gap-1.5">
            {PLANETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`cq-metal font-heading uppercase tracking-widest text-[10px] px-3 py-1.5 rounded-sm border transition-colors ${
                  p.id === selectedId ? "border-brass/70 text-brass-bright" : "border-border text-muted-foreground hover:text-brass-bright"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="cq-panel cq-brackets relative overflow-hidden p-1">
          <div className="cq-hazard absolute top-0 left-0 right-0 z-10" />
          <div className="h-[68vh] min-h-[420px] rounded">
            <Canvas camera={{ position: [-15, 5, 13], fov: 50 }} dpr={[1, 2]}>
              <color attach="background" args={["#07090c"]} />
              <ambientLight intensity={0.35} />
              <directionalLight position={[25, 14, 10]} intensity={1.5} color="#f5e2c0" />
              <Stars radius={140} depth={60} count={4000} factor={3} fade speed={0.4} />
              {PLANETS.map((p, i) => (
                <PlanetSystem
                  key={p.id}
                  planet={p}
                  position={POSITIONS[i]}
                  selected={p.id === selectedId}
                  onSelect={setSelectedId}
                  hoveredId={hovered?.id || null}
                  onHoverNode={setHovered}
                  origin={march.planetId === p.id ? march.origin : null}
                  dest={march.planetId === p.id ? march.dest : null}
                  plan={march.planetId === p.id ? plan : null}
                  onNodeClick={onNodeClick}
                />
              ))}
              <Rig controlsRef={controls} focus={focus} />
              <OrbitControls ref={controls} enablePan={false} minDistance={5} maxDistance={45} />
            </Canvas>
          </div>

          {/* Selected world readout */}
          <div className="absolute bottom-3 left-3 z-10 max-w-xs cq-panel p-3 bg-card/90">
            <p className="cq-label text-brass">{selected.name}</p>
            <p className="text-[11px] text-secondary-foreground leading-snug mt-0.5">{selected.blurb}</p>
            <p className="font-mono text-[9px] text-muted-foreground mt-1.5">
              {selected.nodes.length} SETTLEMENTS · {selected.routes.length} SUPPLY ROUTES
            </p>
            {hovered && (
              <p className="font-mono text-[9px] text-brass-bright mt-1 border-t border-border pt-1">
                ▸ {hovered.name.toUpperCase()} — {(NODE_KINDS[hovered.kind]?.label || hovered.kind).toUpperCase()} · {hovered.planetName?.toUpperCase()}
              </p>
            )}
            {march.origin && !march.dest && (
              <p className="font-mono text-[9px] text-brass mt-1 border-t border-border pt-1">
                ▸ COLUMN STAGED AT {nodeName(march.origin).toUpperCase()} — CLICK AN OBJECTIVE
              </p>
            )}
            {plan && (
              <div className="font-mono text-[9px] mt-1 border-t border-border pt-1 space-y-0.5">
                <p className="text-brass-bright">
                  ▸ {nodeName(march.origin).toUpperCase()} → {nodeName(march.dest).toUpperCase()} · {plan.legs.length} LEG{plan.legs.length > 1 ? "S" : ""} · ARRIVES DAY {plan.arrivalDay}
                </p>
                <p className="text-muted-foreground">STANDARD COLUMN · {DAY_RATE} MI/DAY · {plan.legs.reduce((s, l) => s + l.miles, 0)} MILES</p>
                <button
                  onClick={() => setMarch({ planetId: null, origin: null, dest: null })}
                  className="text-rust hover:text-brass-bright transition-colors uppercase tracking-widest"
                >
                  ✕ Clear plot
                </button>
              </div>
            )}
            {march.origin && march.dest && !plan && (
              <p className="font-mono text-[9px] text-rust mt-1 border-t border-border pt-1">▸ NO OVERLAND ROUTE REACHES THAT OBJECTIVE</p>
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

        <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-2">
          CINDARA CARRIES THE ORIGINAL ABANDONED CONTINENT — PLOT MARCHES IN THE <Link to="/macro-lab" className="text-brass hover:text-brass-bright">MACRO MARCH LAB</Link>
        </p>
      </div>
    </div>
  );
}