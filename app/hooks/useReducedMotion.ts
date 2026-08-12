"use client";

import { useEffect, useState } from "react";
import { detectReducedMotion, type ExperienceMode } from "../lib/reducedMotion";

export function useReducedMotion(): ExperienceMode {
  const [mode, setMode] = useState<ExperienceMode>("fallback");

  useEffect(() => {
    if (!detectReducedMotion()) setMode("full");
  }, []);

  return mode;
}