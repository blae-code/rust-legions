import React, { useMemo, useRef } from "react";
import { Line, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { arcPoints } from "@/components/starmap/arcMath";
import { latLonToXYZ } from "@/lib/macro/planets";

// A slowly-rotating wireframe target-lock hovering over a high-value objective
function ObjectiveReticle({ size }) {
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.6; });
  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[size, 0]} />
      <meshBasicMaterial color="#C2503C" wireframe transparent opacity={0.7} />
    </mesh>
  );
}

// Intel overlay on the globe: brass supply arteries (the routes optimal marches
// funnel through) and signal-red objective reticles on high-value nodes. Rendered
// inside the spinning planet group so it tracks the surface. Toggled off by default.
export default function TacticalLayer({ planet, overlay }) {
  const byId = useMemo(() => Object.fromEntries(planet.nodes.map((n) => [n.id, n])), [planet]);

  // Arteries lifted higher than the base route arcs so they read as an overlay
  const arteries = useMemo(
    () =>
      [...overlay.arteries]
        .map((key) => {
          const [a, b] = key.split("|");
          if (!byId[a] || !byId[b]) return null;
          return { key, points: arcPoints(byId[a], byId[b], planet.radius, 0.09) };
        })
        .filter(Boolean),
    [overlay, byId, planet.radius]
  );

  const reticleSize = planet.radius * 0.05;

  return (
    <group>
      {arteries.map((art) => (
        <React.Fragment key={art.key}>
          <Line points={art.points} color="#C9A227" lineWidth={4} transparent opacity={0.16} />
          <Line points={art.points} color="#E8C15A" lineWidth={1.4} transparent opacity={0.8} dashed dashSize={0.14} gapSize={0.09} />
        </React.Fragment>
      ))}

      {overlay.targets.map((t) => {
        const n = byId[t.id];
        if (!n) return null;
        const pos = latLonToXYZ(n.lat, n.lon, planet.radius * 1.045);
        return (
          <group key={t.id} position={pos}>
            <ObjectiveReticle size={reticleSize} />
            <Html position={[0, reticleSize * 2.6, 0]} center occlude="blending" style={{ pointerEvents: "none" }}>
              <div className="whitespace-nowrap font-mono text-center leading-tight">
                <div className="text-[9px] text-rust font-semibold tracking-widest">OBJ {t.priority}</div>
                <div className="text-[8px] text-rust/80 tracking-wider">{t.tag}</div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
