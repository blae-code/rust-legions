import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import PlanetBody from "@/components/starmap/PlanetBody";
import RouteArcs from "@/components/starmap/RouteArcs";
import NodeMarker from "@/components/starmap/NodeMarker";

// A whole world: rotating surface + its full node network + route arcs
export default function PlanetSystem({ planet, position, selected, onSelect, hoveredId, onHoverNode }) {
  const spinner = useRef();
  useFrame((_, dt) => { if (spinner.current) spinner.current.rotation.y += dt * planet.spin; });
  return (
    <group position={position}>
      <group ref={spinner}>
        <PlanetBody planet={planet} onClick={(e) => { e.stopPropagation(); onSelect(planet.id); }} />
        <RouteArcs planet={planet} />
        {planet.nodes.map((n) => (
          <NodeMarker
            key={n.id}
            node={n}
            planet={planet}
            hovered={hoveredId === n.id}
            onHover={(node) => onHoverNode(node ? { ...node, planetName: planet.name } : null)}
          />
        ))}
      </group>
      {selected && (
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={[planet.radius * 1.32, planet.radius * 1.36, 64]} />
          <meshBasicMaterial color="#C9A227" transparent opacity={0.45} side={THREE.DoubleSide} />
        </mesh>
      )}
      <Html position={[0, planet.radius * 1.55, 0]} center style={{ pointerEvents: "none" }}>
        <div className={`font-mono text-[10px] tracking-[0.35em] whitespace-nowrap ${selected ? "text-brass-bright" : "text-muted-foreground"}`}>
          ◈ {planet.name.toUpperCase()}
        </div>
      </Html>
    </group>
  );
}