import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { BRASS } from "@/lib/terrain3d";

// Total War-style animated standard — waving banner on a pole
export default function ArmyFlag3D({ army, position, color, selected, onClick, phase = 0 }) {
  const flagRef = useRef();
  const groupRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(t * 3 + phase) * 0.35;
      flagRef.current.scale.x = 1 + Math.sin(t * 6 + phase) * 0.08;
    }
    if (groupRef.current) groupRef.current.rotation.z = Math.sin(t * 2 + phase) * 0.02;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick && onClick(army); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "auto"; }}
    >
      {/* Pole */}
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.9, 6]} />
        <meshStandardMaterial color="#2A241E" roughness={0.8} />
      </mesh>
      {/* Finial */}
      <mesh position={[0, 0.92, 0]}>
        <sphereGeometry args={[0.035, 8, 6]} />
        <meshStandardMaterial color={BRASS} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Waving banner */}
      <group ref={flagRef} position={[0.02, 0.78, 0]}>
        <mesh castShadow position={[0.19, 0, 0]}>
          <planeGeometry args={[0.38, 0.24, 6, 2]} />
          <meshStandardMaterial
            color={color}
            side={2}
            roughness={0.75}
            emissive={selected ? BRASS : color}
            emissiveIntensity={selected ? 0.35 : 0.12}
          />
        </mesh>
      </group>
      {/* Selection halo at base */}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <ringGeometry args={[0.16, 0.22, 16]} />
          <meshBasicMaterial color={BRASS} transparent opacity={0.9} />
        </mesh>
      )}
      {/* Strength plate — always faces the camera */}
      <Billboard position={[0, 0.28, 0]}>
        <mesh position={[0, 0, -0.005]}>
          <planeGeometry args={[0.36, 0.19]} />
          <meshBasicMaterial color="#0c0a09" transparent opacity={0.88} />
        </mesh>
        <Text fontSize={0.13} color={BRASS} anchorX="center" anchorY="middle">
          {String(army.strength)}
        </Text>
      </Billboard>
    </group>
  );
}