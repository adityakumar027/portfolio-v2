# Portfolio Scroll Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate GSAP ScrollTrigger, kinetic typography, scroll-linked 3D scene, and custom cursor on the existing portfolio — no structural rewrite, no new dependencies.

**Architecture:** Register GSAP + ScrollTrigger once in page.tsx, create a reusable `useScrollAnimation` hook for section reveals, wrap hero headline words in `<span>` elements for GSAP kinetic type, add `scrollProgress` state to drive the 3D CoreScene, and add a Framer Motion custom cursor. All animations respect `prefers-reduced-motion`.

**Tech Stack:** GSAP 3.15 (ScrollTrigger), Framer Motion 13, Three.js/R3F (existing), React 19, Tailwind CSS 4, Geist Sans+Mono

## Global Constraints

- No new npm packages — GSAP, Framer Motion, Three.js already installed
- No new fonts — Geist Sans + Mono are sufficient
- No new images or 3D models
- No new routes — single page, no routing changes
- All animations use `transform` only (zero CLS)
- `prefers-reduced-motion: reduce` → skip all GSAP animations, hide 3D scene, show fallback
- Desktop only for custom cursor (>980px AND hover-capable)
- Tests: `npm run test` (vinext build + rendered HTML assertions)
- Lint: `npm run lint` (ESLint 9 flat config)

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `app/hooks/useScrollAnimation.ts` | **Create** | Reusable hook: registers GSAP ScrollTrigger, returns cleanup, respects reduced motion |
| `app/components/CustomCursor.tsx` | **Create** | Framer Motion cursor: follows mouse, scales on hover, hidden on mobile |
| `app/page.tsx` | **Modify** | Add GSAP registration, section refs, `.reveal` classes, kinetic typography wrapping, scrollProgress state, custom cursor import |
| `app/globals.css` | **Modify** | Add `.reveal` base styles, `.section-reveal-glow`, custom cursor CSS, refined project hover |
| `app/components/CoreScene.tsx` | **Modify** | Accept `scrollProgress` prop, drive scale/position/rotation/opacity in `useFrame` |

---

### Task 1: GSAP Foundation + useScrollAnimation Hook

**Files:**
- Create: `app/hooks/useScrollAnimation.ts`
- Modify: `app/page.tsx:1-6` (imports)

**Interfaces:**
- Consumes: `gsap`, `gsap/ScrollTrigger` (npm packages)
- Produces: `useScrollAnimation(ref, options)` hook — sets up ScrollTrigger for a given ref, returns cleanup function

- [ ] **Step 1: Create the hooks directory**

```bash
mkdir -p app/hooks
```

- [ ] **Step 2: Create useScrollAnimation hook**

```typescript
// app/hooks/useScrollAnimation.ts
"use client";

import { useEffect, RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type AnimationOptions = {
  selector?: string;
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  triggerStart?: string;
  stagger?: number;
  once?: boolean;
};

const defaultFrom = { y: 40, opacity: 0 };
const defaultTo = { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" };

export function useScrollAnimation(
  ref: RefObject<HTMLElement | null>,
  options: AnimationOptions = {}
) {
  useEffect(() => {
    const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const el = ref.current;
    if (!el) return;

    const {
      selector = ".reveal",
      from = defaultFrom,
      to = defaultTo,
      triggerStart = "top 80%",
      stagger = 0.1,
      once = true,
    } = options;

    const targets = el.querySelectorAll(selector);
    if (targets.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(targets, from, {
        ...to,
        stagger,
        scrollTrigger: {
          trigger: el,
          start: triggerStart,
          once,
        },
      });
    });

    return () => ctx.revert();
  }, [ref, options.selector, options.triggerStart, options.stagger, options.once]);
}
```

- [ ] **Step 3: Verify hook compiles**

Run: `npx tsc --noEmit app/hooks/useScrollAnimation.ts 2>&1 || true`
Expected: No TypeScript errors related to the hook (some env errors are OK)

- [ ] **Step 4: Commit**

