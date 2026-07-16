import React from "react";
import { Html } from "@react-three/drei";
import { latLonToXYZ } from "@/lib/macro/planets";
import { NODE_KINDS } from "@/lib/macro/graph";

const KIND_COLORS = { city: "#C9A227", town: "#b3ab9c", depot: "#B5722F", crossroads: "#8a8378", ruin: "#a65240" };
const KIND_SIZE = { city: 1.6, town: 1.1, depot: 1.2, crossroads: 0.85, ruin: 1.0 };

// One settlement pinned to the planet surface — click to plot a march leg
export default function NodeMarker({ node, planet, hovered, isOrigin, isDest, onHover, onClick }) {
  const pos = latLonToXYZ(node.lat, node.lon, planet.radius * 1.012);
  const s = planet.radius * 0.022 * (KIND_SIZE[node.kind] || 1);
  const active = isOrigin || isDest;
  return (
    <group position={pos}>
      <mesh
        scale={hovered || active ? 1.9 : 1}
        onClick={(e) => { e.stopPropagation(); onClick(node); }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(node); }}
        onPointerOut={() => onHover(null)}
      >
        <sphereGeometry args={[s, 10, 10]} />
        <meshBasicMaterial color={isOrigin ? "#E8C15A" : isDest ? "#C2503C" : hovered ? "#E8C15A" : KIND_COLORS[node.kind] || "#999"} />
      </mesh>
      {/* Target designator around plotted endpoints */}
      {active && (
        <mesh scale={3.2}>
          <sphereGeometry args={[s, 12, 12]} />
          <meshBasicMaterial color={isOrigin ? "#E8C15A" : "#C2503C"} wireframe transparent opacity={0.35} />
        </mesh>
      )}
      {(hovered || active) && (
        <Html position={[0, s * 4.5, 0]} center style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap font-mono text-[10px] px-1.5 py-0.5 bg-black/85 border border-brass/50 text-brass-bright rounded-sm">
            {isOrigin && <span className="text-brass">ORIGIN · </span>}
            {isDest && <span className="text-rust">OBJECTIVE · </span>}
            {node.name.toUpperCase()}
            <span className="text-muted-foreground"> · {(NODE_KINDS[node.kind]?.label || node.kind).toUpperCase()}</span>
          </div>
        </Html>
      )}
    </group>
  );
}