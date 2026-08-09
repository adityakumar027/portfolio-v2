# Portfolio Full Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all 7 sections of the portfolio with cinematic scroll animations, editorial typography, and glass panel system — making every section visually unique.

**Architecture:** Hybrid approach: GSAP ScrollTrigger for scroll-driven animations, CSS glass panel system for surfaces, aurora gradient that shifts with scroll, new components for ticker/constellation/progress. No new npm packages.

**Tech Stack:** Next.js (vinext), React 19, GSAP + ScrollTrigger, Framer Motion, Three.js/R3F, Tailwind CSS 4, Geist Sans+Mono, Playfair Display

## Global Constraints

- No new npm packages (GSAP, Framer Motion, Three.js already installed)
- No new fonts (Geist Sans, Geist Mono, Playfair Display already loaded)
- No new images or 3D models
- All animations must check `prefers-reduced-motion` and skip if true
- All animations use `transform` only (no layout shifts, CLS = 0)
- Build must pass: `npm run build`
- Lint must pass: `npm run lint`
- Tests must pass: `npm run test`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `app/globals.css` | Modify | Add glass panel system, section-specific styles, aurora scroll variables |
| `app/page.tsx` | Modify | Add refs, GSAP setup, scroll progress, aurora scroll, reveal-text classes |
| `app/components/ScrollProgress.tsx` | Create | Fixed vertical progress indicator on right edge |
| `app/components/MetricsTicker.tsx` | Create | Horizontal auto-scrolling ticker with count-up numbers |
| `app/components/SkillConstellation.tsx` | Create | Floating skill tags with category colors |
| `app/components/CoreScene.tsx` | Modify | Add blur/scale/position transitions on scroll |
| `app/components/CustomCursor.tsx` | Modify | Add magnetic cursor for contact email |
| `app/components/HorizontalProjects.tsx` | Modify | Add mockup zone, 3D tilt, scroll dots |
| `app/hooks/useScrollAnimation.ts` | Modify | Add reveal-text character split support |

---

### Task 1: Glass Panel CSS System + New CSS Variables

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Produces: CSS classes `.glass-panel`, `.reveal-text`, `.char`, CSS variables `--surface-glass`, `--glass-border`, `--glass-border-hover`, `--glow-warm`, `--aurora-x`, `--aurora-y`

- [ ] **Step 1: Add new CSS variables to `:root`**

```css
/* Add after --soft-line in :root */
--surface-glass: rgba(12, 15, 14, 0.6);
--accent-warm: #E8A838;
--accent-deep: #3a9d8a;
--glow-warm: rgba(232,168,56,0.12);
--glass-border: rgba(255,255,255,0.08);
--glass-border-hover: rgba(113,245,212,0.25);
```

- [ ] **Step 2: Add glass panel base class**

```css
/* Add before the responsive media queries */
.glass-panel {
  background: var(--surface-glass);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: border-color 0.4s ease, box-shadow 0.4s ease;
}
.glass-panel:hover {
  border-color: var(--glass-border-hover);
  box-shadow: 0 0 30px var(--glow);
}
```

- [ ] **Step 3: Add reveal-text character classes**

```css
/* Add after .reveal */
.reveal-text { overflow: hidden; }
.reveal-text .char {
  display: inline-block;
  transform: translateX(-20px);
  opacity: 0;
}
.char-revealed {
  transform: translateX(0) !important;
  opacity: 1 !important;
}
```

- [ ] **Step 4: Add aurora scroll CSS variables**

