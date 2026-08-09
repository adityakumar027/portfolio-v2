"use client";

import { useEffect, useState } from "react";

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(maxScroll > 0 ? scrolled / maxScroll : 0);
    };

    addEventListener("scroll", handleScroll, { passive: true });
    return () => removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="scroll-progress" aria-hidden="true">
      <div
        className="scroll-progress-fill"
        style={{ height: `${progress * 100}%` }}
      />
      {progress < 0.95 && (
        <div className="scroll-progress-arrow">↓</div>
      )}
    </div>
  );
}
