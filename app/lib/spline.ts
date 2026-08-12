import * as THREE from "three";

export type ZoneId = "approach" | "path" | "shrine" | "ascent" | "transmission";

export type Zone = {
  id: ZoneId;
  label: string;
  from: number;
  to: number;
  center: number;
};

export const ZONES: Zone[] = [
  { id: "approach", label: "APPROACH", from: 0, to: -40, center: -20 },
  { id: "path", label: "PATH", from: -40, to: -120, center: -80 },
  { id: "shrine", label: "SHRINE", from: -120, to: -200, center: -160 },
  { id: "ascent", label: "ASCENT", from: -200, to: -300, center: -250 },
  { id: "transmission", label: "TRANSMISSION", from: -300, to: -380, center: -340 },
];

export function zoneForZ(z: number): ZoneId {
  if (z >= -40) return "approach";
  if (z >= -120) return "path";
  if (z >= -200) return "shrine";
  if (z >= -300) return "ascent";
  return "transmission";
}

/* §4.1 — 1px scroll = 0.08 world units across the 5-waypoint journey (-20 → -340). */
export const WORLD_UNITS_PER_PX = 0.08;
export const JOURNEY_UNITS = 320;
export const MAX_SCROLL_PX = JOURNEY_UNITS / WORLD_UNITS_PER_PX;

/* §4.1 — easing curve for the scroll → spline mapping. */
type BezierComponent = (t: number) => number;

function bezierComponent(a: number, b: number, c: number, d: number): BezierComponent {
  return (t) => {
    const inverse = 1 - t;
    return 3 * inverse * inverse * t * a + 3 * inverse * t * t * c + t * t * t * d;
  };
}

export function createCubicBezierEasing(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const xBezier = bezierComponent(0, x1, x2, 1);
  const yBezier = bezierComponent(0, y1, y2, 1);
  return (progress) => {
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;
    let t = progress;
    for (let index = 0; index < 8; index += 1) {
      const x = xBezier(t) - progress;
      if (Math.abs(x) < 1e-6) break;
      const slope = 3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
      t -= x / slope;
    }
    return yBezier(t);
  };
}

export const easeScroll: (t: number) => number = createCubicBezierEasing(0.25, 0.46, 0.45, 0.94);

export type Journey = {
  curve: THREE.CatmullRomCurve3;
  getAt(t: number): { position: THREE.Vector3; lookAt: THREE.Vector3 };
  tForZ(z: number): number;
  pxForT(t: number): number;
};

const SAMPLES = 200;

export function createJourney(): Journey {
  const points = ZONES.map((zone) => new THREE.Vector3(0, 0, zone.center));
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);

  const zToT = new Map<number, number>();
  for (let index = 0; index <= SAMPLES; index += 1) {
    const t = index / SAMPLES;
    const point = curve.getPoint(t);
    for (const zone of ZONES) {
      if (Math.abs(point.z - zone.center) < 0.75 && !zToT.has(zone.center)) {
        zToT.set(zone.center, t);
      }
    }
  }

  return {
    curve,
    getAt(t) {
      const clamped = Math.min(1, Math.max(0, t));
      return {
        position: curve.getPoint(clamped),
        lookAt: curve.getPoint(Math.min(1, clamped + 0.045)),
      };
    },
    tForZ(z) {
      let closestZone = ZONES[0];
      let closestDistance = Infinity;
      for (const zone of ZONES) {
        const distance = Math.abs(zone.center - z);
        if (distance < closestDistance) {
          closestZone = zone;
          closestDistance = distance;
        }
      }
      return zToT.get(closestZone.center) ?? 0;
    },
    pxForT(target) {
      let low = 0;
      let high = 1;
      for (let index = 0; index < 40; index += 1) {
        const mid = (low + high) / 2;
        if (easeScroll(mid) < target) low = mid;
        else high = mid;
      }
      return ((low + high) / 2) * MAX_SCROLL_PX;
    },
  };
}