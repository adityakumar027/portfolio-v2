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

export type Journey = {
  curve: THREE.CatmullRomCurve3;
  getAt(t: number): { position: THREE.Vector3; lookAt: THREE.Vector3 };
  tForZ(z: number): number;
};

const SAMPLES = 200;

export function createJourney(): Journey {
  const points = [8, -20, -80, -160, -250, -340].map((z) => new THREE.Vector3(0, 0, z));
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
  };
}