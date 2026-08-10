"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import HUD from "./components/HUD";
import ReducedMotionFallback from "./components/ReducedMotionFallback";
import { useAudio } from "./hooks/useAudio";
import { useExperienceMode } from "./hooks/useExperienceMode";
import { useScrollProgress } from "./lib/scroll";
import type { ZoneId } from "./lib/spline";

const SceneCanvas = dynamic(() => import("./components/SceneCanvas"), { ssr: false });

export default function Home() {
  const mode = useExperienceMode();
  const { progress, progressRef, velocityRef } = useScrollProgress();
  const [activeZone, setActiveZone] = useState<ZoneId>("approach");
  const { enabled, toggle, rustle, ping } = useAudio();
  const pingedRef = useRef(false);

  const handleZoneChange = useCallback((zone: ZoneId) => {
    setActiveZone(zone);
  }, []);

  const handleToggleAudio = useCallback(() => toggle(), [toggle]);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const speed = Math.abs(velocityRef.current);
      if (speed > 0.008) rustle(Math.min(1, speed * 12));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [velocityRef, rustle]);

  useEffect(() => {
    if (activeZone === "transmission" && !pingedRef.current) {
      ping();
      pingedRef.current = true;
    }
    if (activeZone !== "transmission") pingedRef.current = false;
  }, [activeZone, ping]);

  if (mode === "fallback") {
    return <ReducedMotionFallback />;
  }

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="site-grain" aria-hidden="true" />
      <div className="crt-scanlines" aria-hidden="true" />
      <div className="webgl-layer">
        <SceneCanvas progressRef={progressRef} velocityRef={velocityRef} onZoneChange={handleZoneChange} />
      </div>
      <main id="main" tabIndex={-1}>
        <div className="scroll-space" aria-hidden="true" />
      </main>
      <HUD activeZone={activeZone} progress={progress} audioEnabled={enabled} onToggleAudio={handleToggleAudio} />
    </>
  );
}