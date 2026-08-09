"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const categoryColors: Record<string, string> = {
  Languages: "rgba(113,245,212,0.12)",
  "Backend & Web": "rgba(80,180,255,0.10)",
  "AI Engineering": "rgba(232,168,56,0.10)",
  "Cloud & Operations": "rgba(200,80,120,0.08)",
  "Data & ML": "rgba(120,80,220,0.08)",
  Engineering: "rgba(113,245,212,0.06)",
};

const categoryKeys: Record<string, string> = {
  Languages: "languages",
  "Backend & Web": "backend",
  "AI Engineering": "ai",
  "Cloud & Operations": "cloud",
  "Data & ML": "data",
  Engineering: "engineering",
};

const positions = [
  { top: "5%", left: "10%" },
  { top: "15%", left: "55%" },
  { top: "8%", left: "80%" },
  { top: "30%", left: "5%" },
  { top: "35%", left: "40%" },
  { top: "25%", left: "70%" },
  { top: "50%", left: "15%" },
  { top: "55%", left: "50%" },
  { top: "48%", left: "75%" },
  { top: "70%", left: "25%" },
  { top: "72%", left: "60%" },
  { top: "65%", left: "85%" },
  { top: "85%", left: "10%" },
  { top: "88%", left: "45%" },
  { top: "82%", left: "70%" },
  { top: "92%", left: "30%" },
  { top: "95%", left: "65%" },
  { top: "90%", left: "90%" },
];

export default function SkillConstellation({ capabilities }: { capabilities: { label: string; items: string }[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !containerRef.current) return;

    const tags = containerRef.current.querySelectorAll(".skill-tag");
    
    gsap.fromTo(tags,
      {
        opacity: 0,
        scale: 0.8,
        x: () => gsap.utils.random(-60, 60),
        y: () => gsap.utils.random(-40, 40),
      },
      {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.04,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          once: true,
        },
      }
    );
  }, []);

  const allSkills: { name: string; category: string }[] = [];
  capabilities.forEach(cap => {
    cap.items.split(",").forEach((item: string) => {
      allSkills.push({ name: item.trim(), category: cap.label });
    });
  });

  return (
    <div className="skills-constellation" ref={containerRef}>
      {allSkills.map((skill, i) => {
        const pos = positions[i % positions.length];
        const bgColor = categoryColors[skill.category] || "rgba(113,245,212,0.06)";
        return (
          <div
            className="skill-tag"
            key={`${skill.category}-${skill.name}`}
            data-category={categoryKeys[skill.category] || "engineering"}
            style={{
              top: pos.top,
              left: pos.left,
              background: bgColor,
            }}
          >
            {skill.name}
          </div>
        );
      })}
    </div>
  );
}