```css
/* Add to .aurora-bg::before */
.aurora-bg::before {
  /* existing styles... */
  transform: translate(var(--aurora-x, 0%), var(--aurora-y, 0%));
}
```

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat: add glass panel CSS system and new design tokens"
```

---

### Task 2: ScrollProgress Component

**Files:**
- Create: `app/components/ScrollProgress.tsx`

**Interfaces:**
- Consumes: `scrollProgress` number (0-1) from page.tsx
- Produces: Fixed vertical line that fills based on scroll, pulsing arrow at bottom

- [ ] **Step 1: Create ScrollProgress component**

```tsx
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
```

- [ ] **Step 2: Add ScrollProgress CSS to globals.css**

```css
/* Add before responsive media queries */
.scroll-progress {
  position: fixed;
  right: clamp(24px, 4.5vw, 72px);
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 70vh;
  background: var(--soft-line);
  z-index: 50;
}
.scroll-progress-fill {
  width: 100%;
  height: 0%;
  background: var(--accent);
  box-shadow: 0 0 10px var(--glow);
  transition: height 0.1s linear;
}
.scroll-progress-arrow {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  color: var(--accent);
  font-size: 14px;
  animation: pulse-down 2s ease-in-out infinite;
}
@keyframes pulse-down {
  0%, 100% { transform: translateX(-50%) translateY(0); opacity: 1; }
  50% { transform: translateX(-50%) translateY(6px); opacity: 0.5; }
}
@media (max-width: 980px) {
  .scroll-progress { display: none; }
}
```

- [ ] **Step 3: Import ScrollProgress in page.tsx**

Add `import ScrollProgress from "./components/ScrollProgress";` and render `<ScrollProgress />` after `<CustomCursor />`.

- [ ] **Step 4: Commit**

```bash
git add app/components/ScrollProgress.tsx app/globals.css app/page.tsx
git commit -m "feat: add scroll progress indicator component"
```

---

### Task 3: MetricsTicker Component

**Files:**
- Create: `app/components/MetricsTicker.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: metrics data array from page.tsx
- Produces: Horizontal auto-scrolling ticker with glass cards and count-up numbers

- [ ] **Step 1: Create MetricsTicker component**

```tsx
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
    const countTl = gsap.timeline({
      scrollTrigger: {
        trigger: track,
        start: "top 85%",
        once: true,
      },
    });

    metrics.forEach((metric, i) => {
      countTl.to({}, {
        duration: 1.5,
        ease: "power2.out",
        onUpdate: function () {
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
      }, i * 0.15);
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
```

- [ ] **Step 2: Add MetricsTicker CSS to globals.css**

```css
.metrics-ticker {
  position: relative;
  width: 100%;
  overflow: hidden;
  padding: clamp(40px, 5vw, 70px) 0;
  border-bottom: 1px solid var(--line);
  background: var(--bg);
}
.metrics-ticker-track {
  display: flex;
  gap: 24px;
  padding: 0 clamp(24px, 7vw, 112px);
  will-change: transform;
}
.metric-card {
  flex: 0 0 auto;
  min-width: 200px;
  padding: 24px 32px;
}
.metric-number {
  font: 500 clamp(28px, 2vw, 40px)/1 var(--sans);
  color: var(--text);
  letter-spacing: -0.04em;
}
.metric-label {
  margin-top: 8px;
  font: 500 9px var(--mono);
  color: var(--dim);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
@media (max-width: 680px) {
  .metrics-ticker-track {
    flex-direction: column;
    gap: 16px;
    padding: 0 20px;
  }
  .metric-card { min-width: 0; width: 100%; }
}
```

- [ ] **Step 3: Replace metrics section in page.tsx**

Replace the `<section className="section impact-metrics">` block with `<MetricsTicker />`. Import MetricsTicker.

- [ ] **Step 4: Commit**

```bash
git add app/components/MetricsTicker.tsx app/globals.css app/page.tsx
git commit -m "feat: add horizontal metrics ticker with count-up animation"
```

---

### Task 4: Experience Section Redesign (Editorial Timeline)

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: existing experience data array
- Produces: Editorial timeline layout with glass panels, vertical line, glowing dot

- [ ] **Step 1: Replace experience CSS in globals.css**

Replace the `.experience`, `.experience-list`, `.experience-item`, `.experience-main` styles with:

