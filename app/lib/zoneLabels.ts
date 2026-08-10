import { ZONES, type ZoneId } from "./spline";

export function zoneLabel(id: ZoneId): string {
  const zone = ZONES.find((entry) => entry.id === id);
  return zone ? zone.label : id.toUpperCase();
}