```bash
git add app/hooks/useScrollAnimation.ts
git commit -m "feat: add useScrollAnimation hook with GSAP ScrollTrigger"
```

---

### Task 2: CSS Reveal Base Styles + Section Glow

**Files:**
- Modify: `app/globals.css:179` (before `:focus-visible`)

**Interfaces:**
- Consumes: CSS custom properties from `:root` (`--accent`, `--glow`)
- Produces: `.reveal` base class, `.section-reveal-glow` utility, custom cursor styles

- [ ] **Step 1: Add reveal base styles + custom cursor CSS**

Insert before the `:focus-visible` rule (line 179):

```css
/* Scroll reveal base — elements start invisible, GSAP animates them in */
.reveal { opacity: 0; transform: translateY(40px); }

/* Glow overlay applied on scroll-enter */
.section-reveal-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(ellipse at center, rgba(113,245,212,0.15), transparent 70%);
  transition: opacity 600ms ease;
}
.section-reveal-glow.is-visible { opacity: 1; }

/* Custom cursor — desktop only */
.custom-cursor {
  position: fixed;
  z-index: 9999;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  mix-blend-mode: difference;
  pointer-events: none;
}
@media (max-width: 980px), (hover: none) {
  .custom-cursor { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .custom-cursor { transition: none; }
}
```

- [ ] **Step 2: Refine project hover**

Replace the existing `.project:hover` rule (line 104) to add `scale(1.02)`:

```css
.project:hover { border-color: rgba(113,245,212,.42); transform: translateY(-5px) scale(1.02); box-shadow: 0 20px 70px rgba(0,0,0,.28); }
```

- [ ] **Step 3: Verify CSS parses**

Run: `npm run build 2>&1 | tail -5`
Expected: Build completes without CSS errors

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat: add reveal base styles, glow overlay, custom cursor CSS, refined project hover"
```

---

### Task 3: Section Scroll Reveals + GSAP Registration

**Files:**
- Modify: `app/page.tsx:1-6` (imports)
- Modify: `app/page.tsx:155-333` (component body — add refs, `.reveal` classes, useEffect)

**Interfaces:**
- Consumes: `useScrollAnimation` hook from Task 1
- Produces: All sections animate on scroll via ScrollTrigger

- [ ] **Step 1: Update imports in page.tsx**

Replace the existing imports (lines 1-6):

```tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useScrollAnimation } from "./hooks/useScrollAnimation";

const CoreScene = dynamic(() => import("./components/CoreScene"), { ssr: false });
```

- [ ] **Step 2: Add refs and scroll animation setup in Home component**

Replace the `Home` function body. Add refs for each section, wire up `useScrollAnimation`, and add `.reveal` classes to section headings and key elements.

```tsx
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  const experienceRef = useRef<HTMLElement>(null);
  const scaleRef = useRef<HTMLElement>(null);
  const workRef = useRef<HTMLElement>(null);
  const skillsRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);

  useScrollAnimation(experienceRef, { stagger: 0.12 });
  useScrollAnimation(scaleRef, { stagger: 0.1 });
  useScrollAnimation(workRef, { selector: ".project", stagger: 0.15 });
  useScrollAnimation(skillsRef, { selector: ".capabilities article", stagger: 0.08 });
  useScrollAnimation(contactRef);

  return (
    <>
      {/* ... keep all existing JSX exactly as-is, but add refs and .reveal classes ... */}
    </>
  );
}
```

- [ ] **Step 3: Add refs to section elements**

In the JSX, add `ref` to each section and `.reveal` class to animatable children:

- `<section className="section experience" id="experience">` → add `ref={experienceRef}`
- `<section className="section scale" id="scale">` → add `ref={scaleRef}`
- `<section className="section work" id="work">` → add `ref={workRef}`
- `<section className="section about" id="skills">` → add `ref={skillsRef}`
- `<section className="contact" id="contact">` → add `ref={contactRef}`

Add `.reveal` class to section headings and key content:
- Each `.section-heading` → add `className="section-heading reveal"`
- Each `.experience-item` → add `className="experience-item reveal"`
- Each `.service-grid article` → add `className="reveal"`
- Each `.project` → add `className="project reveal"`
- Each `.capabilities article` → add existing class + `reveal`
- `.contact h2` → wrap in a div with `className="reveal"`
- `.contact-email` → add `className="contact-email reveal"`

- [ ] **Step 4: Verify build passes**

Run: `npm run build 2>&1 | tail -10`
Expected: Build completes successfully

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add section scroll reveals with GSAP ScrollTrigger"
```

