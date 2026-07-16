import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Html } from "@react-three/drei";
import { arcPoints, slerpSurface } from "@/components/starmap/arcMath";

// The plotted march drawn over the planet: highlighted legs, overnight camps,
// and a convoy beacon crawling the route in real time.
export default function MarchTrail({ planet, plan }) {
  const legs = useMemo(() => {
    const byId = Object.fromEntries(planet.nodes.map((n) => [n.id, n]));
    return plan.legs.map((l) => ({ ...l, A: byId[l.from], B: byId[l.to] }));
  }, [planet, plan]);

  const legPts = useMemo(() => legs.map((l) => arcPoints(l.A, l.B, planet.radius, 0.06)), [legs, planet.radius]);

  const camps = useMemo(() => plan.camps.map((c) => {
    const l = legs[c.legIndex] || legs[legs.length - 1];
    return { day: c.day, pos: slerpSurface(l.A, l.B, c.t, planet.radius, 0.06) };
  }), [plan, legs, planet.radius]);

  const convoyRef = useRef();
  useFrame(({ clock }) => {
    if (!convoyRef.current || !plan.totalDays) return;
    const day = ((clock.elapsedTime * 0.35) % plan.totalDays);
    const li = Math.max(0, plan.legs.findIndex((l) => day >= l.start && day < l.end));
    const leg = plan.legs[li];
    if (!leg || !legs[li]) return;
    const t = Math.min(Math.max((day - leg.start) / leg.days, 0), 1);
    convoyRef.current.position.copy(slerpSurface(legs[li].A, legs[li].B, t, planet.radius, 0.06));
  });

  return (
    <group>
      {legPts.map((pts, i) => (
        <Line key={i} points={pts} color="#E8C15A" lineWidth={2.5} transparent opacity={0.95} />
      ))}
      {camps.map((c, ci) => (
        <group key={`camp-${ci}`} position={c.pos}>
          <mesh>
            <sphereGeometry args={[planet.radius * 0.014, 8, 8]} />
            <meshBasicMaterial color="#0d0b08" />
          </mesh>
          <Html position={[0, planet.radius * 0.06, 0]} center style={{ pointerEvents: "none" }}>
            <div className="font-mono text-[9px] text-brass-bright bg-black/70 px-1 rounded-sm whitespace-nowrap">D{c.day}</div>
          </Html>
        </group>
      ))}
      {/* Convoy beacon */}
      <mesh ref={convoyRef}>
        <sphereGeometry args={[planet.radius * 0.024, 10, 10]} />
        <meshBasicMaterial color="#FFE08A" />
      </mesh>
    </group>
  );
}