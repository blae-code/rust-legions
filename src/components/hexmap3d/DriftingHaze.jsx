import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// Slow battlefield haze drifting above the war table
export default function DriftingHaze({ center = [0, 0], extent = 10 }) {
  const refs = [useRef(), useRef(), useRef()];

  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    g.addColorStop(0, "rgba(140,122,90,0.5)");
    g.addColorStop(1, "rgba(140,122,90,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.forEach((r, i) => {
      if (!r.current) return;
      r.current.position.x = center[0] + Math.sin(t * 0.05 + i * 2.1) * extent * 0.4;
      r.current.position.z = center[1] + Math.cos(t * 0.04 + i * 1.7) * extent * 0.3;
    });
  });

  return (
    <group>
      {refs.map((r, i) => (
        <mesh key={i} ref={r} rotation={[-Math.PI / 2, 0, i]} position={[center[0], 1.6 + i * 0.35, center[1]]}>
          <planeGeometry args={[extent * 0.9, extent * 0.9]} />
          <meshBasicMaterial map={texture} transparent opacity={0.1} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}