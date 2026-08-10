"use client";

import { useEffect, useState } from "react";

export type ExperienceMode = "fallback" | "full";

export function useExperienceMode(): ExperienceMode {
  const [mode, setMode] = useState<ExperienceMode>("fallback");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrow = window.innerWidth < 768;
    const dm = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const weak = dm !== undefined && dm < 4;
    if (!reduced && !narrow && !weak) setMode("full");
  }, []);

  return mode;
}