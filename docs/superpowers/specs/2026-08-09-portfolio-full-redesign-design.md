# Portfolio Full Redesign — Cinematic Scroll + Dark Editorial + Liquid Glass

**Date:** 2026-08-09
**Author:** opencode (design agent)
**Status:** Approved
**Approach:** Hybrid — Cinematic Reveal (A) + Dark Editorial (B) + Liquid Glass (C)

---

## 1. Subject & Audience

**Subject:** Aditya Kumar's developer portfolio — a single-page site showcasing production AI, backend infrastructure, and automation work.

**Audience:** Engineering recruiters and hiring managers at 0–5 YOE level, plus peer developers. They scan for 7 seconds on first pass. The portfolio must communicate: "this person builds real systems that scale."

**Page's single job:** Convert a visitor into a conversation (email, LinkedIn message, or resume download) within 30 seconds of landing.

---

## 2. Design Philosophy

"Designed as a quiet machine." — the existing tagline is the design brief. The site should feel like an interface to a production system: calm, precise, alive. Every section is a cinematic scene. Scroll is the input; animation is the output.

**Hybrid approach:**
- **Cinematic Reveal (A):** Text splitting, staggered reveals, scroll-linked backgrounds, section-specific animations
- **Dark Editorial (B):** Strong typography hierarchy, asymmetric grids, pull quotes, editorial layout
- **Liquid Glass (C):** Glass panels, aurora background that shifts with scroll, frosted borders

