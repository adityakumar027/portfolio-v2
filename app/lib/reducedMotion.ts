export type ExperienceMode = "fallback" | "full";

function webgl2Supported(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2");
    if (!context) return false;
    const version = context.getParameter(context.VERSION);
    const shadingLanguage = context.getParameter(context.SHADING_LANGUAGE_VERSION);
    return !!version && !!shadingLanguage;
  } catch {
    return false;
  }
}

export function detectReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const narrow = window.innerWidth < 768;
  const dm = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const weak = dm !== undefined && dm < 4;
  return reduced || narrow || weak || !webgl2Supported();
}

export function shouldUseReducedMotion(): boolean {
  return detectReducedMotion();
}