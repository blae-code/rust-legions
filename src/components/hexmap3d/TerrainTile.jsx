import React, { useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { TERRAIN_3D, NEUTRAL_3D, SEA_COLOR, FOG_COLOR, BRASS, RES_COLOR_3D } from "@/lib/terrain3d";
import { TERRAIN_RESOURCE } from "@/lib/units";
import TileDecor from "./TileDecor";
import TileLabels from "./TileLabels";

const R = 0.96;

export default function TerrainTile({ tile, ownerColor, selected, overlay, onClick, position }) {
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef();
  const hidden = tile.visible === false;
  const info = hidden ? { color: FOG_COLOR, h: 0.08 } : tile.isSea ? { color: SEA_COLOR, h: 0.05 } : TERRAIN_3D[tile.terrain] || NEUTRAL_3D;

  const color = useMemo(() => {
    const base = new THREE.Color(info.color);
    if (hidden) return base;
    if (overlay === "control" && !tile.isSea) {
      return ownerColor ? new THREE.Color(ownerColor).lerp(base, 0.3) : new THREE.Color("#3B342D");
    }
    if (overlay === "production" && !tile.isSea) {
      if ((tile.baseIncome || 0) > 0) {
        const rc = new THREE.Color(RES_COLOR_3D[TERRAIN_RESOURCE[tile.terrain] || "manpower"]);
        return base.clone().lerp(rc, Math.min(0.35 + tile.baseIncome * 0.15, 0.8));
      }
      return base.clone().multiplyScalar(0.4);
    }
    if (ownerColor) return base.clone().lerp(new THREE.Color(ownerColor), 0.3);
    return base;
  }, [info.color, hidden, overlay, ownerColor, tile.isSea, tile.baseIncome, tile.terrain]);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 3.5) * 0.045;
      ringRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        position={[0, info.h / 2, 0]}
        onClick={(e) => { e.stopPropagation(); onClick && onClick(tile); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
      >
        <cylinderGeometry args={[R, R, info.h, 6]} />
        <meshStandardMaterial
          color={color}
          roughness={tile.isSea && !hidden ? 0.25 : 0.85}
          metalness={tile.isSea && !hidden ? 0.2 : 0.05}
          emissive={hovered && !hidden ? BRASS : "#000000"}
          emissiveIntensity={hovered ? 0.12 : 0}
        />
      </mesh>

      {/* Ownership ring */}
      {!hidden && ownerColor && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, info.h + 0.012, 0]}>
          <ringGeometry args={[R * 0.8, R * 0.9, 6, 1, Math.PI / 2]} />
          <meshBasicMaterial color={ownerColor} transparent opacity={0.95} />
        </mesh>
      )}

      {/* Capital dashed brass ring */}
      {!hidden && tile.isCapital && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, info.h + 0.02, 0]}>
          <ringGeometry args={[R * 0.62, R * 0.68, 6, 1, Math.PI / 2]} />
          <meshBasicMaterial color={BRASS} transparent opacity={0.85} />
        </mesh>
      )}

      {/* Selection ring — pulsing brass */}
      {selected && (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, info.h + 0.03, 0]}>
          <ringGeometry args={[R * 0.9, R * 1.0, 6, 1, Math.PI / 2]} />
          <meshBasicMaterial color={BRASS} transparent opacity={0.95} />
        </mesh>
      )}

      {!hidden && <TileDecor tile={tile} height={info.h} />}
      {!hidden && <TileLabels tile={tile} height={info.h} />}
    </group>
  );
}