---

### Task 4: Kinetic Typography on Hero Headline

**Files:**
- Modify: `app/page.tsx:195` (hero h1)
- Modify: `app/page.tsx:155-170` (add GSAP kinetic type useEffect)

**Interfaces:**
- Consumes: `gsap` (already imported in Task 1)
- Produces: Hero headline words animate in with staggered slide-up on page load

- [ ] **Step 1: Wrap hero headline words in spans**

Replace the hero `<h1>` (line 195):

```tsx
<h1 className="hero-headline">
  <span className="word-wrap"><span className="word">I</span></span>{' '}
  <span className="word-wrap"><span className="word">build</span></span>{' '}
  <span className="word-wrap"><span className="word">systems</span></span>
  <br />
  <span className="word-wrap"><span className="word">that</span></span>{' '}
  <span className="word-wrap"><span className="word"><em>scale</em></span></span>{' '}
  <span className="word-wrap"><span className="word"><em>&amp;</em></span></span>{' '}
  <span className="word-wrap"><span className="word"><em>heal.</em></span></span>
</h1>
```

- [ ] **Step 2: Add kinetic type useEffect**

After the `useScrollAnimation` calls in the Home component, add:

```tsx
useEffect(() => {
  const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const wraps = document.querySelectorAll(".hero-headline .word-wrap");
  const words = document.querySelectorAll(".hero-headline .word");
  if (wraps.length === 0) return;

  // Set initial state: hide overflow on wrappers, push words down
  gsap.set(wraps, { overflow: "hidden", display: "inline-block" });
  gsap.set(words, { y: "100%", opacity: 0 });

  // Animate words sliding up
  gsap.to(words, {
    y: "0%",
    opacity: 1,
    duration: 0.8,
    ease: "power4.out",
    stagger: 0.06,
    delay: 0.3,
  });

  // Accent flash on em words after entrance
  const emWords = document.querySelectorAll(".hero-headline em");
  if (emWords.length > 0) {
    gsap.to(emWords, {
      color: "#ffffff",
      duration: 0.15,
      delay: 1.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
    });
  }
}, []);
```

- [ ] **Step 3: Add word-wrap CSS**

Add to `globals.css` (after the reveal styles from Task 2):

