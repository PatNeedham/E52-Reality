import * as THREE from 'three';
import { RideMode, SafeCatmullRomCurve3 } from './rideProfile';

/**
 * Build one smooth curve through the waypoints.
 *
 * The previous builder chained independent quadratic Béziers, which meet at each
 * waypoint with a corner (tangent discontinuity). A corner has infinite
 * curvature, so the physics reported impossible spikes (28 G in the default
 * flight). Here each segment's control offset becomes an extra via-point at the
 * segment midpoint and a single centripetal Catmull-Rom passes through all of
 * them, so the tangent is continuous everywhere.
 */
export function buildCourseCurve(
  points: THREE.Vector3[],
  controlOffsets: THREE.Vector3[] = []
): SafeCatmullRomCurve3 {
  const via: THREE.Vector3[] = [];
  points.forEach((p, i) => {
    via.push(p.clone());
    const next = points[i + 1];
    const off = controlOffsets[i];
    if (next && off && off.lengthSq() > 1e-9) {
      via.push(new THREE.Vector3().addVectors(p, next).multiplyScalar(0.5).add(off));
    }
  });
  return new SafeCatmullRomCurve3(via.length > 1 ? via : points, false, 'centripetal');
}

export const DEFAULT_POINTS: Record<RideMode, () => THREE.Vector3[]> = {
  // 1 unit = 1 m. Family coaster: 10 m lift, drop, camelback (airtime), banked
  // 180° turn, return run. ~95 m, ~13 m/s top speed, peak ~3.8 G, airtime ~−1.1 G.
  coaster: () =>
    [
      [-22, 10, 0],
      [-17, 10.2, 0],
      [-10, 4.5, 0],
      [-4, 1.5, 0],
      [2, 1.5, 0],
      [8, 3.8, 0],
      [13, 4.2, 0],
      [18, 3.2, 3],
      [20, 2.6, 9],
      [16, 2.5, 15],
      [8, 2, 17],
      [-2, 1.5, 15],
      [-11, 1.5, 11],
      [-17, 1.2, 6],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  // 1 unit = 100 m: climb-out, climbing turn, cruise, descending turn
  flight: () => [
    new THREE.Vector3(-8, 1, 0),
    new THREE.Vector3(-4, 2, 3),
    new THREE.Vector3(2, 3.2, 5),
    new THREE.Vector3(8, 3.6, 2),
    new THREE.Vector3(7, 3.2, -4),
    new THREE.Vector3(0, 2.6, -6),
    new THREE.Vector3(-6, 2, -3),
  ],
};
