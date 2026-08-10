# Retro-Futuristic Sakura Portfolio Redesign — Design Spec

**Project:** portfolio-v2 (replace current)
**Approach:** Approach 2 — "Synthwave Shrine" (Single Canvas Immersion)
**Date:** 2026-08-10
**Status:** Approved for implementation

---

## 1. Executive Summary

Replace the current portfolio-v2 with a **single-page, single-canvas Three.js experience** — a camera dolly through a retro-future shrine path under a blue-night sakura canopy. All content rendered as floating holographic panels in world space. The existing 3D "Core" evolves into a **Core Shrine** (orbital icosahedron + sakura wireframe bloom). Full parallax immersion with GPU petal system (15k particles), zone-based narrative progression, and a static accessible fallback.

---

## 2. Core Concept & Architecture

### 2.1 Single-Scene Camera Dolly
- **One Three.js scene**, camera moves along a Catmull-Rom spline on scroll
- Scroll position → spline parameter `t` (0.0 to 1.0) → camera position/rotation/FOV
- No traditional DOM sections; content = `HolographicPanel` components mounted at world coordinates

### 2.2 Zone Sequence (Spline Waypoints)

| Zone | Z-Range | World Position | Content Panels | Atmosphere |
|------|---------|----------------|----------------|------------|
| `approach` | 0 → -40 | Torii gate entrance | Hero panel (name, title, CTA) | Distant city glow, first petal gust |
| `path` | -40 → -120 | Lantern-lit walkway | Experience (left), Selected Work (right) — **static pair layout** | Rhythmic lanterns, layered parallax |
| `shrine` | -120 → -200 | Central clearing | **Core Shrine** (evolved CoreScene) | Ichor teal glow, sakura wireframe bloom |
| `ascent` | -200 → -300 | Rising platform | About/Skills (orbiting), Achievements | Sky gradient shift, petals swarm upward |
| `transmission` | -300 → -380 | Sky platform | Contact terminal | Beacon pulse on submit, starfield |

### 2.3 Fallback Strategy
- `prefers-reduced-motion` OR mobile viewport `< 768px` OR `navigator.deviceMemory < 4` → **unmount WebGL, mount `ReducedMotionFallback`**
- Fallback = current portfolio structure (semantic HTML sections) + CSS sakura petal animation + static Core illustration
- All content identical; no data duplication

---

## 3. Component Architecture

```
App (page.tsx)
├── SceneCanvas (dynamic import, ssr: false)
│   ├── Canvas (R3F)
│   │   ├── SplineController (scroll → camera)
│   │   ├── PetalSystem (15k GPU particles, compute shader)
│   │   ├── ZoneManager (camera Z → active zone, panel mount/unmount)
│   │   ├── HolographicPanel[] (Html overlay, semantic HTML)
│   │   ├── CoreShrine (extended CoreScene + sakura wireframe)
│   │   ├── Environment (skybox, torii, lanterns, city silhouettes)
│   │   └── PostProcessing (Bloom, ChromaticAberration, Scanlines, Vignette)
├── HUD (fixed DOM: zone indicator, progress ring, audio toggle, zone jump links)
├── ReducedMotionFallback (static DOM replica)
└── AudioController (optional ambient)
```

### 3.1 Data Flow
- All content constants remain in `page.tsx` (experience, projects, skills, achievements, contact)
- Passed as props to `SceneCanvas` → distributed to `HolographicPanel` components
- **No external data fetching** — zero runtime dependencies

### 3.2 State Management
| State | Source | Consumers |
|-------|--------|-----------|
| `cameraZ` | SplineController (scroll) | ZoneManager, PetalSystem, CoreShrine, Environment |
| `activeZone` | ZoneManager | HUD, HolographicPanel (enter/exit animation) |
| `hoveredPanel` | Raycast (pointer) | HolographicPanel (scale/glow), PetalSystem (attraction) |
| `reducedMotion` | `useReducedMotion()` hook | App (conditional render) |
| `audioEnabled` | HUD toggle | AudioController |

---

## 4. Motion & Interaction Specification

