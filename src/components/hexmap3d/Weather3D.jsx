import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Slanting rain streaks falling over the war table
function Rain({ center, extent, heavy }) {
  const ref = useRef();
  const count = heavy ? 520 : 300;
  const speed = heavy ? 13 : 8.5;
  const slant = heavy ? 2.2 : 0.9;
  const streak = heavy ? 0.42 : 0.26;
  const ceiling = Math.max(extent * 0.8, 6);
  const spanX = extent * 1.5;
  const spanZ = extent * 1.2;

  const { geo, drops } = useMemo(() => {
    const positions = new Float32Array(count * 6);
    const drops = [];
    for (let i = 0; i < count; i++) {
      drops.push({
        x: center[0] + (Math.random() - 0.5) * spanX,
        z: center[1] + (Math.random() - 0.5) * spanZ,
        y: Math.random() * ceiling,
      });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geo, drops };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, dt) => {
    const step = Math.min(dt, 0.05);
    const pos = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const d = drops[i];
      d.y -= speed * step;
      d.x += slant * step;
      if (d.y < 0) {
        d.y = ceiling;
        d.x = center[0] + (Math.random() - 0.5) * spanX;
        d.z = center[1] + (Math.random() - 0.5) * spanZ;
      }
      const j = i * 6;
      pos[j] = d.x; pos[j + 1] = d.y; pos[j + 2] = d.z;
      pos[j + 3] = d.x - slant * 0.04; pos[j + 4] = d.y + streak; pos[j + 5] = d.z;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <lineSegments ref={ref} geometry={geo} frustumCulled={false}>
      <lineBasicMaterial color="#8FA6B8" transparent opacity={heavy ? 0.4 : 0.3} depthWrite={false} />
    </lineSegments>
  );
}

// Low fog banks drifting just above the tiles
function FogBanks({ center, extent }) {
  const group = useRef();
  const tex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g = cv.getContext("2d");
    const grad = g.createRadialGradient(64, 64, 8, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,255,255,0.9)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(cv);
  }, []);

  const banks = useMemo(
    () =>
      [...Array(7)].map((_, i) => ({
        x: center[0] + (Math.random() - 0.5) * extent,
        z: center[1] + (Math.random() - 0.5) * extent * 0.8,
        y: 0.45 + Math.random() * 0.5,
        scale: extent * (0.35 + Math.random() * 0.4),
        speed: 0.12 + Math.random() * 0.18,
        phase: i * 1.7,
      })),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    group.current.children.forEach((m, i) => {
      const b = banks[i];
      m.position.x = b.x + Math.sin(t * b.speed + b.phase) * extent * 0.22;
      m.position.z = b.z + Math.cos(t * b.speed * 0.7 + b.phase) * extent * 0.12;
      m.material.opacity = 0.14 + Math.sin(t * 0.3 + b.phase) * 0.05;
    });
  });

  return (
    <group ref={group}>
      {banks.map((b, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, b.phase]} position={[b.x, b.y, b.z]}>
          <planeGeometry args={[b.scale, b.scale * 0.7]} />
          <meshBasicMaterial map={tex} color="#9B968C" transparent opacity={0.16} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// Random cold lightning flashes lighting the whole table during a storm
function StormFlash({ center, extent }) {
  const light = useRef();
  const state = useRef({ next: 3 + Math.random() * 5, flash: 0 });

  useFrame((_, dt) => {
    const s = state.current;
    if (s.flash > 0) {
      s.flash -= dt;
      // Double-strobe falloff
      light.current.intensity = Math.max(s.flash * 14 * (Math.random() > 0.4 ? 1 : 0.25), 0);
      if (s.flash <= 0) light.current.intensity = 0;
    } else {
      s.next -= dt;
      if (s.next <= 0) {
        s.flash = 0.35;
        s.next = 4 + Math.random() * 7;
        light.current.position.set(
          center[0] + (Math.random() - 0.5) * extent,
          extent * 0.9,
          center[1] + (Math.random() - 0.5) * extent
        );
      }
    }
  });

  return <pointLight ref={light} position={[center[0], extent, center[1]]} intensity={0} color="#BFD4E4" />;
}

// In-scene weather for the 3D war table — rain streaks, fog banks, storm lightning
export default function Weather3D({ weather, center, extent }) {
  if (!weather || weather === "clear") return null;
  return (
    <>
      {(weather === "rain" || weather === "storm") && (
        <Rain center={center} extent={extent} heavy={weather === "storm"} />
      )}
      {weather === "fog" && <FogBanks center={center} extent={extent} />}
      {weather === "storm" && <StormFlash center={center} extent={extent} />}
    </>
  );
}