```css
.experience {
  background: #080a09;
}
.experience-list {
  width: 100%;
}
.experience-item {
  display: grid;
  grid-template-columns: minmax(160px, 0.25fr) minmax(0, 0.75fr);
  gap: 4vw;
  padding: 44px 0;
  border-top: 1px solid var(--line);
  position: relative;
}
.experience-item:last-child {
  border-bottom: 1px solid var(--line);
}
.experience-main {
  max-width: 980px;
  padding: 32px;
  background: var(--surface-glass);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: border-color 0.4s ease, box-shadow 0.4s ease;
}
.experience-main:hover {
  border-color: var(--glass-border-hover);
  box-shadow: 0 0 30px var(--glow);
}
.period, .company, .stack {
  margin: 0;
  font: 500 9px var(--mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.period { color: var(--dim); }
.company { color: var(--accent); margin-bottom: 8px; }
.experience-main h3 {
  margin: 11px 0 14px;
  font-size: clamp(26px, 2.5vw, 39px);
  line-height: 1.06;
  letter-spacing: -0.032em;
  font-weight: 500;
}
.experience-summary {
  max-width: 720px;
  margin: 0;
  color: #b0b6b1;
  font-size: 17px;
  line-height: 1.65;
}
.experience-main ul {
  max-width: 780px;
  margin: 28px 0;
  padding: 0;
  list-style: none;
}
.experience-main li {
  position: relative;
  margin-top: 12px;
  padding-left: 21px;
  color: var(--muted);
  line-height: 1.65;
}
.experience-main li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.7em;
  width: 5px;
  height: 1px;
  background: var(--accent);
}
.stack { color: var(--dim); margin-top: 16px; }
@media (max-width: 680px) {
  .experience-item {
    grid-template-columns: 1fr;
    gap: 17px;
    padding: 38px 0;
  }
  .experience-main { padding: 24px; }
  .experience-main h3 { font-size: 28px; }
  .experience-summary { font-size: 15px; }
  .experience-main li { font-size: 14px; }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: redesign experience section with editorial glass timeline"
```

---

### Task 5: Scale Section Redesign (Showcase Cards)

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: existing productionSurfaces data array
- Produces: Full-width showcase cards with unique gradients and overlap

- [ ] **Step 1: Replace scale CSS in globals.css**

Replace `.scale`, `.scale-heading`, `.scale-context`, `.scale-label`, `.scale-statement`, `.service-grid` styles with:

```css
.scale {
  position: relative;
  padding: clamp(90px, 9vw, 145px) clamp(24px, 7vw, 112px);
  border-bottom: 1px solid var(--line);
  background: #080b0a;
}
.scale-heading h2 em {
  color: var(--accent);
  font-style: normal;
}
.scale-context {
  margin: 0 0 clamp(55px, 6vw, 90px) 13%;
  display: grid;
  grid-template-columns: 0.34fr 1fr;
  gap: 5vw;
  align-items: start;
}
.scale-label {
  margin: 8px 0 0;
  color: var(--accent);
  font: 500 9px var(--mono);
  letter-spacing: 0.1em;
}
.scale-statement {
  max-width: 900px;
  margin: 0;
  color: #c8cec9;
  font-size: clamp(24px, 2.4vw, 38px);
  line-height: 1.35;
  letter-spacing: -0.035em;
}
.scale-statement em {
  color: var(--accent);
  font-style: normal;
}
.scale-showcase {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.scale-showcase-card {
  position: relative;
  display: grid;
  grid-template-columns: 0.3fr 0.7fr;
  gap: 4vw;
  padding: clamp(32px, 4vw, 56px);
  background: var(--surface-glass);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  margin-top: -40px;
  overflow: hidden;
  transition: border-color 0.4s ease, box-shadow 0.4s ease;
}
.scale-showcase-card:first-child {
  margin-top: 0;
}
.scale-showcase-card:hover {
  border-color: var(--glass-border-hover);
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.scale-showcase-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 16px;
  pointer-events: none;
}
.scale-showcase-card:nth-child(1)::before { background: linear-gradient(135deg, rgba(113,245,212,0.08), transparent 60%); }
.scale-showcase-card:nth-child(2)::before { background: linear-gradient(135deg, rgba(232,168,56,0.06), transparent 60%); }
.scale-showcase-card:nth-child(3)::before { background: linear-gradient(135deg, rgba(80,180,255,0.06), transparent 60%); }
.scale-showcase-card:nth-child(4)::before { background: linear-gradient(135deg, rgba(200,80,120,0.05), transparent 60%); }
.scale-showcase-index {
  font: 500 clamp(48px, 5vw, 80px)/1 var(--sans);
  color: var(--dim);
  letter-spacing: -0.04em;
  opacity: 0.3;
}
.scale-showcase-content h3 {
  margin: 0 0 16px;
  font-size: clamp(24px, 2.5vw, 36px);
  line-height: 1.1;
  letter-spacing: -0.03em;
  font-weight: 500;
}
.scale-showcase-content p {
  margin: 0;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.65;
}
.scale-showcase-signal {
  margin-top: 20px;
  font: 500 8px var(--mono);
  color: var(--accent);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
@media (max-width: 680px) {
  .scale-context { display: block; margin-left: 0; margin-bottom: 50px; }
  .scale-label { margin-bottom: 24px; }
  .scale-statement { font-size: 24px; }
  .scale-showcase-card {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-top: -20px;
    padding: 24px;
  }
  .scale-showcase-card:first-child { margin-top: 0; }
  .scale-showcase-index { font-size: 36px; }
}
```

