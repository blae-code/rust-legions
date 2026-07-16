import React, { useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { MapControls } from "@react-three/drei";
import { pos3 } from "@/lib/terrain3d";
import TerrainTile from "./TerrainTile";
import ArmyFlag3D from "./ArmyFlag3D";
import DriftingHaze from "./DriftingHaze";

// 3D war-table board — drop-in replacement for the SVG HexBoard in the game view
export default function HexBoard3D({
  tiles = [],
  slotColors = {},
  selectedId,
  onTileClick,
  overlay = null,
  armies = [],
  selectedArmyId,
  onArmyClick,
  height = 560,
}) {
  const { center, extent } = useMemo(() => {
    if (tiles.length === 0) return { center: [0, 0], extent: 10 };
    const pts = tiles.map((t) => pos3(t.q, t.r));
    const minX = Math.min(...pts.map((p) => p[0])), maxX = Math.max(...pts.map((p) => p[0]));
    const minZ = Math.min(...pts.map((p) => p[2])), maxZ = Math.max(...pts.map((p) => p[2]));
    return {
      center: [(minX + maxX) / 2, (minZ + maxZ) / 2],
      extent: Math.max(maxX - minX, maxZ - minZ, 6) + 3,
    };
  }, [tiles]);

  return (
    <div style={{ height }} className="w-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [center[0], extent * 0.85, center[1] + extent * 0.62], fov: 42 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#12100C"]} />
        <fog attach="fog" args={["#12100C", extent * 1.2, extent * 3.2]} />
        <ambientLight intensity={0.55} color="#C9B99A" />
        <directionalLight
          castShadow
          position={[center[0] + extent * 0.5, extent, center[1] + extent * 0.35]}
          intensity={1.35}
          color="#FFD9A0"
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-extent}
          shadow-camera-right={extent}
          shadow-camera-top={extent}
          shadow-camera-bottom={-extent}
        />
        <pointLight position={[center[0] - extent * 0.6, extent * 0.5, center[1] - extent * 0.4]} intensity={0.3} color="#B5722F" />

        {/* Table surface under the map */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center[0], -0.06, center[1]]} receiveShadow>
          <planeGeometry args={[extent * 4, extent * 4]} />
          <meshStandardMaterial color="#0E0C09" roughness={0.95} />
        </mesh>

        <Suspense fallback={null}>
          {tiles.map((tile) => {
            const owner = tile.state?.owner;
            return (
              <TerrainTile
                key={tile.id}
                tile={tile}
                position={pos3(tile.q, tile.r)}
                ownerColor={owner !== null && owner !== undefined ? slotColors[owner] : null}
                selected={selectedId === tile.id}
                overlay={overlay}
                onClick={onTileClick}
              />
            );
          })}
          {armies.map((a, i) => {
            const tile = tiles.find((t) => t.id === a.tileId);
            if (!tile || tile.visible === false) return null;
            const stack = armies.filter((x) => x.tileId === a.tileId);
            const idx = stack.findIndex((x) => x.id === a.id);
            const [x, , z] = pos3(tile.q, tile.r);
            return (
              <ArmyFlag3D
                key={a.id}
                army={a}
                position={[x - 0.35 + idx * 0.35, 0.05, z - 0.15]}
                color={slotColors[a.owner] || "#888"}
                selected={selectedArmyId === a.id}
                onClick={onArmyClick}
                phase={i * 1.3}
              />
            );
          })}
        </Suspense>

        <DriftingHaze center={center} extent={extent} />

        <MapControls
          target={[center[0], 0, center[1]]}
          minDistance={4}
          maxDistance={extent * 1.6}
          minPolarAngle={0.35}
          maxPolarAngle={1.25}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  );
}