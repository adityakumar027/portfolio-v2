"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SceneContext, defaultSceneStore } from "../lib/scene";
import { createJourney } from "../lib/spline";
import type { ZoneId } from "../lib/spline";
import CoreShrine from "./CoreShrine";
import Environment from "./Environment";
import PetalSystem from "./PetalSystem";
import PostProcessing from "./PostProcessing";
import SplineController from "./SplineController";
import BeaconPulse from "./BeaconPulse";
import ZoneManager from "./ZoneManager";

type SceneCanvasProps = {
  progressRef: { current: number };
  velocityRef: { current: number };
  onZoneChange: (zone: ZoneId) => void;
};

export default function SceneCanvas({ progressRef, velocityRef, onZoneChange }: SceneCanvasProps) {
  const store = useRef(defaultSceneStore());
  const journey = useMemo(() => createJourney(), []);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const trackPointer = (event: PointerEvent) => {
      store.current.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      store.current.pointerY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", trackPointer, { passive: true });
    return () => window.removeEventListener("pointermove", trackPointer);
  }, []);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      store.current.t = progressRef.current;
      store.current.velocity = velocityRef.current;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [progressRef, velocityRef]);

  return (
    <>
      <SceneContext.Provider value={store}>
        <Canvas
          camera={{ position: [0, 0.4, 10], fov: 43, near: 0.1, far: 300 }}
          dpr={[1, 1.25]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 0.95;
            gl.outputColorSpace = THREE.SRGBColorSpace;
            requestAnimationFrame(() => setReady(true));
          }}
        >
          <Suspense fallback={null}>
            <SplineController journey={journey} />
            <Environment />
            <PetalSystem />
            <CoreShrine />
            <BeaconPulse />
            <ZoneManager onZoneChange={onZoneChange} />
            <PostProcessing />
          </Suspense>
        </Canvas>
      </SceneContext.Provider>
      <div className={ready ? "scene-loader is-ready" : "scene-loader"} aria-hidden="true">
        <span>INITIALIZING CORE</span>
        <div><i style={{ transform: `scaleX(${ready ? 1 : 0.35})` }} /></div>
      </div>
    </>
  );
}