"use client";

import { useEffect, useMemo, useState } from "react";
import { createJourney, ZONES, type ZoneId } from "../lib/spline";
import { zoneLabel } from "../lib/zoneLabels";

type HUDProps = {
  activeZone: ZoneId;
  progress: number;
  audioEnabled: boolean;
  onToggleAudio: () => void;
};

export default function HUD({ activeZone, progress, audioEnabled, onToggleAudio }: HUDProps) {
  const journey = useMemo(() => createJourney(), []);
  const [fraction, setFraction] = useState(0);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      setFraction((previous) => (Math.abs(previous - progress) > 0.002 ? progress : previous));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [progress]);

  const jumpTo = (zone: ZoneId) => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const center = ZONES.find((entry) => entry.id === zone)?.center ?? 0;
    window.scrollTo({ top: journey.tForZ(center) * max, behavior: "smooth" });
  };

  return (
    <>
      <div className="hud" role="region" aria-label="Journey navigation">
        <nav className="hud-zones" aria-label="Jump to section">
          {ZONES.map((zone) => (
            <a
              key={zone.id}
              href={`#${zone.id}`}
              className={zone.id === activeZone ? "is-active" : undefined}
              onClick={(event) => {
                event.preventDefault();
                jumpTo(zone.id);
              }}
            >
              {zone.label}
            </a>
          ))}
        </nav>
        <p className="hud-zone-current">
          <span aria-hidden="true">◆</span> {zoneLabel(activeZone)}
        </p>
      </div>

      <div className="hud-side" role="presentation">
        <div className="hud-progress" aria-label={`Journey progress ${Math.round(fraction * 100)}%`}>
          <i style={{ transform: `scaleY(${fraction})` }} />
        </div>
        <p className="hud-percent">{String(Math.round(fraction * 100)).padStart(3, "0")}%</p>
        <button
          type="button"
          className={audioEnabled ? "hud-audio is-on" : "hud-audio"}
          onClick={onToggleAudio}
          aria-pressed={audioEnabled}
          aria-label={audioEnabled ? "Disable ambient audio" : "Enable ambient audio"}
        >
          AUDIO {audioEnabled ? "ON" : "OFF"}
        </button>
      </div>
    </>
  );
}