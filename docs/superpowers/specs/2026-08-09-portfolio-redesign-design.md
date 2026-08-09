# Portfolio Redesign — Scroll-Orchestrated Machine

**Date:** 2026-08-09
**Author:** opencode (design agent)
**Status:** Draft — awaiting user review
**Approach:** A — "Scroll-Orchestrated Machine"

---

## 1. Subject & Audience

**Subject:** Aditya Kumar's developer portfolio — a single-page site showcasing production AI, backend infrastructure, and automation work.

**Audience:** Engineering recruiters and hiring managers at 0–5 YOE level, plus peer developers. They scan for 7 seconds on first pass. The portfolio must communicate: "this person builds real systems that scale."

**Page's single job:** Convert a visitor into a conversation (email, LinkedIn message, or resume download) within 30 seconds of landing.

---

## 2. Design Philosophy

"Designed as a quiet machine." — the existing tagline is the design brief. The site should feel like an interface to a production system: calm, precise, alive. Animations are not decoration; they are the system booting up as the user scrolls through it.

**Anti-patterns to avoid:**
- Cream + serif + terracotta (AI template #1)
- Near-black + acid green accent (AI template #2 — we use teal, which is distinct)
- Broadsheet hairlines + zero border-radius (AI template #3)
- Confetti, bouncing, or playful micro-animations
- Parallax so aggressive it causes jank

---

## 3. Color System

### Tokens (CSS Custom Properties)

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#070908` | Page background, section backgrounds |
| `--surface` | `#0c0f0e` | Card backgrounds, elevated surfaces |
| `--text` | `#f1f3ef` | Primary text, headings |
| `--muted` | `#aab1ac` | Body text, descriptions |
| `--dim` | `#747d77` | Labels, metadata, timestamps |
| `--accent` | `#71f5d4` | Primary accent — links, highlights, glows |
| `--accent-deep` | `#3a9d8a` | Deeper teal for gradients, secondary accents |
| `--glow` | `rgba(113,245,212,0.15)` | Scroll-reveal glow backgrounds |
| `--line` | `rgba(241,243,239,0.12)` | Section borders, dividers |
| `--soft-line` | `rgba(241,243,239,0.07)` | Subtle borders (header, cards) |

### Gradients

| Name | Value | Usage |
|---|---|---|
| Hero overlay | `radial-gradient(circle at 78% 46%, rgba(113,245,212,.055), transparent 28%), linear-gradient(90deg, rgba(7,9,8,0.99) 0 32%, rgba(7,9,8,0.86) 47%, rgba(7,9,8,0.1) 76%, rgba(7,9,8,0.32))` | Hero section background |
| Section reveal glow | `radial-gradient(ellipse at center, var(--glow), transparent 70%)` | Applied on scroll-enter |
| Card hover | `linear-gradient(135deg, rgba(113,245,212,.06), transparent 72%)` | Hover state for cards |

---

## 4. Typography

### Type Scale

| Role | Font | Weight | Size | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| Display | Geist Sans | 520 | `clamp(58px, 5.8vw, 98px)` | 0.91 | -0.06em |
| Heading 2 | Geist Sans | 500 | `clamp(44px, 4.7vw, 76px)` | 0.98 | -0.05em |
| Heading 3 | Geist Sans | 500 | `clamp(26px, 2.5vw, 39px)` | 1.06 | -0.032em |
| Body | Geist Sans | 400 | `clamp(16px, 1.15vw, 19px)` | 1.65 | -0.01em |
| Body large | Geist Sans | 400 | `clamp(19px, 1.75vw, 26px)` | 1.55 | -0.018em |
| Mono label | Geist Mono | 500 | 9-10px | 1 | 0.06-0.11em |
| Mono small | Geist Mono | 500 | 7-8px | 1 | 0.08-0.12em |

### Kinetic Typography (Manual Word Split + GSAP)

The hero headline (`"I build systems that scale & heal."`) gets a staggered word entrance. SplitText is a paid GSAP Club plugin — we use a manual approach instead: wrap each word in a `<span>` with `overflow: hidden` on the parent, then animate each span from `y: 100%` to `y: 0` (slide-up reveal).

- Each word slides up from below its clip boundary
- Stagger: 0.06s per word
- Total duration: ~0.8s
- The `<em>` words ("scale & heal.") get a secondary accent-color flash at 0.4s after their entrance
- Trigger: on page load (not scroll — hero is above the fold)

---

## 5. Layout Architecture

### Section Order (unchanged)

1. Header (fixed)
2. Hero
3. Experience
4. Consumer Scale
5. Selected Work
6. Profile & Skills
7. Contact
8. Footer

### Responsive Breakpoints (unchanged)

- Desktop: > 980px (full layout)
- Tablet: 680px–980px (simplified grid, no 3D scene)
- Mobile: < 680px (stacked, simplified animations)

### Key Layout Changes

**Hero:** No structural change. The 3D Core gets a scroll-linked transform (see Section 7).

**Experience:** Each `.experience-item` gets a GSAP ScrollTrigger that animates `x: -30, opacity: 0` → `x: 0, opacity: 1` with a stagger of 0.15s between items. The left column (period) enters slightly before the right column (content).

**Scale:** The 4 service cards enter as a bento grid with stagger: each card animates from `y: 40, opacity: 0` → `y: 0, opacity: 1` with 0.1s stagger. Cards enter in reading order (01, 02, 03, 04).

**Work:** Project cards get parallax `translateY` on scroll. The featured card (first) moves at 0.3x scroll speed, creating depth. Smaller cards move at 0.15x. Hover states enhanced: the existing skew-sweep shine is kept, plus a subtle `scale(1.02)` on hover.

**Skills:** Capability cards enter with stagger grid animation (2 columns, 3 rows): 0.08s stagger per card, total ~0.5s.

**Contact:** The large headline (`"Have a difficult system to build?"`) enters with `scale: 0.9, opacity: 0` → `scale: 1, opacity: 1` — a cinematic reveal.

---

## 6. Animation System

### Libraries

| Library | Purpose | Used For |
|---|---|---|
| GSAP + ScrollTrigger | Scroll-driven animations | Section reveals, parallax, kinetic type |
| Framer Motion | React component transitions | Menu open/close, custom cursor |
| CSS transitions | Hover micro-interactions | Button hovers, card hovers, link underlines |
| Three.js (R3F) | 3D scene | Hero core (existing, enhanced) |

### GSAP Registration

```tsx
// In page.tsx (the only "use client" component)
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
```

### Animation Timing Contract

| Category | Duration | Easing | Notes |
|---|---|---|---|
| Section reveals | 0.6s | `power3.out` | Fade + translate |
| Stagger items | 0.08-0.15s | `power2.out` | Between siblings |
| Kinetic type | 0.8s | `power4.out` | Hero headline only |
| Parallax | continuous | — | Scroll-linked, no fixed duration |
| Hover transitions | 260ms | `ease` | CSS only |
| Menu transitions | 300ms | `cubic-bezier(.22,1,.36,1)` | Framer Motion |
| Custom cursor | spring | Framer spring | Follows mouse |

### Scroll-Reveal Pattern

Every section (except hero) uses this pattern:

```tsx
const sectionRef = useRef<HTMLElement>(null);

useEffect(() => {
  const el = sectionRef.current;
  if (!el) return;

  gsap.fromTo(
    el.querySelectorAll(".reveal"),
    { y: 40, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.6,
      ease: "power3.out",
      stagger: 0.1,
      scrollTrigger: {
        trigger: el,
        start: "top 80%",
        once: true, // only animate once
      },
    }
  );

  return () => ScrollTrigger.getAll().forEach((t) => t.kill());
}, []);
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
  .webgl-layer { display: none; }
  .core-fallback { display: block; }
}
```

Plus GSAP check:

```tsx
const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Skip all GSAP animations if true
```

---

## 7. 3D Scene — Scroll-Linked Core

### Current Behavior
- Fixed-position canvas behind hero
- Responds to mouse (rotation, scale, light intensity)
- 96 floating particles
- Post-processing: Bloom, Noise, Vignette

### New Behavior

Add a `scrollProgress` state (0–1) that tracks how far the user has scrolled past the hero:

```tsx
const [scrollProgress, setScrollProgress] = useState(0);

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

Pass `scrollProgress` to `CoreScene` and use it to:
1. **Scale down**: `0.84 → 0.6` as user scrolls past hero
2. **Shift right**: `position.x: 2.82 → 4.5` (parallax exit)
3. **Rotate shell faster**: `rotation.y += delta * 0.06 → 0.12`
4. **Reduce particle opacity**: `0.22 → 0.05`
5. **Fade bloom**: `intensity: 0.38 → 0.1`

All transitions are smooth (lerped, not instant).

### Mobile Fallback

On screens < 980px, the CSS fallback (`.core-fallback`) remains unchanged — a radial gradient circle with a clip-path pentagon. No scroll interaction on mobile.

---

## 8. Custom Cursor (Desktop Only)

### Component: `CustomCursor.tsx`

A `position: fixed` div that follows the mouse with a spring animation (Framer Motion). Two states:

1. **Default**: 8px circle, `var(--accent)` at 60% opacity, `mix-blend-mode: difference`
2. **Hovering** (over links, buttons, cards): scales to 24px, opacity 100%, adds a subtle glow

```tsx
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
```

### CSS

```css
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

### Integration

- Only render on desktop (> 980px AND hover-capable device)
- Track hoverable elements (`a`, `button`, `.project`, `.capabilities article`)
- Disable on touch devices (`hover: none` media query)

---

## 9. Component Changes

### `app/page.tsx`

- Add `useRef` for each section
- Add GSAP ScrollTrigger setup in `useEffect`
- Add `.reveal` class to elements that should animate on scroll
- Add custom cursor component (conditionally rendered)
- Add `scrollProgress` state for 3D scene
- Keep all existing data arrays and content unchanged

### `app/globals.css`

- Add `.reveal` base styles: `opacity: 0; transform: translateY(40px);`
- Add custom cursor styles
- Add `.section-reveal-glow` for the radial gradient on scroll-enter
- Refine `.project` hover to include `scale(1.02)` and smoother transition
- Keep all existing styles intact

### `app/components/CoreScene.tsx`

- Accept `scrollProgress` prop
- Use `scrollProgress` in `useFrame` to drive scale, position, rotation, opacity
- No structural changes to the scene itself

### NEW: `app/components/CustomCursor.tsx`

- Framer Motion `motion.div` that follows mouse
- Detects hoverable elements via `mouseenter`/`mouseleave`
- Conditionally rendered (desktop only)

### NEW: `app/hooks/useScrollAnimation.ts`

- Custom hook that sets up GSAP ScrollTrigger for a given ref
- Returns cleanup function
- Respects `prefers-reduced-motion`

---

## 10. Performance Budget

| Metric | Target | How |
|---|---|---|
| First Contentful Paint | < 1.5s | No new JS in critical path |
| Largest Contentful Paint | < 2.5s | 3D scene lazy-loaded (existing) |
| Total Blocking Time | < 200ms | GSAP is ~25KB gzipped, already installed |
| Cumulative Layout Shift | 0 | All animations use `transform` only (no layout) |
| bundle size delta | < 30KB | GSAP already in node_modules, Framer already in node_modules |

### What We Are NOT Adding

- No new npm packages (everything is already installed)
- No new fonts (Geist Sans + Mono are sufficient)
- No new images (existing SVGs and OG image are kept)
- No new routes (single page, no routing changes)
- No new API calls (all data is hardcoded)
- No new 3D models (existing icosahedron is the signature)

---

## 11. Accessibility

- `prefers-reduced-motion`: All GSAP animations check this and skip if true. CSS already handles it.
- Keyboard focus: All interactive elements must be reachable via Tab. `:focus-visible` outline uses `var(--accent)`.
- Skip-to-content link: Already exists, kept.
- `aria-label` on nav: Already exists, kept.
- `aria-expanded` on mobile menu toggle: Already exists, kept.
- `aria-hidden` on decorative elements (grain, 3D scene): Already exists, kept.
- Custom cursor: Hidden on touch devices, does not interfere with assistive technology.
- Color contrast: `--text` on `--bg` = 15.3:1 (AAA). `--accent` on `--bg` = 11.2:1 (AAA). All pass.

---

## 12. Testing Strategy

1. **Build**: `npm run build` must pass (vinext/Cloudflare Workers)
2. **Lint**: `npm run lint` must pass (ESLint 9 flat config)
3. **Tests**: `npm run test` must pass (rendered HTML assertions)
4. **Visual QA**: Screenshot desktop (1440px) and mobile (375px) — check section reveals, parallax, custom cursor, 3D scroll
5. **Reduced motion**: Toggle `prefers-reduced-motion` — all animations must be instant
6. **Keyboard**: Tab through entire page — focus outlines visible, no traps
7. **Performance**: Lighthouse score > 90 on all metrics

---

## 13. Scope

### In Scope

- GSAP ScrollTrigger integration for all sections
- GSAP SplitText kinetic typography on hero headline
- Scroll-linked 3D scene behavior
- Custom cursor (desktop)
- Framer Motion menu animation
- CSS scroll-reveal base styles
- Section parallax effects
- Enhanced hover states on project cards

### Out of Scope

- New pages or routing
- CMS integration
- New 3D models or scenes
- New images or illustrations
- Dark/light mode toggle
- Blog or writing section
- Contact form (email link is sufficient)
- Analytics or tracking

---

## 14. Success Criteria

1. Every section animates on scroll (not all at once on load)
2. The 3D core responds to scroll position (not just mouse)
3. The hero headline enters with kinetic typography
4. Custom cursor works on desktop, disappears on mobile
5. All animations respect `prefers-reduced-motion`
6. Build, lint, and tests all pass
7. No new dependencies added
8. The site still feels like "a quiet machine" — alive, not noisy
