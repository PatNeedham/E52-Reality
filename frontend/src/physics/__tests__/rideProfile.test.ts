import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { computeRideProfile, sampleAt, advance, G } from '../rideProfile';
import { buildCourseCurve, DEFAULT_POINTS } from '../course';

const line = (a: THREE.Vector3, b: THREE.Vector3) => new THREE.LineCurve3(a, b);

/** Horizontal circle of radius R (world Y up). */
class HorizontalCircle extends THREE.Curve<THREE.Vector3> {
  constructor(
    private R: number,
    private turns = 0.5
  ) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const a = t * this.turns * 2 * Math.PI;
    return target.set(this.R * Math.cos(a), 100, this.R * Math.sin(a));
  }
}

/** Vertical circle (loop) of radius R in the XY plane, starting at the bottom. */
class VerticalLoop extends THREE.Curve<THREE.Vector3> {
  constructor(private R: number) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const a = t * 2 * Math.PI - Math.PI / 2;
    return target.set(this.R * Math.cos(a), this.R + this.R * Math.sin(a), 0);
  }
}

describe('computeRideProfile', () => {
  it('reads +1 G on a flat, straight track (not 0 and not 2.2)', () => {
    const p = computeRideProfile(line(new THREE.Vector3(0, 2, 0), new THREE.Vector3(20, 2, 0)), {
      mode: 'coaster',
      friction: 0,
    });
    const s = sampleAt(p, 0);
    expect(s.verticalG).toBeCloseTo(1, 3);
    expect(Math.abs(s.lateralG)).toBeLessThan(1e-6);
  });

  it('conserves energy on a frictionless drop', () => {
    const p = computeRideProfile(line(new THREE.Vector3(0, 20, 0), new THREE.Vector3(30, 0, 0)), {
      mode: 'coaster',
      friction: 0,
      minCrestSpeed: 0,
    });
    const end = p.samples[p.samples.length - 1];
    expect(end.speed).toBeCloseTo(Math.sqrt(2 * G * 20), 1);
  });

  it('matches circular motion at the bottom of a loop: 1 + v²/(gR)', () => {
    const R = 10;
    const p = computeRideProfile(new VerticalLoop(R), {
      mode: 'coaster',
      friction: 0,
      minCrestSpeed: 8,
      samples: 2000,
    });
    const bottom = p.samples[0 + 5];
    const expected = 1 + (bottom.speed * bottom.speed) / (G * R);
    expect(Math.abs(bottom.verticalG)).toBeCloseTo(expected, 1);
  });

  it('gives the textbook coordinated-turn bank and load factor in flight', () => {
    // V²/(gR) = 1  →  bank 45°, n = √2
    const V = 60;
    const R = (V * V) / G;
    const p = computeRideProfile(new HorizontalCircle(R / 100), {
      mode: 'flight',
      airspeed: V,
      scale: 100,
      samples: 1000,
    });
    const mid = sampleAt(p, 0.5);
    expect(Math.abs(mid.bankDeg)).toBeCloseTo(45, 0);
    expect(mid.normalG).toBeCloseTo(Math.SQRT2, 1);
  });

  it('advances faster where the car is faster', () => {
    const p = computeRideProfile(line(new THREE.Vector3(0, 20, 0), new THREE.Vector3(30, 0, 0)), {
      mode: 'coaster',
      friction: 0,
      minCrestSpeed: 1,
    });
    const early = advance(p, 0.05, 0.1) - 0.05;
    const late = advance(p, 0.9, 0.1) - 0.9;
    expect(late).toBeGreaterThan(early * 3);
  });
});

describe('default courses', () => {
  it('default flight stays within the 4 G load-factor limit and above 30 m', () => {
    const p = computeRideProfile(buildCourseCurve(DEFAULT_POINTS.flight()), { mode: 'flight' });
    expect(p.maxG).toBeLessThan(4);
    expect(p.warnings).toEqual([]);
  });

  it('default coaster stays inside the comfort bands once banked', () => {
    const p = computeRideProfile(buildCourseCurve(DEFAULT_POINTS.coaster()), { mode: 'coaster' });
    expect(p.maxG).toBeLessThan(5);
    expect(p.warnings).toEqual([]);
  });

  it('builds a curve with a continuous tangent through each waypoint', () => {
    const c = buildCourseCurve(DEFAULT_POINTS.flight());
    for (let i = 1; i < 200; i++) {
      const a = c.getTangentAt((i - 0.5) / 200);
      const b = c.getTangentAt((i + 0.5) / 200);
      expect(a.angleTo(b)).toBeLessThan(0.2);
    }
  });
});
