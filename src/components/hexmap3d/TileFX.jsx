import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

const DUR = 1.4;

// One-shot artillery impact — flash, shockwave ring, rising smoke, fading fire light
export default function TileFX({ position }) {
  const start = useRef(null);
  const group = useRef();
  const flash = useRef();
  const ring = useRef();
  const light = useRef();
  const smoke = [useRef(), useRef(), useRef()];

  useFrame(({ clock }) => {
    if (start.current === null) start.current = clock.elapsedTime;
    const t = clock.elapsedTime - start.current;
    if (t > DUR) { if (group.current) group.current.visible = false; return; }
    const p = t / DUR;
    if (flash.current) {
      const fp = Math.min(t / 0.35, 1);
      flash.current.scale.setScalar(0.2 + fp * 1.0);
      flash.current.material.opacity = 1 - fp;
    }
    if (ring.current) {
      ring.current.scale.setScalar(0.3 + p * 2.4);
      ring.current.material.opacity = Math.max(0.7 * (1 - p), 0);
    }
    if (light.current) light.current.intensity = Math.max(2.5 * (1 - p * 1.4), 0);
    smoke.forEach((s, i) => {
      if (!s.current) return;
      s.current.position.y = 0.15 + p * (0.7 + i * 0.25);
      s.current.scale.setScalar(0.2 + p * (0.6 + i * 0.2));
      s.current.material.opacity = Math.max(0.5 * (1 - p), 0);
    });
  });

  return (
    <group ref={group} position={position}>
      <mesh ref={flash}>
        <sphereGeometry args={[0.3, 12, 10]} />
        <meshBasicMaterial color="#FFB347" transparent />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.5, 0.6, 24]} />
        <meshBasicMaterial color="#E0A32E" transparent />
      </mesh>
      {smoke.map((r, i) => (
        <mesh key={i} ref={r} position={[(i - 1) * 0.18, 0.15, (i % 2) * 0.15]}>
          <sphereGeometry args={[0.22, 8, 6]} />
          <meshStandardMaterial color="#2B2620" transparent opacity={0.5} />
        </mesh>
      ))}
      <pointLight ref={light} color="#FF9A3C" intensity={2.5} distance={5} decay={2} />
    </group>
  );
}