```css
/* Kinetic typography word wrappers */
.hero-headline .word-wrap {
  display: inline-block;
  overflow: hidden;
  vertical-align: bottom;
}
.hero-headline .word {
  display: inline-block;
}
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build 2>&1 | tail -5`
Expected: Build completes

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/globals.css
git commit -m "feat: add kinetic typography on hero headline with GSAP"
```

---

### Task 5: Scroll-Linked 3D Scene

**Files:**
- Modify: `app/page.tsx:155-170` (add scrollProgress state + scroll listener)
- Modify: `app/page.tsx:163` (pass scrollProgress to CoreScene)
- Modify: `app/components/CoreScene.tsx:167-205` (accept prop, use in useFrame)

**Interfaces:**
- Consumes: `scrollProgress` (number 0–1) from page.tsx
- Produces: CoreScene scales down, shifts right, rotates faster, fades particles/bloom as user scrolls

- [ ] **Step 1: Add scrollProgress state to page.tsx**

Add after the existing state declarations:

```tsx
const [scrollProgress, setScrollProgress] = useState(0);
```

- [ ] **Step 2: Add scroll listener useEffect**

```tsx
useEffect(() => {
  const handleScroll = () => {
    const hero = document.getElementById("top");
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / rect.height));
    setScrollProgress(progress);
  };
  addEventListener("scroll", handleScroll, { passive: true });
  return () => removeEventListener("scroll", handleScroll);
}, []);
```

- [ ] **Step 3: Pass scrollProgress to CoreScene**

Update the CoreScene usage (line 163):

```tsx
<CoreScene scrollProgress={scrollProgress} />
```

- [ ] **Step 4: Update CoreScene to accept and use scrollProgress**

Update the `CoreScene` component signature and the `Scene`/`Core` components:

```tsx
// CoreScene.tsx — update CoreScene export
export default function CoreScene({ scrollProgress = 0 }: { scrollProgress?: number }) {
  // ... existing code ...
  return (
    <>
      {/* ... existing JSX ... */}
      <div className="webgl-layer" aria-hidden="true">
        <Canvas /* ... existing props ... */>
          <Suspense fallback={null}><Scene pointer={pointer} scrollProgress={scrollProgress} /></Suspense>
        </Canvas>
      </div>
    </>
  );
}
```

Update `Scene` to pass `scrollProgress` to `Core`:

```tsx
function Scene({ pointer, scrollProgress }: { pointer: PointerState; scrollProgress: number }) {
  // ... existing lights ...
  <Core pointer={pointer} scrollProgress={scrollProgress} />
  {/* ... existing particles, EffectComposer ... */}
}
```

Update `Core` to use `scrollProgress` in `useFrame`:

```tsx
function Core({ pointer, scrollProgress }: { pointer: PointerState; scrollProgress: number }) {
  // ... existing refs ...

  useFrame((state, delta) => {
    // ... existing pointer/hover logic ...

    // Scroll-linked transforms
    const sp = scrollProgress;
    const targetX = THREE.MathUtils.lerp(2.82, 4.5, sp);
    const targetScaleVal = THREE.MathUtils.lerp(0.84, 0.6, sp);

    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, targetX, 0.08);
    targetScale.setScalar(targetScaleVal);
    group.current.scale.lerp(targetScale, 1 - Math.exp(-delta * 5));

    // Faster rotation on scroll
    body.current.rotation.y += delta * (0.045 + sp * 0.06);
    shell.current.rotation.y += delta * (0.06 + sp * 0.06);

    // ... rest of existing logic ...
  });
}
```

Update `Particles` to accept and use `scrollProgress`:

```tsx
function Particles({ scrollProgress }: { scrollProgress: number }) {
  // ... existing code ...
  useFrame((_, delta) => {
    if (points.current) {
      points.current.rotation.y += delta * 0.004;
      points.current.material.opacity = THREE.MathUtils.lerp(0.22, 0.05, scrollProgress);
    }
  });
  // ...
}
```

Update `Scene` to pass `scrollProgress` to `Particles`:

```tsx
<Particles scrollProgress={scrollProgress} />
```

Update `EffectComposer` bloom intensity based on scroll:

```tsx
// In Scene, use a ref for bloom
const bloomRef = useRef<any>(null);
useEffect(() => {
  if (bloomRef.current) {
    bloomRef.current.intensity = THREE.MathUtils.lerp(0.38, 0.1, scrollProgress);
  }
}, [scrollProgress]);
```

- [ ] **Step 5: Verify build passes**

Run: `npm run build 2>&1 | tail -5`
Expected: Build completes

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/components/CoreScene.tsx
git commit -m "feat: add scroll-linked 3D scene transforms"
```

---

### Task 6: Custom Cursor

**Files:**
- Create: `app/components/CustomCursor.tsx`
- Modify: `app/page.tsx:1-6` (import)
- Modify: `app/page.tsx:161-333` (render CustomCursor)

**Interfaces:**
- Consumes: `framer-motion` (npm package), `mousemove` events
- Produces: A `position: fixed` div that follows the mouse with spring physics, scales on hover

- [ ] **Step 1: Create CustomCursor component**

