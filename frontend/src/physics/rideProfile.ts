import * as THREE from 'three';

/**
 * Physically based ride profile for a path through 3D space.
 *
 * Both rollercoaster and flight modes use the same kinematics:
 *   a = (dv/dt)·T + v²·κ·N          (path acceleration; κ·N = d²r/ds²)
 *   f = a − g_vec                   (specific force the rider feels, g_vec = (0, −g, 0))
 * and resolve f in the rider's frame. At rest on flat ground f = (0, +g, 0),
 * i.e. the rider feels +1 G "into the seat".
 *
 * Rollercoaster: speed comes from conservation of energy with rolling friction,
 *   v(s)² = v0² + 2g·(h0 − h(s)) − 2·μ·g·s
 * where v0 is the launch speed needed to clear every crest at ≥ minCrestSpeed.
 *
 * Flight: constant airspeed (thrust balances drag), coordinated flight. The
 * aircraft banks so the felt force has no sideways component; the felt force
 * normal to the flight path is the load factor n.
 *
 * World axes: Y is up (matches the editor grid). Units: metres, seconds.
 */

export type RideMode = 'flight' | 'coaster';

export const G = 9.81;

export interface RideSample {
  /** arc-length fraction 0..1 (what curve.getPointAt expects) */
  u: number;
  /** arc length from start, m */
  s: number;
  /** elapsed ride time at this sample, s */
  t: number;
  /** speed, m/s */
  speed: number;
  /** altitude above ground, m */
  altitude: number;
  /** felt force along seat-up axis (unbanked frame for coaster), in G */
  verticalG: number;
  /** felt force sideways (unbanked frame), in G. ≈0 in coordinated flight once banked */
  lateralG: number;
  /** felt force along direction of travel, in G */
  longitudinalG: number;
  /** magnitude of felt force normal to the path, in G (= load factor in flight) */
  normalG: number;
  /** total felt force magnitude, in G */
  totalG: number;
  /**
   * Bank angle, degrees. Flight: coordinated-turn bank (cancels lateral G).
   * Coaster: auto-banked track, heartline bank capped at ±80° and level during airtime.
   */
  bankDeg: number;
  /** felt force into the seat after banking, in G */
  seatG: number;
  /** felt force sideways after banking, in G */
  sideG: number;
  /** path pitch angle (climb positive), degrees */
  pitchDeg: number;
}

export interface RideProfile {
  mode: RideMode;
  samples: RideSample[];
  length: number;
  duration: number;
  launchSpeed: number;
  maxG: number;
  minVerticalG: number;
  warnings: string[];
}

export interface RideOptions {
  mode: RideMode;
  /** metres per editor grid unit (coaster 1, flight 100) */
  scale?: number;
  /** number of samples along the path */
  samples?: number;
  /** coaster: rolling + aero loss coefficient */
  friction?: number;
  /** coaster: minimum speed at the highest crest, m/s */
  minCrestSpeed?: number;
  /** flight: constant airspeed, m/s */
  airspeed?: number;
}

export const MODE_DEFAULTS: Record<RideMode, Required<Omit<RideOptions, 'mode'>>> = {
  coaster: { scale: 1, samples: 400, friction: 0.015, minCrestSpeed: 2, airspeed: 0 },
  flight: { scale: 100, samples: 400, friction: 0, minCrestSpeed: 0, airspeed: 60 },
};

/** Comfort/safety bands used for warnings (approximate; validate against ASTM F2291 before publishing). */
export const LIMITS = {
  coaster: { maxVerticalG: 5, minVerticalG: -1.5, maxLateralG: 1.8 },
  flight: { maxLoadFactor: 4, minLoadFactor: -1.5 },
};

const UP = new THREE.Vector3(0, 1, 0);

/**
 * CatmullRomCurve3 whose parameter is clamped to [0, 1]. three.js can map
 * u ≈ 1 to t slightly above 1 through floating-point error in the arc-length
 * table, which indexes past the last control point and throws.
 */
