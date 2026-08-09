"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const metrics = [
  { number: 1200, suffix: "+", label: "Coding problems solved" },
  { number: 50, suffix: "+", label: "Production APIs shipped" },
  { number: 80, suffix: "%+", label: "Failures auto-resolved" },
  { number: 1, suffix: "M+", label: "Users served" },
  { number: 300, suffix: "+", label: "Alphas submitted" },
  { number: 2.25, suffix: "", label: "Min Sharpe ratio", decimals: 2 },
];

export default function MetricsTicker() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [counted, setCounted] = useState<number[]>(metrics.map(() => 0));

  useEffect(() => {
    const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !trackRef.current) return;

    const track = trackRef.current;

    // Count-up animation
    metrics.forEach((metric, i) => {
      gsap.to({}, {
        duration: 1.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: track,
          start: "top 85%",
          once: true,
        },
        onUpdate: function (this: gsap.core.Tween) {
          const progress = this.progress();
          const current = metric.decimals
            ? parseFloat((progress * metric.number).toFixed(metric.decimals))
            : Math.round(progress * metric.number);
          setCounted(prev => {
            const next = [...prev];
            next[i] = current;
            return next;
          });
        },
        delay: i * 0.15,
      });
    });

    // Auto-scroll ticker
    let scrollTween: gsap.core.Tween | null = null;
    const startAutoScroll = () => {
      scrollTween = gsap.to(track, {
        x: -(track.scrollWidth - window.innerWidth + 120),
        duration: 20,
        ease: "none",
        repeat: -1,
      });
    };

    const timer = setTimeout(startAutoScroll, 2000);

    // Pause on hover
    const handleMouseEnter = () => scrollTween?.pause();
    const handleMouseLeave = () => scrollTween?.resume();
    track.addEventListener("mouseenter", handleMouseEnter);
    track.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearTimeout(timer);
      scrollTween?.kill();
      track.removeEventListener("mouseenter", handleMouseEnter);
      track.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="metrics-ticker">
      <div className="metrics-ticker-track" ref={trackRef}>
        {metrics.map((metric, i) => (
          <div className="metric-card glass-panel" key={metric.label}>
            <div className="metric-number">
              {metric.decimals
                ? counted[i].toFixed(metric.decimals)
                : counted[i].toLocaleString()}
              {metric.suffix}
            </div>
            <div className="metric-label">{metric.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
