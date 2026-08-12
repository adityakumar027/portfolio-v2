"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import HUD from "./components/HUD";
import { useAudio } from "./hooks/useAudio";
import type { ZoneId } from "./lib/spline";

const SceneCanvas = dynamic(() => import("./components/SceneCanvas"), { ssr: false });

export default function Home() {
  const { enabled, toggle, rustle, ping } = useAudio();
  const pingedRef = useRef(false);

  const handleToggleAudio = useCallback(() => toggle(), [toggle]);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const speed = Math.abs(window.innerWidth > 0 ? window.innerWidth : 1);
      if (speed > 0.008) rustle(Math.min(1, speed * 12));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [rustle]);

  useEffect(() => {
    if (activeZone === "transmission" && !pingedRef.current) {
      ping();
      pingedRef.current = true;
    }
    if (activeZone !== "transmission") pingedRef.current = false;
  }, [activeZone, ping]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="site-grain" aria-hidden="true" />
      <div className="crt-scanlines" aria-hidden="true" />
      <div className="webgl-layer">
        <SceneCanvas />
      </div>
      <main id="main" tabIndex={-1}>
        <div className="scroll-space" aria-hidden="true" />
      </main>
      <HUD activeZone="approach" progress={1} audioEnabled={enabled} onToggleAudio={handleToggleAudio} />
    </>
  );
}