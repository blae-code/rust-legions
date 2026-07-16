import React, { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { latLonToXYZ } from "@/lib/macro/planets";

const QUALITY_COLORS = { highway: "#C9A227", road: "#9a927f", track: "#6e675c", trail: "#5a5348" };

// Great-circle arc between two surface points, lifted off the crust
function arcPoints(a, b, r) {
  const A = new THREE.Vector3(...latLonToXYZ(a.lat, a.lon, 1));
  const B = new THREE.Vector3(...latLonToXYZ(b.lat, b.lon, 1));
  const angle = A.angleTo(B) || 0.001;
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const p = A.clone().multiplyScalar(Math.sin((1 - t) * angle))
      .add(B.clone().multiplyScalar(Math.sin(t * angle)))
      .divideScalar(Math.sin(angle));
    const lift = 1.015 + Math.sin(t * Math.PI) * angle * 0.05;
    pts.push(p.normalize().multiplyScalar(r * lift));
  }
  return pts;
}

// Every supply route on the world, colored by road quality (trails are dashed)
export default function RouteArcs({ planet }) {
  const arcs = useMemo(() => {
    const byId = Object.fromEntries(planet.nodes.map((n) => [n.id, n]));
    return planet.routes
      .filter(([a, b]) => byId[a] && byId[b])
      .map(([a, b, , quality]) => ({ points: arcPoints(byId[a], byId[b], planet.radius), quality }));
  }, [planet]);
  return arcs.map((arc, i) => (
    <Line
      key={i}
      points={arc.points}
      color={QUALITY_COLORS[arc.quality] || "#777"}
      lineWidth={arc.quality === "highway" ? 1.6 : 1}
      transparent
      opacity={arc.quality === "trail" ? 0.45 : 0.75}
      dashed={arc.quality === "trail"}
      dashSize={0.12}
      gapSize={0.08}
    />
  ));
}