- [ ] **Step 2: Update scale section HTML in page.tsx**

Replace the `.service-grid` div with `.scale-showcase` and wrap each article in `.scale-showcase-card`:

```tsx
<div className="scale-showcase">
  {productionSurfaces.map((surface) => (
    <article className="scale-showcase-card reveal" key={surface.index}>
      <div className="scale-showcase-index">{surface.index}</div>
      <div className="scale-showcase-content">
        <h3>{surface.title}</h3>
        <p>{surface.description}</p>
        <div className="scale-showcase-signal">{surface.signal}</div>
      </div>
    </article>
  ))}
</div>
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css app/page.tsx
git commit -m "feat: redesign scale section with showcase cards"
```

---

### Task 6: SkillConstellation Component

**Files:**
- Create: `app/components/SkillConstellation.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: capabilities data array from page.tsx
- Produces: Floating skill tags with category colors and GSAP fly-in

- [ ] **Step 1: Create SkillConstellation component**

```tsx
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

// Predefined positions for a natural cloud layout
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

export default function SkillConstellation({ capabilities }: { capabilities: any[] }) {
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

  // Flatten capabilities into individual skill tags
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
```

- [ ] **Step 2: Add SkillConstellation CSS to globals.css**

```css
.skills-constellation {
  position: relative;
  width: 100%;
  min-height: 400px;
}
.skill-tag {
  position: absolute;
  padding: 6px 14px;
  background: var(--surface-glass);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font: 500 12px var(--mono);
  color: var(--muted);
  letter-spacing: 0.04em;
  white-space: nowrap;
  transition: border-color 0.3s ease, color 0.3s ease;
}
.skill-tag:hover {
  border-color: var(--glass-border-hover);
  color: var(--text);
}
@media (max-width: 680px) {
  .skills-constellation {
    position: static;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    min-height: auto;
  }
  .skill-tag {
    position: static;
  }
}
```

- [ ] **Step 3: Update skills section in page.tsx**

Replace the `.capabilities` grid with `<SkillConstellation capabilities={capabilities} />`. Import SkillConstellation.

- [ ] **Step 4: Commit**

```bash
git add app/components/SkillConstellation.tsx app/globals.css app/page.tsx
git commit -m "feat: add skill constellation with category colors and fly-in"
```

---

### Task 7: Contact Section Redesign (Magnetic Cursor + Word Reveal)

**Files:**
- Modify: `app/globals.css`
- Modify: `app/components/CustomCursor.tsx`

**Interfaces:**
- Consumes: existing contact section HTML
- Produces: Magnetic email link, word-by-word text reveal, glass social pills

- [ ] **Step 1: Update contact CSS in globals.css**

Replace `.contact` styles:

```css
.contact {
  min-height: 78vh;
  padding: clamp(100px, 10vw, 160px) clamp(24px, 7vw, 112px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  background: radial-gradient(circle at 75% 48%, rgba(113,245,212,.06), transparent 26%), #090b0a;
}
.contact h2 {
  max-width: 900px;
  margin-top: 30px;
  font-size: clamp(56px, 7vw, 112px);
}
.contact > p:nth-of-type(2) {
  max-width: 520px;
  margin: 35px 0 0;
  color: var(--muted);
  font-size: 18px;
  line-height: 1.65;
}
.contact-email {
  width: max-content;
  margin-top: 55px;
  display: flex;
  align-items: center;
  gap: 80px;
  padding: 0 3px 10px;
  border-bottom: 1px solid var(--accent);
  font-size: clamp(25px, 3vw, 45px);
  letter-spacing: -0.03em;
  transition: color 280ms ease, text-shadow 280ms ease, gap 280ms ease;
  will-change: transform;
}
.contact-email:hover {
  color: var(--accent);
  gap: 94px;
  text-shadow: 0 0 28px rgba(113,245,212,.22);
}
.contact-email span {
  color: var(--accent);
}
.contact-links {
  margin-top: 40px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.contact-links a {
  padding: 8px 16px;
  background: var(--surface-glass);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: var(--muted);
  font: 500 10px var(--mono);
  letter-spacing: 0.06em;
  transition: border-color 0.3s ease, color 0.3s ease;
}
.contact-links a:hover {
  border-color: var(--glass-border-hover);
  color: var(--text);
}
```

- [ ] **Step 2: Add magnetic cursor logic to CustomCursor.tsx**

Add to the `handleMouseMove` function:

```tsx
// Magnetic effect for contact email
const emailLink = document.querySelector(".contact-email") as HTMLElement;
if (emailLink) {
  const rect = emailLink.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const deltaX = e.clientX - centerX;
  const deltaY = e.clientY - centerY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  if (distance < 100) {
    const strength = 1 - distance / 100;
    emailLink.style.transform = `translate(${deltaX * strength * 0.3}px, ${deltaY * strength * 0.3}px)`;
  } else {
    emailLink.style.transform = "";
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css app/components/CustomCursor.tsx
git commit -m "feat: add magnetic cursor effect and contact glass pills"
```

---

### Task 8: HorizontalProjects Enhancement (Mockup Zone + 3D Tilt)

**Files:**
- Modify: `app/components/HorizontalProjects.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: existing projects data array
- Produces: Cards with mockup zones, 3D tilt on mousemove, scroll indicator dots

- [ ] **Step 1: Add mockup zone and scroll dots to HorizontalProjects.tsx**

Update the card JSX to include a mockup zone div:

```tsx
<div className="card-mockup" aria-hidden="true" />
```

Add scroll dots after the scroll wrapper:

```tsx
<div className="project-dots" aria-hidden="true">
  {projects.map((_, i) => (
    <div className={`project-dot ${i === 0 ? 'active' : ''}`} key={i} />
  ))}
</div>
```

- [ ] **Step 2: Add 3D tilt effect**

Add mousemove handler to each card:

```tsx
const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  card.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-10px)`;
};

const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.currentTarget.style.transform = "";
};
```

- [ ] **Step 3: Add mockup zone and dots CSS to globals.css**

```css
.card-mockup {
  width: 100%;
  height: 40%;
  min-height: 120px;
  background: linear-gradient(135deg, rgba(113,245,212,0.05), rgba(232,168,56,0.03));
  border-radius: 8px;
  border: 1px solid var(--soft-line);
  position: relative;
  overflow: hidden;
  margin-bottom: 24px;
}
.card-mockup::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 20px 20px;
}
.project-dots {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 24px;
}
.project-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dim);
  transition: background 0.3s ease, box-shadow 0.3s ease;
}
.project-dot.active {
  background: var(--accent);
  box-shadow: 0 0 10px var(--glow);
}
```

- [ ] **Step 4: Commit**

```bash
git add app/components/HorizontalProjects.tsx app/globals.css
git commit -m "feat: add mockup zones and 3D tilt to project cards"
```

---

### Task 9: CoreScene Scroll Transitions

**Files:**
- Modify: `app/components/CoreScene.tsx`

**Interfaces:**
- Consumes: `scrollProgress` prop (0-1)
- Produces: 3D core that sharpens (blur 60→0), scales down, slides off on scroll

- [ ] **Step 1: Update CoreScene.tsx**

Replace the `AmbientFluid` component's `useFrame`:

```tsx
useFrame((state, delta) => {
  if (!meshRef.current || !materialRef.current) return;
  
  // Slow, fluid rotation
  meshRef.current.rotation.x += delta * 0.05;
  meshRef.current.rotation.y += delta * 0.08;
  meshRef.current.rotation.z += delta * 0.03;

  // React to scroll: sharpen, scale down, slide off
  meshRef.current.position.y = THREE.MathUtils.lerp(0, 5, scrollProgress);
  meshRef.current.scale.setScalar(THREE.MathUtils.lerp(0.5, 0.3, scrollProgress));
  materialRef.current.opacity = THREE.MathUtils.lerp(0.4, 0.05, scrollProgress);
});
```

Update the container's filter based on scrollProgress:

```tsx
<div className="webgl-layer" aria-hidden="true" style={{ filter: `blur(${60 - scrollProgress * 60}px)` }}>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/CoreScene.tsx
git commit -m "feat: add scroll-linked blur and scale transitions to 3D core"
```

---

### Task 10: useScrollAnimation Enhancement (reveal-text support)

**Files:**
- Modify: `app/hooks/useScrollAnimation.ts`

**Interfaces:**
- Consumes: existing hook interface
- Produces: Support for `.reveal-text` character-by-character animation

- [ ] **Step 1: Add reveal-text handling to useScrollAnimation**

Add to the `useEffect` after the existing reveal logic:

```tsx
// Character-by-character reveals
const textReveals = el.querySelectorAll(".reveal-text");
if (textReveals.length > 0) {
  textReveals.forEach(heading => {
    const text = heading.textContent || "";
    heading.innerHTML = text.split("").map(char =>
      `<span class="char">${char === " " ? "&nbsp;" : char}</span>`
    ).join("");
    
    gsap.fromTo(heading.querySelectorAll(".char"),
      { x: -20, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.4,
        ease: "power2.out",
        stagger: 0.02,
        scrollTrigger: {
          trigger: heading,
          start: "top 80%",
          once: true,
        },
      }
    );
  });
}
```

- [ ] **Step 2: Add `.reveal-text` class to section headings in page.tsx**

Update section headings to use `reveal-text` class:

```tsx
<h2 className="reveal-text">Work that reached<br />production.</h2>
<h2 className="reveal-text">Engineering inside<br /><em>high-traffic systems.</em></h2>
<h2 className="reveal-text">Strong foundations.<br />Production range.</h2>
```

- [ ] **Step 3: Commit**

```bash
git add app/hooks/useScrollAnimation.ts app/page.tsx
git commit -m "feat: add character-by-character text reveal animation"
```

---

### Task 11: Aurora Scroll-Linked Background

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: scroll position
- Produces: CSS variables `--aurora-x` and `--aurora-y` that shift aurora gradient

- [ ] **Step 1: Add aurora scroll listener to page.tsx**

Add to the existing scroll handler in `useEffect`:

```tsx
useEffect(() => {
  const handleScroll = () => {
    const scrolled = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? scrolled / maxScroll : 0;
    
    // Shift aurora position
    document.documentElement.style.setProperty('--aurora-x', `${progress * 30}%`);
    document.documentElement.style.setProperty('--aurora-y', `${progress * 20}%`);
    
    // Existing scroll progress for 3D scene
    const hero = document.getElementById("top");
    if (hero) {
      const rect = hero.getBoundingClientRect();
      const heroProgress = Math.min(1, Math.max(0, -rect.top / rect.height));
      setScrollProgress(heroProgress);
    }
  };
  
  addEventListener("scroll", handleScroll, { passive: true });
  return () => removeEventListener("scroll", handleScroll);
}, []);
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add scroll-linked aurora gradient position"
```

---

### Task 12: Update useScrollAnimation Dependencies

**Files:**
- Modify: `app/hooks/useScrollAnimation.ts`

**Interfaces:**
- Consumes: existing hook
- Produces: Fix dependency array to include all used options

- [ ] **Step 1: Fix the useEffect dependency array**

The current dependency array only includes some options. Update to include the textReveals logic properly. Since we're now using `el` directly (not ref), the dependency should be `[ref]`:

```tsx
export function useScrollAnimation(
  ref: RefObject<HTMLElement | null>,
  options: AnimationOptions = {}
) {
  useEffect(() => {
    // ... existing logic using ref.current
  }, [ref]); // Simplified - only depend on ref
}
```

- [ ] **Step 2: Commit**

```bash
git add app/hooks/useScrollAnimation.ts
git commit -m "fix: simplify useScrollAnimation dependency array"
```

---

## Verification

After all tasks are complete:

1. Run `npm run build` — must pass
2. Run `npm run lint` — must pass
3. Run `npm run test` — must pass
4. Visual QA: Check each section has unique visual identity
5. Reduced motion: Toggle `prefers-reduced-motion` — all animations must be instant
6. Keyboard: Tab through entire page — focus outlines visible
7. Mobile: Check responsive layout at 375px and 768px

## Summary

| Task | Component | Lines Changed |
|---|---|---|
| 1 | CSS tokens + glass panel | ~40 |
| 2 | ScrollProgress | ~60 |
| 3 | MetricsTicker | ~100 |
| 4 | Experience CSS | ~80 |
| 5 | Scale showcase | ~90 |
| 6 | SkillConstellation | ~120 |
| 7 | Contact + magnetic cursor | ~70 |
| 8 | HorizontalProjects enhancement | ~80 |
| 9 | CoreScene scroll transitions | ~20 |
| 10 | useScrollAnimation reveal-text | ~30 |
| 11 | Aurora scroll-linked | ~15 |
| 12 | Dependency fix | ~5 |
| **Total** | | **~710 lines** |