### 4.1 Camera Dolly
- **Spline:** Catmull-Rom, tension 0.5, 5 waypoints (one per zone center)
- **Mapping:** `scrollY / maxScroll → t` (clamped 0–1), eased with `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- **Speed:** 1px scroll = 0.08 world units (tunable)
- **Lerp:** Camera position/rotation/FOV lerped in `useFrame` at `1 - exp(-delta * 8)`

### 4.2 Petal System (GPU Simulation)
- **Count:** 15,000 particles (desktop), 5,000 (mobile/low-memory)
- **Simulation:** WebGL2 transform feedback (or WebGPU compute where available) via `petals.simulation.glsl` — position, velocity, life, color stored in buffer textures
- **Forces (vertex shader simulation):**
  - Gravity: `vec3(0, -0.0003, 0)`
  - Wind: Simplex noise (shader-side `snoise`) × scroll velocity × zone wind vector
  - Cursor attraction: Inverse-square within 8 world units, max force 0.02 (uniform)
  - Zone color: `mix(indigo, teal, t) → mix(teal, rose, t) → mix(rose, cream, t)`
- **Render:** Instanced `Points` with custom sprite shader (soft circular, additive blending)
- **Lifecycle:** Respawn at top of canopy when life expires
- **Fallback:** CPU-side `THREE.Points` with `BufferGeometry` update loop if WebGL2 transform feedback unavailable

### 4.3 Panel Reveal Animation
- **Trigger:** Zone activation (camera enters zone Z-range ±10 units)
- **Sequence:** Staggered 120ms per panel
- **Animation:** `opacity: 0→1`, `scale: 0.95→1`, `translateZ: 20→0` over 600ms cubic-bezier(0.22, 1, 0.36, 1)
- **Glitch effect:** RGB split (2px) for 150ms on enter — `ChromaticAberration` pass intensity pulse

### 4.4 Core Shrine Interactions
- **Inherits:** Current `CoreScene` physics (pointer rotation, hover intensity, auto-rotation)
- **Adds:** Sakura wireframe geometry (fractal branch, 5 iterations) — shader `sakuraWireframe.glsl`
- **Hover:** Wireframe bloom intensity + petal orbit radius increase
- **Click:** Camera micro-dolly toward core (2 units) + panel focus

### 4.5 Contact Terminal
- **Form:** Semantic `<form>` in `HolographicPanel` (HTML overlay)
- **Submit:** Beacon pulse shader (`beacon.glsl`) — expanding ring (0→40 units, 800ms) + particle burst (500 petals, radial velocity) + audio ping
- **Success state:** Hologram text "TRANSMISSION ACKNOWLEDGED" fades in, form fades out

### 4.6 Audio (Optional, Default Off)
- **Ambient hum:** 40Hz sine + filtered noise, -35dB, loop
- **Petal rustle:** Granular synthesis triggered by scroll velocity > threshold
- **Beacon ping:** 880Hz → 440Hz exponential decay, -20dB
- **Control:** HUD toggle (persists in `localStorage`), respects `prefers-reduced-motion`

---

## 5. Visual & Color System

### 5.1 Palette (CSS Custom Properties)
```css
:root {
  --void: #03050a;
  --indigo: #0a0f2e;
  --teal: #00f5d4;
  --magenta: #ff2a6d;
  --rose: #ff6b9d;
  --cream: #fef3e2;
  --phosphor: #39ff14;
  --chrome: #e8f4fd;
}
```

### 5.2 Zone Gradients (Skybox/Background Blend)
| Zone | Gradient |
|------|----------|
| Approach | `radial-gradient(ellipse at 50% 20%, var(--indigo) 0%, var(--void) 70%)` |
| Path | `linear-gradient(180deg, var(--indigo), #1a0f3a, #0d1a2e)` |
| Shrine | `radial-gradient(circle at 50% 50%, #0d2a2a 0%, var(--void) 60%)` + teal point light |
| Ascent | `linear-gradient(0deg, #1a0d2e, var(--indigo), #0a1a2e)` |
| Transmission | `radial-gradient(ellipse at 50% 80%, #2a0d1a 0%, var(--void) 80%)` |

### 5.3 Typography
- **UI/Data/Terminal:** Geist Mono (variable, `--font-geist-mono`)
- **Body/Headings:** Geist Sans (variable, `--font-geist-sans`)
- **All text in HTML overlays** — never baked into WebGL
- **Scale:** Clamped fluid (`clamp(1rem, 2vw + 0.5rem, 1.5rem)` for body)

### 5.4 Post-Processing Stack (Order)
1. `Bloom` — intensity 0.35, threshold 0.78, luminanceSmoothing 0.15
2. `ChromaticAberration` — offset 0.0015 (pulses on panel enter)
3. `Scanlines` — opacity 0.08, density 2.0 (CRT feel)
4. `Vignette` — offset 0.25, darkness 0.4
5. `Noise` — opacity 0.015, blendMode SOFT_LIGHT (film grain)

---

## 6. Accessibility & SEO

### 6.1 Semantic HTML in Overlays
Every `HolographicPanel` renders via `<Html>` (R3F) wrapping:
```tsx
<Html transform={false} prepend={true}>
  <section aria-labelledby={zoneId} data-zone={zone}>
    <h2 id={zoneId}>{zoneTitle}</h2>
    {/* content: <article>, <ul>, <p>, <a> */}
  </section>
</Html>
```
- Screen readers traverse normal DOM order
- Headings hierarchy: H1 (hero) → H2 (zone titles) → H3 (panel titles)
- Links/buttons focusable, `:focus-visible` styled (teal outline)

### 6.2 Reduced Motion Fallback
- Detect: `matchMedia('(prefers-reduced-motion: reduce)')` + viewport + deviceMemory
- Fallback mounts **synchronously** (no flash) — reads same content constants
- Fallback styles: `globals.css` extended with `.reduced-motion` variants
- Sakura: CSS keyframe animation (opacity + transform), 20 petals max

### 6.3 Keyboard Navigation
- HUD zone links: `<a href="#shrine">` → `scrollToZone('shrine')` (smooth camera dolly)
- Tab order: HUD → panel content (natural DOM order)
- Escape: Close focused panel, return camera to zone center

### 6.4 Color Contrast (WCAG AAA)
| Pair | Ratio | Usage |
|------|-------|-------|
| Cream / Void | 14.2:1 | Body text |
| Teal / Indigo | 7.1:1 | Accent on dark |
| Magenta / Void | 9.3:1 | Hover/focus |
| Phosphor / Void | 11.8:1 | Scanlines/terminal |

### 6.5 SEO & Meta
- Preserve all `layout.tsx` metadata (title, description, OG, Twitter, JSON-LD)
- `sitemap.xml` generated at build (next-sitemap)
- `robots.txt` allows all
- Static export compatible (fallback is pure HTML)

---

## 7. File Structure

```
app/
├── page.tsx                              # Entry: constants + conditional render
├── components/
│   ├── SceneCanvas.tsx                   # R3F Canvas + providers + Suspense
│   ├── SplineController.tsx              # Scroll → camera lerp
│   ├── PetalSystem.tsx                   # GPU particles (compute shader)
│   ├── ZoneManager.tsx                   # Zone activation, panel registry
│   ├── HolographicPanel.tsx              # Html overlay wrapper + reveal animation
│   ├── CoreShrine.tsx                    # Extended Core + sakura wireframe
│   ├── Environment.tsx                   # Skybox, torii, lanterns, city
│   ├── PostProcessing.tsx                # EffectComposer stack
│   ├── HUD.tsx                           # Fixed DOM: progress, zones, audio
│   └── ReducedMotionFallback.tsx         # Static DOM replica
├── shaders/
│   ├── petals.simulation.glsl              # Petal simulation (position, velocity, color) — transform feedback
│   ├── petals.vertex.glsl                  # Point sprite vertex (reads simulation buffer)
│   ├── petals.fragment.glsl                # Soft circle + additive blend
│   ├── beacon.glsl                         # Contact pulse ring
│   ├── sakuraWireframe.vertex.glsl         # Fractal branch vertex
│   ├── sakuraWireframe.fragment.glsl       # Bloom + color by depth
│   ├── chromaticAberration.glsl            # RGB split for panel enter
│   └── scanlines.glsl                      # CRT scanline overlay
├── lib/
│   ├── spline.ts                         # CatmullRom3 + waypoint config
│   ├── color.ts                          # Zone gradient interpolation
│   ├── audio.ts                          # AudioContext + synthesis
│   └── reducedMotion.ts                  # Hook + detection logic
├── hooks/
│   ├── useScroll.ts                      # Scroll position + velocity
│   ├── useReducedMotion.ts               # Media query + device check
│   └── useAudio.ts                       # AudioContext lifecycle
└── globals.css                           # Extended palette, fallback styles, HUD
```

### 7.1 New Dependencies
| Package | Purpose |
|---------|---------|
| `simplex-noise` | Wind noise for petal system (shader-side `snoise` implementation — no runtime dep needed; include GLSL function) |
| `gsap` | Already present — scroll ticker, eased lerp |

**Note:** R3F provides `<Html>` built-in (re-exports `three-stdlib` Html) — no additional dependency required.

---

## 8. Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| Desktop FPS | 60 | Chrome DevTools Performance |
| Mobile FPS (fallback) | 30 | Real device test |
| Frame time (GPU) | <16ms | `gl.getExtension('EXT_disjoint_timer_query_webgl2')` |
| Bundle (WebGL chunk) | <250KB gz | `webpack-bundle-analyzer` |
| Initial paint (fallback) | <1.5s | Lighthouse |
| Petal count (desktop) | 15,000 | Fixed |
| Petal count (mobile) | 5,000 | DeviceMemory check |
| Post-processing passes | 5 | Bloom, CA, Scanlines, Vignette, Noise |

### 8.1 Optimization Strategies
- **Code-split:** `SceneCanvas` dynamic import (`ssr: false`)
- **Shader compilation:** Async, show loader (existing `scene-loader`)
- **Instanced rendering:** Petals, lanterns, city windows
- **Frustum culling:** `ZoneManager` unmounts panels outside ±50 units
- **LOD:** Core shrine geometry reduces at distance
- **Texture atlas:** All sprites (petal, lantern glow) in single atlas

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Mobile GPU OOM | Medium | High | DeviceMemory check → fallback; reduce petals; disable Bloom |
| Scroll jank | Low | Medium | Camera lerp in `useFrame` (not scroll handler); GSAP ticker |
| SEO regression | Low | High | All content in semantic HTML overlays; test with `textise dot iitty` |
| Accessibility audit fail | Low | High | NVDA/VoiceOver test plan; fallback is fully accessible |
| Bundle size bloat | Medium | Medium | Code-split; tree-shake three-stdlib; analyze weekly |
| Shader compilation flash | Medium | Low | Keep existing `scene-loader`; compile shaders in background |
| Zone transition pop | Low | Medium | Overlap zone ranges (±10 units); cross-fade panels |

---

## 10. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Spline + camera dolly + scroll binding
- [ ] ZoneManager + HolographicPanel (Html overlay)
- [ ] ReducedMotionFallback (port current page.tsx)
- [ ] HUD + zone jump links
- [ ] Palette + globals.css extension

### Phase 2: Atmosphere (Week 1-2)
- [ ] Environment (skybox, torii, lanterns, city silhouettes)
- [ ] PetalSystem (compute shader + render)
- [ ] PostProcessing stack
- [ ] Zone gradient transitions

### Phase 3: Content & Core (Week 2)
- [ ] Populate panels with actual content (experience, work, about, contact)
- [ ] CoreShrine (extend CoreScene + sakura wireframe shader)
- [ ] Panel reveal animations + glitch effect
- [ ] Contact form + beacon pulse

### Phase 4: Polish (Week 2-3)
- [ ] Audio system (optional)
- [ ] Performance tuning (mobile, low-memory)
- [ ] Accessibility audit (NVDA, VoiceOver, axe)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Fallback parity verification

---

## 11. Open Decisions (Resolved)

| Decision | Resolution |
|----------|------------|
| Audio | Included, default OFF, HUD toggle, respects reduced-motion |
| Core shrine evolution | Keep icosahedron + rings + halo; ADD sakura wireframe bloom |
| Project panels in `path` zone | **Static left/right pair** (Experience left, Work right) — no carousel |
| Background city | **Procedural Three.js boxes** with lit windows (instanced mesh) — more alive |
| Timeline | 2-3 weeks, phased delivery as above |

---

## 12. Approval

**Design approved by user on 2026-08-10.** Ready for implementation plan.

---

*Next step: Invoke `writing-plans` skill to create detailed implementation plan with task breakdown.*