// Great-circle math for drawing routes over a planet's surface
import * as THREE from "three";
import { latLonToXYZ } from "@/lib/macro/planets";

const unitVec = (n) => new THREE.Vector3(...latLonToXYZ(n.lat, n.lon, 1));

// A single point t∈[0,1] along the great circle from a to b, lifted off the crust
export function slerpSurface(a, b, t, r, liftScale = 0.05) {
  const A = unitVec(a), B = unitVec(b);
  const angle = A.angleTo(B) || 0.001;
  const p = A.clone().multiplyScalar(Math.sin((1 - t) * angle))
    .add(B.clone().multiplyScalar(Math.sin(t * angle)))
    .divideScalar(Math.sin(angle));
  const lift = 1.015 + Math.sin(t * Math.PI) * angle * liftScale;
  return p.normalize().multiplyScalar(r * lift);
}

export function arcPoints(a, b, r, liftScale = 0.05, segments = 24) {
  const pts = [];
  for (let i = 0; i <= segments; i++) pts.push(slerpSurface(a, b, i / segments, r, liftScale));
  return pts;
}