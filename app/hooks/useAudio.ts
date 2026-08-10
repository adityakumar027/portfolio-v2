"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createAudioEngine, type AudioEngine } from "../lib/audio";

const STORAGE_KEY = "synthwave-audio";

export function useAudio() {
  const engineRef = useRef<AudioEngine | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "on") setEnabled(true);
    } catch {
      // localStorage unavailable — default off
    }
  }, []);

  const toggle = () => {
    setEnabled((previous) => {
      const next = !previous;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      } catch {
        // persist failure is non-fatal
      }
      return next;
    });
  };

  useEffect(() => {
    if (!enabled) return;
    if (!engineRef.current) engineRef.current = createAudioEngine();
    engineRef.current.toggle(true);
    return () => engineRef.current?.toggle(false);
  }, [enabled]);

  const rustle = useCallback((intensity: number) => {
    engineRef.current?.rustle(intensity);
  }, []);

  const ping = useCallback(() => {
    engineRef.current?.ping();
  }, []);

  return { enabled, toggle, rustle, ping };
}