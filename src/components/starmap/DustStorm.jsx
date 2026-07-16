import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32 } from "@/lib/macro/planets";

// Swirling dust/ash/fog front that scours the planet faster than the cloud veil
function makeStormTexture(planet) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 256;
  const g = c.getContext("2d");
  const rand = mulberry32(planet.seed + 31);
  const color = planet.palette.storm?.color || "#9a8a72";
  // Long wind-torn streamers, densest in the mid-latitudes
  for (let i = 0; i < 90; i++) {
    const y = 30 + rand() * 196;
    const x = rand() * 512;
    const len = 60 + rand() * 200;
    g.globalAlpha = 0.05 + rand() * 0.12;
    g.strokeStyle = color;
    g.lineWidth = 2 + rand() * 9;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + len * 0.5, y + (rand() - 0.5) * 26, x + len, y + (rand() - 0.5) * 14);
    g.stroke();
  }
  // Dense storm cells — churning fronts
  for (let i = 0; i < 22; i++) {
    g.globalAlpha = 0.08 + rand() * 0.1;
    g.fillStyle = color;
    g.beginPath();
    g.ellipse(rand() * 512, 50 + rand() * 156, 30 + rand() * 70, 8 + rand() * 20, rand() * 0.5 - 0.25, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

export default function DustStorm({ planet }) {
  const map = useMemo(() => makeStormTexture(planet), [planet]);
  const ref = useRef();
  const speed = planet.palette.storm?.speed ?? 0.05;
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * speed; });
  if (!planet.palette.storm) return null;
  return (
    <mesh ref={ref} scale={1.032}>
      <sphereGeometry args={[planet.radius, 48, 48]} />
      <meshStandardMaterial map={map} transparent opacity={planet.palette.storm.opacity} depthWrite={false} />
    </mesh>
  );
}