```tsx
// app/components/CustomCursor.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function CustomCursor() {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, .project, .capabilities article, .primary-action, .contact-email")) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, .project, .capabilities article, .primary-action, .contact-email")) {
        setIsHovering(false);
      }
    };

    addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  return (
    <motion.div
      className="custom-cursor"
      animate={{
        x: mouseX - 4,
        y: mouseY - 4,
        scale: isHovering ? 3 : 1,
        opacity: isHovering ? 1 : 0.6,
      }}
      transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.5 }}
    />
  );
}
```

- [ ] **Step 2: Import and render in page.tsx**

Add import at the top:

```tsx
import CustomCursor from "./components/CustomCursor";
```

Add at the end of the return JSX (before the closing `</>`):

```tsx
<CustomCursor />
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build 2>&1 | tail -5`
Expected: Build completes

- [ ] **Step 4: Commit**

```bash
git add app/components/CustomCursor.tsx app/page.tsx
git commit -m "feat: add custom cursor with Framer Motion spring animation"
```

---

### Task 7: Framer Motion Menu Animation

**Files:**
- Modify: `app/page.tsx:171-182` (nav menu)
- Modify: `app/globals.css:189-190` (nav-links mobile styles)

**Interfaces:**
- Consumes: `framer-motion` `AnimatePresence` and `motion`
- Produces: Menu open/close transitions with Framer Motion instead of CSS display toggle

- [ ] **Step 1: Replace nav-links with Framer Motion AnimatePresence**

Update the nav section in page.tsx:

```tsx
import { AnimatePresence, motion } from "framer-motion";

// In the return JSX, replace the nav block:
<nav aria-label="Primary navigation">
  <AnimatePresence>
    {menuOpen && (
      <motion.div
        className="nav-links is-open"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <a href="#experience" onClick={closeMenu}>Experience</a>
        <a href="#scale" onClick={closeMenu}>Scale</a>
        <a href="#work" onClick={closeMenu}>Work</a>
        <a href="#skills" onClick={closeMenu}>Skills</a>
        <a href="#contact" onClick={closeMenu}>Contact</a>
      </motion.div>
    )}
  </AnimatePresence>
</nav>
```

- [ ] **Step 2: Update CSS for desktop nav**

On desktop (>980px), the nav-links should always be visible regardless of AnimatePresence. Add to the media query:

```css
@media (min-width: 981px) {
  .nav-links { display: flex !important; }
}
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build 2>&1 | tail -5`
Expected: Build completes

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/globals.css
git commit -m "feat: add Framer Motion menu animation with AnimatePresence"
```

---

### Task 8: Build + Lint + Test Verification

**Files:** None (verification only)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Confirmed passing build, lint, and tests

- [ ] **Step 1: Run build**

Run: `npm run build`
Expected: Build completes successfully

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors (warnings are OK)

- [ ] **Step 3: Run tests**

Run: `npm run test`
Expected: All tests pass (this runs build + rendered HTML assertions)

- [ ] **Step 4: Verify no regressions in test assertions**

The tests check for:
- `<title>Aditya Kumar — AI &amp; Backend Software Engineer</title>` ✓
- `I build systems` ✓ (still present in kinetic typography JSX)
- `scale &amp; heal` ✓ (still present in `<em>` tags)
- `Work that reached` ✓
- `Automated Job Application System` ✓
- Resume PDF link ✓
- `aria-label="Primary navigation"` ✓
- No codex preview text ✓
- `prefers-reduced-motion` in CSS ✓
- `.core-fallback` in CSS ✓

- [ ] **Step 5: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address lint/test issues from scroll animation integration"
```

---

## Verification Checklist

After all tasks, confirm:

- [ ] Every section animates on scroll (not all at once on load)
- [ ] The 3D core responds to scroll position (not just mouse)
- [ ] The hero headline enters with kinetic typography (word-by-word slide-up)
- [ ] Custom cursor works on desktop, disappears on mobile
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Build, lint, and tests all pass
- [ ] No new dependencies added
- [ ] The site still feels like "a quiet machine" — alive, not noisy