export class SafeCatmullRomCurve3 extends THREE.CatmullRomCurve3 {
  getPoint(t: number, target?: THREE.Vector3): THREE.Vector3 {
    const tt = Number.isFinite(t) ? THREE.MathUtils.clamp(t, 0, 1) : 0;
    return super.getPoint(tt, target);
  }
}

export function computeRideProfile(
  curve: THREE.Curve<THREE.Vector3>,
  opts: RideOptions
): RideProfile {
  const cfg = { ...MODE_DEFAULTS[opts.mode], ...stripUndefined(opts) };
  const n = Math.max(8, Math.floor(cfg.samples));
  const scale = cfg.scale;

  // 1. Sample positions uniformly in arc length (metres).
  const pos: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++)
    pos.push(
      curve
        .getPointAt(i / n)
        .clone()
        .multiplyScalar(scale)
    );
  const length = curve.getLength() * scale;
  const ds = length / n;

  // 2. Speed profile.
  const h0 = pos[0].y;
  let launchSpeed: number;
  const speed: number[] = new Array(n + 1);
  if (opts.mode === 'coaster') {
    // v0² must exceed 2g(h−h0) + 2μg·s + vmin² everywhere on the track
    let need = 0;
    for (let i = 0; i <= n; i++) {
      need = Math.max(need, 2 * G * (pos[i].y - h0) + 2 * cfg.friction * G * i * ds);
    }
    launchSpeed = Math.sqrt(need + cfg.minCrestSpeed ** 2);
    for (let i = 0; i <= n; i++) {
      const v2 = launchSpeed ** 2 + 2 * G * (h0 - pos[i].y) - 2 * cfg.friction * G * i * ds;
      speed[i] = Math.sqrt(Math.max(v2, cfg.minCrestSpeed ** 2));
    }
  } else {
    launchSpeed = cfg.airspeed;
    speed.fill(cfg.airspeed);
  }

  // 3. Kinematics by finite differences in arc length.
  const samples: RideSample[] = [];
  let t = 0;
  let maxG = 0;
  let minVerticalG = Infinity;
  for (let i = 0; i <= n; i++) {
    const ip = Math.max(0, i - 1);
    const inx = Math.min(n, i + 1);
    const span = (inx - ip) * ds;
    const T = new THREE.Vector3().subVectors(pos[inx], pos[ip]).divideScalar(span || 1);
    if (T.lengthSq() < 1e-12) T.set(1, 0, 0);
    T.normalize();

    // curvature vector κN = d²r/ds² (central difference; one-sided ends use neighbours)
    const c = Math.min(Math.max(i, 1), n - 1);
    const kappaN = new THREE.Vector3()
      .addVectors(pos[c + 1], pos[c - 1])
      .sub(pos[c].clone().multiplyScalar(2))
      .divideScalar(ds * ds);
    // keep only the part normal to T (finite differences leak a little tangential)
    kappaN.addScaledVector(T, -kappaN.dot(T));

    const v = speed[i];
    const dvds = (speed[inx] - speed[ip]) / (span || 1);
    const a = kappaN
      .clone()
      .multiplyScalar(v * v)
      .addScaledVector(T, v * dvds); // v·dv/ds = dv/dt
    const f = a.clone().add(new THREE.Vector3(0, G, 0)); // a − g_vec, g_vec = (0,−G,0)

    // unbanked rider frame: right = T × up, seatUp = right × T
    let right = new THREE.Vector3().crossVectors(T, UP);
    if (right.lengthSq() < 1e-8) right = new THREE.Vector3(1, 0, 0); // vertical path
    right.normalize();
    const seatUp = new THREE.Vector3().crossVectors(right, T).normalize();

    const verticalG = f.dot(seatUp) / G;
    const lateralG = f.dot(right) / G;
    const longitudinalG = f.dot(T) / G;
    const normalG = Math.hypot(verticalG, lateralG);
    const totalG = f.length() / G;
    let bank: number;
    if (opts.mode === 'flight') {
      bank = Math.atan2(lateralG, verticalG); // fully coordinated
    } else {
      const MAX_BANK = THREE.MathUtils.degToRad(80);
      // heartline bank; during airtime (low/negative seat load) bank as if 0.2 G remained
      bank = THREE.MathUtils.clamp(
        Math.atan2(lateralG, Math.max(verticalG, 0.2)),
        -MAX_BANK,
        MAX_BANK
      );
    }
    const seatG = verticalG * Math.cos(bank) + lateralG * Math.sin(bank);
    const sideG = lateralG * Math.cos(bank) - verticalG * Math.sin(bank);
    const bankDeg = THREE.MathUtils.radToDeg(bank);
    const pitchDeg = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(T.y, -1, 1)));

    if (i > 0) t += ds / Math.max(0.5 * (speed[i] + speed[i - 1]), 1e-3);

    maxG = Math.max(maxG, opts.mode === 'flight' ? normalG : totalG);
    minVerticalG = Math.min(minVerticalG, opts.mode === 'coaster' ? seatG : verticalG);
    samples.push({
      u: i / n,
      s: i * ds,
      t,
      speed: v,
      altitude: pos[i].y,
      verticalG,
      lateralG,
      longitudinalG,
      normalG,
      totalG,
      bankDeg,
      seatG,
      sideG,
      pitchDeg,
    });
  }

  return {
    mode: opts.mode,
    samples,
    length,
    duration: t,
    launchSpeed,
    maxG,
    minVerticalG,
    warnings: buildWarnings(opts.mode, samples),
  };
}

