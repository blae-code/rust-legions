import React, { useMemo } from "react";
import { Line } from "@react-three/drei";
import { arcPoints } from "@/components/starmap/arcMath";

const QUALITY_COLORS = { highway: "#C9A227", road: "#9a927f", track: "#6e675c", trail: "#5a5348" };

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