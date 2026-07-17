import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32 } from "@/lib/macro/planets";
import DustStorm from "@/components/starmap/DustStorm";

// Procedurally painted planet surface — terrain blotches, craters, ice caps
function makeSurfaceTexture(planet) {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 512;
  const g = c.getContext("2d");
  const rand = mulberry32(planet.seed);
  const p = planet.palette;
  g.fillStyle = p.base;
  g.fillRect(0, 0, 1024, 512);
  // Continental blotches — layered ellipses in highland/lowland tones
  for (let i = 0; i < 420; i++) {
    const w = 20 + rand() * 150, h = 10 + rand() * 60;
    g.globalAlpha = 0.05 + rand() * 0.13;
    g.fillStyle = rand() < 0.5 ? p.high : p.low;
    g.beginPath();
    g.ellipse(rand() * 1024, rand() * 512, w, h, rand() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  // Accent stains — oxide flows, brine seas, ash fields
  for (let i = 0; i < 70; i++) {
    g.globalAlpha = 0.06 + rand() * 0.1;
    g.fillStyle = p.accent;
    g.beginPath();
    g.ellipse(rand() * 1024, 80 + rand() * 352, 15 + rand() * 90, 8 + rand() * 40, rand() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  // Impact craters — dark bowl with a lit rim
  for (let i = 0; i < 90; i++) {
    const x = rand() * 1024, y = rand() * 512, r = 2 + rand() * 9;
    g.globalAlpha = 0.35;
    g.fillStyle = p.low;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 0.3;
    g.strokeStyle = p.high;
    g.lineWidth = 1.2;
    g.beginPath(); g.arc(x, y, r, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  }
  // Wind-scour streaks — abrasive dust lanes dragged along the prevailing winds
  for (let i = 0; i < 260; i++) {
    const y = rand() * 512, x = rand() * 1024, len = 30 + rand() * 160;
    g.globalAlpha = 0.03 + rand() * 0.06;
    g.strokeStyle = rand() < 0.55 ? p.low : p.high;
    g.lineWidth = 0.6 + rand() * 1.6;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + len, y + (rand() - 0.5) * 10);
    g.stroke();
  }
  // Oxide drips & rust veins — corrosion bleeding downslope
  for (let i = 0; i < 55; i++) {
    const x = rand() * 1024, y = rand() * 460;
    g.globalAlpha = 0.08 + rand() * 0.12;
    g.strokeStyle = p.accent;
    g.lineWidth = 1 + rand() * 2.4;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + (rand() - 0.5) * 14, y + 12 + rand() * 30, x + (rand() - 0.5) * 20, y + 25 + rand() * 55);
    g.stroke();
  }
  // Dead industrial belts — soot-black scar bands with faint furnace embers
  for (let i = 0; i < 8; i++) {
    const x = rand() * 1024, y = 90 + rand() * 330, w = 60 + rand() * 130, h = 12 + rand() * 26, rot = (rand() - 0.5) * 0.6;
    g.globalAlpha = 0.22;
    g.fillStyle = "#141210";
    g.beginPath(); g.ellipse(x, y, w, h, rot, 0, Math.PI * 2); g.fill();
    for (let j = 0; j < 7; j++) {
      g.globalAlpha = 0.3 + rand() * 0.3;
      g.fillStyle = rand() < 0.6 ? "#8a4a22" : "#c9722f";
      g.fillRect(x + (rand() - 0.5) * w * 1.4, y + (rand() - 0.5) * h * 1.4, 1.5 + rand() * 2, 1 + rand() * 1.5);
    }
  }
  // Soot speckle grain — fine ash sitting in every hollow
  for (let i = 0; i < 900; i++) {
    g.globalAlpha = 0.05 + rand() * 0.1;
    g.fillStyle = rand() < 0.7 ? p.low : p.high;
    g.fillRect(rand() * 1024, rand() * 512, 1 + rand() * 1.6, 1 + rand() * 1.6);
  }
  // Polar caps
  for (const [y0, y1] of [[0, 48], [464, 512]]) {
    const grad = g.createLinearGradient(0, y0, 0, y1);
    grad.addColorStop(y0 === 0 ? 0 : 1, p.caps);
    grad.addColorStop(y0 === 0 ? 1 : 0, "rgba(0,0,0,0)");
    g.globalAlpha = 0.8;
    g.fillStyle = grad;
    g.fillRect(0, y0, 1024, y1 - y0);
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

// Wispy cloud/ash veil layer
function makeCloudTexture(planet) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 256;
  const g = c.getContext("2d");
  const rand = mulberry32(planet.seed + 7);
  for (let i = 0; i < 130; i++) {
    g.globalAlpha = 0.04 + rand() * 0.09;
    g.fillStyle = "#d8d4cc";
    g.beginPath();
    g.ellipse(rand() * 512, 30 + rand() * 196, 25 + rand() * 90, 4 + rand() * 12, 0, 0, Math.PI * 2);
    g.fill();
  }
  return new THREE.CanvasTexture(c);
}

export default function PlanetBody({ planet, onClick }) {
  const map = useMemo(() => makeSurfaceTexture(planet), [planet]);
  const clouds = useMemo(() => makeCloudTexture(planet), [planet]);
  const cloudRef = useRef();
  useFrame((_, dt) => { if (cloudRef.current) cloudRef.current.rotation.y += dt * 0.012; });
  return (
    <group>
      <mesh onClick={onClick}>
        <sphereGeometry args={[planet.radius, 64, 64]} />
        {/* Matte war-relief crust — no specular sheen, so the brass node/route overlay reads on top */}
        <meshStandardMaterial map={map} bumpMap={map} bumpScale={0.07} roughness={1} metalness={0} />
      </mesh>
      <DustStorm planet={planet} />
      <mesh ref={cloudRef} scale={1.018}>
        <sphereGeometry args={[planet.radius, 48, 48]} />
        <meshStandardMaterial map={clouds} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      {/* Atmosphere rim glow */}
      <mesh scale={1.07}>
        <sphereGeometry args={[planet.radius, 32, 32]} />
        <meshBasicMaterial color={planet.palette.atmo} transparent opacity={0.13} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}