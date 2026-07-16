import React from "react";
import { Html } from "@react-three/drei";
import { latLonToXYZ } from "@/lib/macro/planets";
import { NODE_KINDS } from "@/lib/macro/graph";

const KIND_COLORS = { city: "#C9A227", town: "#b3ab9c", depot: "#B5722F", crossroads: "#8a8378", ruin: "#a65240" };
const KIND_SIZE = { city: 1.6, town: 1.1, depot: 1.2, crossroads: 0.85, ruin: 1.0 };

// One settlement pinned to the planet surface — glows and labels itself on hover
export default function NodeMarker({ node, planet, hovered, onHover }) {
  const pos = latLonToXYZ(node.lat, node.lon, planet.radius * 1.012);
  const s = planet.radius * 0.022 * (KIND_SIZE[node.kind] || 1);
  return (
    <group position={pos}>
      <mesh
        scale={hovered ? 1.9 : 1}
        onPointerOver={(e) => { e.stopPropagation(); onHover(node); }}
        onPointerOut={() => onHover(null)}
      >
        <sphereGeometry args={[s, 10, 10]} />
        <meshBasicMaterial color={hovered ? "#E8C15A" : KIND_COLORS[node.kind] || "#999"} />
      </mesh>
      {hovered && (
        <Html position={[0, s * 4, 0]} center style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap font-mono text-[10px] px-1.5 py-0.5 bg-black/85 border border-brass/50 text-brass-bright rounded-sm">
            {node.name.toUpperCase()}
            <span className="text-muted-foreground"> · {(NODE_KINDS[node.kind]?.label || node.kind).toUpperCase()}</span>
          </div>
        </Html>
      )}
    </group>
  );
}