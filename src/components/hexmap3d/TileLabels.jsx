import React from "react";
import { Text } from "@react-three/drei";
import { totalUnits, TERRAIN_RESOURCE } from "@/lib/units";
import { BRASS, RES_COLOR_3D, RES_SHORT_3D, BONUS_LABEL } from "@/lib/terrain3d";

// Flat stenciled war-map labels painted onto the terrain top
export default function TileLabels({ tile, height }) {
  const units = totalUnits(tile.state?.units);
  const res = TERRAIN_RESOURCE[tile.terrain] || "manpower";
  const y = height + 0.015;
  return (
    <group>
      <Text
        position={[0, y, -0.38]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.21}
        letterSpacing={0.08}
        color={tile.isSea ? "#7A93A5" : "#EDE6D6"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.012}
        outlineColor="#0c0a09"
      >
        {(tile.isCapital ? "★ " : "") + (tile.name || "").slice(0, 10).toUpperCase()}
      </Text>
      {tile.resourceBonus && (
        <Text position={[0, y, -0.1]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.14} letterSpacing={0.15} color={BRASS} anchorX="center" outlineWidth={0.008} outlineColor="#0c0a09">
          {BONUS_LABEL[tile.resourceBonus] || ""}
        </Text>
      )}
      {units > 0 && (
        <group position={[0, y, 0.32]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]}>
            <planeGeometry args={[0.42, 0.28]} />
            <meshBasicMaterial color="#0c0a09" transparent opacity={0.8} />
          </mesh>
          <Text rotation={[-Math.PI / 2, 0, 0]} fontSize={0.2} color={BRASS} anchorX="center" anchorY="middle" fontWeight="bold">
            {String(units)}
          </Text>
        </group>
      )}
      {!tile.isSea && units === 0 && (tile.baseIncome || 0) > 0 && (
        <Text position={[0, y, 0.28]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.15} color={RES_COLOR_3D[res]} anchorX="center" outlineWidth={0.008} outlineColor="#0c0a09">
          {`+${tile.baseIncome}${RES_SHORT_3D[res]}`}
        </Text>
      )}
    </group>
  );
}