**Anti-patterns to avoid:**
- Cream + serif + terracotta (AI template #1)
- Near-black + acid green accent (AI template #2 — we use teal, which is distinct)
- Broadsheet hairlines + zero border-radius (AI template #3)
- Confetti, bouncing, or playful micro-animations
- Parallax so aggressive it causes jank
- All sections looking the same (the current problem)

---

## 3. Color System

### Tokens (CSS Custom Properties)

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#070908` | Page background, section backgrounds |
| `--surface` | `#0c0f0e` | Card backgrounds, elevated surfaces |
| `--surface-glass` | `rgba(12, 15, 14, 0.6)` | Glass panel backgrounds |
| `--text` | `#f1f3ef` | Primary text, headings |
| `--muted` | `#aab1ac` | Body text, descriptions |
| `--dim` | `#747d77` | Labels, metadata, timestamps |
| `--accent` | `#71f5d4` | Primary accent — links, highlights, glows |
| `--accent-warm` | `#E8A838` | Secondary accent — serif words, warm highlights |
| `--accent-deep` | `#3a9d8a` | Deeper teal for gradients, secondary accents |
| `--glow` | `rgba(113,245,212,0.15)` | Scroll-reveal glow backgrounds |
| `--glow-warm` | `rgba(232,168,56,0.12)` | Warm glow for serif accents |
| `--line` | `rgba(241,243,239,0.12)` | Section borders, dividers |
| `--soft-line` | `rgba(241,243,239,0.07)` | Subtle borders (header, cards) |
| `--glass-border` | `rgba(255,255,255,0.08)` | Glass panel borders |
| `--glass-border-hover` | `rgba(113,245,212,0.25)` | Glass panel hover borders |

---

## 4. Typography

### Type Scale

| Role | Font | Weight | Size | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| Display | Geist Sans | 520 | `clamp(52px, 11vw, 150px)` | 0.95 | -0.04em |
| Heading 2 | Geist Sans | 500 | `clamp(44px, 4.7vw, 76px)` | 0.98 | -0.04em |
| Heading 3 | Geist Sans | 500 | `clamp(26px, 2.5vw, 39px)` | 1.06 | -0.032em |
| Body large | Geist Sans | 400 | `clamp(19px, 1.75vw, 26px)` | 1.55 | -0.018em |
| Body | Geist Sans | 400 | `clamp(16px, 1.15vw, 19px)` | 1.65 | -0.01em |
| Mono label | Geist Mono | 500 | 9-10px | 1 | 0.06-0.11em |
| Mono small | Geist Mono | 500 | 7-8px | 1 | 0.08-0.12em |
| Serif accent | Playfair Display | 400 italic | inherits from parent | inherits | inherits |

### Kinetic Typography

**Hero headline:** Manual word split + GSAP. Each word in `<span>` with `overflow: hidden` on parent, animate from `y: 110%` to `y: 0`.

**Section headings:** Text split into individual characters. Each character slides in from `x: -20, opacity: 0` to `x: 0, opacity: 1` with 0.02s stagger. This creates a "cinematic reveal" effect.

**Contact headline:** Word-by-word reveal. Each word scales from `0.8` to `1` and fades in.

### Editorial Typography Rules

- Section headings use a 3-column grid: index (left), heading (center), description (right)
- Index labels are always mono, 9px, uppercase, teal accent
- Pull quotes use body-large size with a left teal border (2px)
- Outcome cards use body size with a small teal dash before each

---

## 5. Layout Architecture

### Section Order

1. Header (fixed)
2. Hero
3. Impact Metrics (horizontal ticker)
4. Experience (editorial timeline)
5. Consumer Scale (showcase cards)
6. Selected Work (horizontal scroll)
7. Profile & Skills (editorial + constellation)
8. Contact (cinematic close)
9. Footer

### Responsive Breakpoints

- Desktop: > 980px (full layout)
- Tablet: 680px–980px (simplified grid, no 3D scene)
- Mobile: < 680px (stacked, simplified animations)

---

## 6. Section-by-Section Design

### 6.1 Hero

**Layout:** Centered massive type. Same headline: "I build systems that scale & heal."

**New elements:**
- **Scroll progress indicator:** Thin vertical line (2px) on the right edge, 80vh tall, centered vertically. Fills from top to bottom as user scrolls. At the bottom, a small arrow pulses.
- **3D Core transition:** On scroll, the blurred icosahedron sharpens (blur 60px → 0px) and scales down (0.5 → 0.3), revealing itself briefly before sliding off-screen (position.y → 5).
- **Background:** Radial gradient that shifts position based on scroll progress (not static).
- **Hero bottom grid:** Replace 4-column grid with horizontal rule + inline labels. Labels animate in with stagger.

**Animation sequence:**
1. Page load: Words slide up (existing, kept)
2. 0.3s after load: Bottom grid fades in with stagger
3. On scroll: 3D core sharpens + fades, background shifts, scroll indicator fills

### 6.2 Impact Metrics

**Current:** 4-column grid of numbers with thin borders.

**New design:** Horizontal scrolling ticker.

**Layout:**
- Full-width container, overflow hidden
- Inner flex row that auto-scrolls horizontally
- Each metric is a glass panel: `min-width: 200px; padding: 24px 32px`
- Between metrics: small teal dot separator (3px circle)
- Glass panel: `background: var(--surface-glass); border: 1px solid var(--glass-border); border-radius: 8px; backdrop-filter: blur(12px)`

**Animation:**
- Numbers count up from 0 using GSAP counter
- Ticker auto-scrolls slowly (20px/s) after count-up completes
- Pauses on hover
- Each panel has a glow border that pulses once on reveal

**Mobile:** Stack vertically, no auto-scroll, no ticker.

### 6.3 Experience

**Current:** Timeline grid — period on left, content on right.

**New design:** Vertical editorial timeline with glass panels.

**Layout:**
- Left column (25%): Period text + vertical line
- Right column (75%): Glass panel with role, summary, outcomes, stack
- Vertical line: 1px solid var(--line), with a glowing teal dot at current position
- Glass panel: `background: var(--surface-glass); border: 1px solid var(--glass-border); border-radius: 12px; backdrop-filter: blur(12px)`

**Outcomes:** Appear as floating cards inside the glass panel with teal dash prefix.

**Stack:** Row of small glass tags at the bottom of each panel.

**Animation:**
- Each experience panel slides in from `x: 60, opacity: 0` with 0.15s stagger
- Outcomes stagger in after the panel lands (0.08s each)
- Vertical line draws downward as you scroll

### 6.4 Scale (Consumer Scale)

**Current:** 4 service cards in a 2x2 grid.

**New design:** Full-width showcase cards with overlap.

**Layout:**
- Each card: Full viewport width, glass panel
- Left side: Large index number (01-04) in dim mono
- Right side: Title + description + signal tag
- Cards stack vertically with `-40px` overlap
- Each card has a unique gradient background

**Card gradients:** Teal, warm gold, blue, rose — one per card.

**Animation:**
- Cards slide up with slight rotation (2deg → 0deg)
- Stagger: 0.15s between cards
- Background aurora shifts as you scroll

### 6.5 Selected Work (Projects)

**Current:** Horizontal scroll with glass cards.

**New design:** Enhanced with mockup zones, 3D tilt, scroll dots.

**Layout:** Same horizontal scroll, cards enhanced:
- **Mockup zone:** Top 40% of card has gradient placeholder with grid overlay
- **3D tilt:** Cards tilt toward mouse (CSS perspective + GSAP)
- **Scroll dots:** Bottom indicator showing active project

### 6.6 Profile & Skills

**Current:** 2-column with capability grid.

**New design:** Editorial layout with skill constellation.

**Layout:**
- Left column (40%): Bio + education (editorial style)
- Right column (60%): Floating skill tags in a loose cloud

**Skill tags:** Glass pills with category-based color variations (6 categories, each a different teal temperature).

**Animation:** Tags fly in from random directions, settle into position.

### 6.7 Contact

**Current:** Large text + email link + social links.

**New design:** Full-viewport cinematic close.

**Layout:**
- Large text with word-by-word reveal
- Email link with magnetic cursor effect
- Aurora gradient intensifies at this section
- Social links as glass pills

---

## 7. Animation System

### Libraries

| Library | Purpose | Used For |
|---|---|---|
| GSAP + ScrollTrigger | Scroll-driven animations | Section reveals, parallax, kinetic type, ticker |
| GSAP TextPlugin | Text splitting | Character-by-character reveals |
| Framer Motion | React component transitions | Menu open/close, custom cursor |
| CSS transitions | Hover micro-interactions | Button hovers, card hovers, glass effects |
| Three.js (R3F) | 3D scene | Hero core (existing, enhanced) |

### Animation Timing Contract

| Category | Duration | Easing | Notes |
|---|---|---|---|
| Section reveals | 0.6s | `power3.out` | Fade + translate |
| Text character reveal | 0.02s stagger | `power2.out` | Per character |
| Stagger items | 0.08-0.15s | `power2.out` | Between siblings |
| Kinetic type (hero) | 0.8s | `power4.out` | Hero headline only |
| Ticker auto-scroll | 20px/s | linear | Continuous, pauses on hover |
| Hover transitions | 260ms | ease | CSS only |
| Glass hover | 400ms | cubic-bezier(.22,1,.36,1) | Border + shadow |
| Custom cursor | spring | Framer spring | Follows mouse |
| 3D tilt | 0.1s | linear | Follows mouse |

### Reduced Motion

All GSAP animations check `prefers-reduced-motion` and skip if true. CSS kills all animations/transitions. 3D scene and scroll indicator hidden.

---

## 8. Glass Panel System

All glass panels share: `background: var(--surface-glass); border: 1px solid var(--glass-border); border-radius: 12px; backdrop-filter: blur(12px)`. Hover: border brightens, glow shadow appears.

### Aurora Background (enhanced)

The aurora gradient responds to scroll position via CSS custom properties `--aurora-x` and `--aurora-y` set by a scroll listener.

---

## 9. Component Changes

### `app/page.tsx`
- Add refs for each section, GSAP ScrollTrigger setup
- Add `.reveal-text` class to section headings for character reveals
- Add scroll progress state and aurora scroll-linked position
- Keep all existing data arrays unchanged

### `app/globals.css`
- Add glass panel base styles, scroll progress indicator
- Add metric ticker, experience editorial, scale showcase, skill constellation, contact magnetic styles
- Update responsive breakpoints

### `app/components/CoreScene.tsx`
- Use scrollProgress to drive blur (60px → 0px), scale (0.5 → 0.3), position

### `app/components/CustomCursor.tsx`
- Add magnetic cursor effect for contact email
- Add hover detection for glass panels

### `app/components/HorizontalProjects.tsx`
- Add mockup zone, 3D tilt, scroll indicator dots

### NEW: `app/components/ScrollProgress.tsx`
- Fixed vertical line on right edge, fills on scroll, pulsing arrow

### NEW: `app/components/MetricsTicker.tsx`
- Horizontal auto-scrolling ticker with glass cards, count-up numbers

### NEW: `app/components/SkillConstellation.tsx`
- Floating skill tags with category colors, GSAP fly-in

---

## 10. Performance Budget

| Metric | Target | How |
|---|---|---|
| FCP | < 1.5s | No new JS in critical path |
| LCP | < 2.5s | 3D scene lazy-loaded |
| TBT | < 200ms | GSAP already installed |
| CLS | 0 | All animations use transform only |
| Bundle delta | < 30KB | No new npm packages |

### What We Are NOT Adding
- No new npm packages
- No new fonts
- No new images
- No new routes
- No new API calls
- No new 3D models

---

## 11. Accessibility

- `prefers-reduced-motion`: All animations skip
- Keyboard focus: All interactive elements reachable via Tab, `:focus-visible` uses `var(--accent)`
- Skip-to-content link: Kept
- `aria-label` on nav: Kept
- `aria-hidden` on decorative elements: Kept
- Custom cursor: Hidden on touch devices
- Color contrast: All combinations pass WCAG AAA

---

## 12. Success Criteria

1. Every section has a unique visual identity (no two sections look the same)
2. Text splitting cinematic reveals on section headings
3. Glass panel system used consistently across all cards
4. Aurora background shifts with scroll position
5. Metric ticker auto-scrolls with count-up animation
6. Experience has editorial timeline with glass panels
7. Scale has showcase cards with unique gradients
8. Projects have mockup zones and 3D tilt
9. Skills have floating constellation layout
10. Contact has magnetic cursor effect
11. Scroll progress indicator on right edge
12. All animations respect `prefers-reduced-motion`
13. Build, lint, and tests all pass
14. No new dependencies added
15. Site still feels like "a quiet machine" — alive, not noisy
