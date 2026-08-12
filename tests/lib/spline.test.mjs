import assert from "node:assert/strict";
import test from "node:test";
import { createJourney, zoneForZ } from "../../app/lib/spline.ts";

test("zoneForZ maps camera depth to zone ids", () => {
  assert.equal(zoneForZ(0), "approach");
  assert.equal(zoneForZ(-25), "approach");
  assert.equal(zoneForZ(-80), "path");
  assert.equal(zoneForZ(-160), "shrine");
  assert.equal(zoneForZ(-250), "ascent");
  assert.equal(zoneForZ(-340), "transmission");
  assert.equal(zoneForZ(-500), "transmission");
});

test("journey samples camera positions along the spline", () => {
  const journey = createJourney();
  const start = journey.getAt(0).position;
  const end = journey.getAt(1).position;
  assert.ok(Number.isFinite(start.z) && Number.isFinite(end.z));
  assert.ok(start.z > end.z, "camera moves toward negative z");
  assert.ok(journey.getAt(0.5).position.z < start.z && journey.getAt(0.5).position.z > end.z);
});

test("tForZ returns a t near the zone center", () => {
  const journey = createJourney();
  const t = journey.tForZ(-160);
  assert.ok(t > 0.3 && t < 0.75, `shrine t out of range: ${t}`);
});

test("tForZ is monotonic across zone centers", () => {
  const journey = createJourney();
  const ts = [-20, -80, -160, -250, -340].map((z) => journey.tForZ(z));
  for (let index = 1; index < ts.length; index += 1) {
    assert.ok(ts[index] > ts[index - 1], `tForZ not monotonic at ${index}`);
  }
});