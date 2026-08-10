"use client";

import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactElement } from "react";
import { BlendFunction } from "postprocessing";
import { useScene } from "../lib/scene";

export default function PostProcessing() {
  const store = useScene();
  const chromatic = useRef<{ offset: { x: number; y: number } } | null>(null);
  const baseOffset = useMemo(() => ({ x: 0.0011, y: 0.0006 }), []);

  useFrame(() => {
    if (!chromatic.current) return;
    const speed = Math.min(2.2, Math.abs(store.current.velocity) * 34);
    chromatic.current.offset.x = baseOffset.x + speed * 0.0022;
    chromatic.current.offset.y = baseOffset.y + speed * 0.0011;
  });

  const lowPower =
    typeof navigator !== "undefined" &&
    typeof window !== "undefined" &&
    window.innerWidth < 980 &&
    ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 16) < 8;

  return (
    <EffectComposer multisampling={0} resolutionScale={lowPower ? 0.55 : 0.8}>
      {[
        !lowPower && (
          <Bloom key="bloom" intensity={0.35} luminanceThreshold={0.78} luminanceSmoothing={0.2} mipmapBlur />
        ),
        <ChromaticAberration key="ca" ref={chromatic as never} offset={baseOffset} radialModulation={false} modulationOffset={0} />,
        <Noise key="noise" opacity={0.018} blendFunction={BlendFunction.SOFT_LIGHT} />,
        <Vignette key="vignette" eskil={false} offset={0.22} darkness={0.52} />,
      ].filter(Boolean) as ReactElement[]}
    </EffectComposer>
  );
}