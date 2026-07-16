import React from "react";
import { BRASS } from "@/lib/terrain3d";

// Terrain set dressing + built structures — small low-poly props on top of each tile
export default function TileDecor({ tile, height }) {
  const buildings = (tile.state?.buildings || []);
  return (
    <group position={[0, height, 0]}>
      {tile.terrain === "forest" && [[-0.35, -0.2], [0.3, -0.35], [0.45, 0.3]].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.13, z]}>
          <coneGeometry args={[0.09, 0.26, 6]} />
          <meshStandardMaterial color="#2E3D28" roughness={0.9} />
        </mesh>
      ))}
      {tile.terrain === "mountains" && (
        <mesh castShadow position={[0.25, 0.16, -0.3]}>
          <coneGeometry args={[0.26, 0.4, 5]} />
          <meshStandardMaterial color="#6A6570" roughness={0.95} flatShading />
        </mesh>
      )}
      {tile.terrain === "hills" && (
        <mesh castShadow position={[-0.3, 0.06, 0.25]}>
          <sphereGeometry args={[0.18, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#7A6244" roughness={0.95} flatShading />
        </mesh>
      )}
      {tile.terrain === "industrial" && (
        <group position={[0.3, 0, 0.3]}>
          <mesh castShadow position={[0, 0.06, 0]}>
            <boxGeometry args={[0.22, 0.12, 0.16]} />
            <meshStandardMaterial color="#4A3E34" roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0.07, 0.2, 0]}>
            <cylinderGeometry args={[0.025, 0.03, 0.18, 6]} />
            <meshStandardMaterial color="#3A312A" roughness={0.9} />
          </mesh>
        </group>
      )}
      {buildings.map((b, i) => (
        <mesh key={`b${i}`} castShadow position={[-0.28 + i * 0.22, 0.045, 0.52]}>
          <boxGeometry args={[0.13, 0.09, 0.13]} />
          <meshStandardMaterial
            color={(b.level || 0) > 0 ? BRASS : "#6B5B3A"}
            emissive={(b.level || 0) > 0 ? BRASS : "#000000"}
            emissiveIntensity={0.25}
            roughness={0.5}
            metalness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}