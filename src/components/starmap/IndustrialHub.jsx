import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

// Rusted industrial works crowning city/depot settlements — bunker, stack, furnace glow
export default function IndustrialHub({ s }) {
  const glow = useRef();
  useFrame(({ clock }) => {
    if (glow.current) glow.current.material.opacity = 0.5 + Math.sin(clock.elapsedTime * 6.5) * 0.25 + Math.sin(clock.elapsedTime * 17) * 0.08;
  });
  return (
    <group>
      {/* Bunker hall */}
      <mesh position={[0, s * 0.45, 0]}>
        <boxGeometry args={[s * 1.8, s * 0.9, s * 1.2]} />
        <meshStandardMaterial color="#4a3a2c" roughness={0.9} metalness={0.35} />
      </mesh>
      {/* Rusted smokestack */}
      <mesh position={[s * 0.5, s * 1.5, 0]}>
        <cylinderGeometry args={[s * 0.2, s * 0.3, s * 2.1, 6]} />
        <meshStandardMaterial color="#6e4632" roughness={0.85} metalness={0.4} />
      </mesh>
      {/* Gantry arm */}
      <mesh position={[-s * 0.7, s * 1.05, 0]} rotation-z={0.35}>
        <boxGeometry args={[s * 0.14, s * 1.3, s * 0.14]} />
        <meshStandardMaterial color="#5a4a38" roughness={0.8} metalness={0.5} />
      </mesh>
      {/* Flickering furnace mouth */}
      <mesh ref={glow} position={[-s * 0.35, s * 0.42, s * 0.62]}>
        <planeGeometry args={[s * 0.65, s * 0.32]} />
        <meshBasicMaterial color="#E8913C" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}