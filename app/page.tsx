"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import HUD from "./components/HUD";
import ReducedMotionFallback from "./components/ReducedMotionFallback";
import { useAudio } from "./hooks/useAudio";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { useScrollProgress } from "./lib/scroll";
import type { ZoneId } from "./lib/spline";

const SceneCanvas = dynamic(() => import("./components/SceneCanvas"), { ssr: false });

class CanvasBoundary extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFail();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function Home() {
  const mode = useReducedMotion();
  const { progress, progressRef, velocityRef } = useScrollProgress();
  const [activeZone, setActiveZone] = useState<ZoneId>("approach");
  const { enabled, toggle, rustle, ping } = useAudio();
  const pingedRef = useRef(false);
  const [canvasFailed, setCanvasFailed] = useState(false);

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

  if (mode === "fallback" || canvasFailed) {
    return <ReducedMotionFallback />;
  }

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="site-grain" aria-hidden="true" />
      <div className="crt-scanlines" aria-hidden="true" />
      <div className="webgl-layer">
        <CanvasBoundary onFail={() => setCanvasFailed(true)}>
          <SceneCanvas progressRef={progressRef} velocityRef={velocityRef} onZoneChange={handleZoneChange} />
        </CanvasBoundary>
      </div>
      <main id="main" tabIndex={-1}>
        <div className="scroll-space" aria-hidden="true" />
      </main>
      <HUD activeZone={activeZone} progress={progress} audioEnabled={enabled} onToggleAudio={handleToggleAudio} />
    </>
  );
}