/** Linear interpolation of a profile at arc-length fraction u (0..1). */
export function sampleAt(profile: RideProfile, u: number): RideSample {
  const s = profile.samples;
  const x = THREE.MathUtils.clamp(u, 0, 1) * (s.length - 1);
  const i = Math.floor(x);
  const j = Math.min(i + 1, s.length - 1);
  const k = x - i;
  const a = s[i];
  const b = s[j];
  const mix = (p: number, q: number) => p + (q - p) * k;
  return {
    u,
    s: mix(a.s, b.s),
    t: mix(a.t, b.t),
    speed: mix(a.speed, b.speed),
    altitude: mix(a.altitude, b.altitude),
    verticalG: mix(a.verticalG, b.verticalG),
    lateralG: mix(a.lateralG, b.lateralG),
    longitudinalG: mix(a.longitudinalG, b.longitudinalG),
    normalG: mix(a.normalG, b.normalG),
    totalG: mix(a.totalG, b.totalG),
    bankDeg: mix(a.bankDeg, b.bankDeg),
    seatG: mix(a.seatG, b.seatG),
    sideG: mix(a.sideG, b.sideG),
    pitchDeg: mix(a.pitchDeg, b.pitchDeg),
  };
}

/** Advance arc-length fraction by real elapsed time using the local speed. */
export function advance(profile: RideProfile, u: number, dt: number): number {
  if (profile.length <= 0) return 1;
  const v = sampleAt(profile, u).speed;
  return Math.min(1, u + (v * dt) / profile.length);
}

function buildWarnings(mode: RideMode, samples: RideSample[]): string[] {
  const w: string[] = [];
  if (mode === 'coaster') {
    const L = LIMITS.coaster;
    const maxV = Math.max(...samples.map(s => s.seatG));
    const minV = Math.min(...samples.map(s => s.seatG));
    const maxLat = Math.max(...samples.map(s => Math.abs(s.sideG)));
    if (maxV > L.maxVerticalG)
      w.push(`Vertical G peaks at ${maxV.toFixed(1)} (limit ~${L.maxVerticalG})`);
    if (minV < L.minVerticalG)
      w.push(`Negative G reaches ${minV.toFixed(1)} (limit ~${L.minVerticalG})`);
    if (maxLat > L.maxLateralG)
      w.push(`Lateral G reaches ${maxLat.toFixed(1)} even with banking: widen the turn`);
  } else {
    const L = LIMITS.flight;
    const maxN = Math.max(...samples.map(s => s.normalG));
    if (maxN > L.maxLoadFactor)
      w.push(`Load factor peaks at ${maxN.toFixed(1)} G (limit ~${L.maxLoadFactor})`);
    if (Math.min(...samples.map(s => s.altitude)) < 30) w.push('Path dips below 30 m above ground');
  }
  return w;
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}
