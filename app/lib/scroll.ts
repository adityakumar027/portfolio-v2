"use client";

import { useEffect, useRef, useState } from "react";

export type ScrollState = {
  progress: number;
  progressRef: { current: number };
  velocityRef: { current: number };
};

export function useScrollProgress(): ScrollState {
  const progressRef = useRef(0);
  const velocityRef = useRef(0);
  const lastFrameRef = useRef(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progressRef.current = Math.min(1, Math.max(0, window.scrollY / max));
    };

    const tick = (time: number) => {
      if (lastFrameRef.current > 0) {
        const delta = (time - lastFrameRef.current) / 1000;
        const ema = 1 - Math.exp(-delta * 6);
        const nextVelocity = delta > 0 ? (progressRef.current - velocityRef.current) / delta : 0;
        velocityRef.current += (nextVelocity - velocityRef.current) * ema;
      }
      lastFrameRef.current = time;
      setProgress((previous) => (Math.abs(previous - progressRef.current) > 0.001 ? progressRef.current : previous));
      frame = requestAnimationFrame(tick);
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", measure);
      cancelAnimationFrame(frame);
    };
  }, []);

  return { progress, progressRef, velocityRef };
}