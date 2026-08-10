# Synthwave Shrine Portfolio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace portfolio-v2 with a single-canvas Three.js camera-dolly experience: retro-futuristic sakura shrine path under a blue night, content in holographic HTML panels, with an accessible static fallback.

**Architecture:** One R3F canvas; scroll drives a Catmull-Rom spline camera dolly through 5 zones (approach → path → shrine → ascent → transmission). `ZoneManager` mounts `HolographicPanel` HTML overlays per zone. GPU petal system (transform feedback, CPU fallback). `prefers-reduced-motion` / small viewport / deviceMemory → static `ReducedMotionFallback`.

**Tech Stack:** Next.js 16 + vinext, React 19, @react-three/fiber 9, three 0.185, @react-three/postprocessing 3, framer-motion 13, GSAP 3.15, Geist Sans/Mono.

## Global Constraints

- All content in semantic HTML overlays (never baked into WebGL)
- Palette from spec §5.1: `--void:#03050a --indigo:#0a0f2e --teal:#00f5d4 --magenta:#ff2a6d --rose:#ff6b9d --cream:#fef3e2 --phosphor:#39ff14 --chrome:#e8f4fd`
- Post FX enabled only when WebGL active
- Fallback contains identical content (single source of truth = constants in `app/content.ts`)
- Audio default OFF, localStorage-persisted, never starts before user gesture
- Zone Z-ranges: approach 0→-40, path -40→-120, shrine -120→-200, ascent -200→-300, transmission -300→-380
- No new npm dependencies
- All text ≥ WCAG AAA contrast (cream/void 14.2:1, teal/indigo 7.1:1)
- `prefers-reduced-motion` respected in every animated system

---

### Task 1: Content constants module

**Files:**
- Create: `app/content.ts`
- Modify: `app/page.tsx`
- Test: `npm run build`

**Interfaces:**
- Produces: `experience: Experience[]`, `projects: Project[]`, `capabilities: {label, items}[]`, `achievements: string[]`, `productionSurfaces: {index,title,description,signal}[]`, `contact: {email, github, linkedin, resume}` — all typed, exported from `app/content.ts`

- [ ] **Step 1:** Extract constants from `app/page.tsx:8-123` verbatim into `app/content.ts` with named exports.
- [ ] **Step 2:** Add `contact` export (email `adi.workspace76865@gmail.com`, github `https://github.com/adityakumar027`, linkedin `https://www.linkedin.com/in/adicrzz/`, resume Drive URL from `page.tsx:148`).
- [ ] **Step 3:** Update `app/page.tsx` to import from `./content`.
- [ ] **Step 4:** `npm run build` — verify compile passes.

### Task 2: Scroll hook + spline library

**Files:**
- Create: `app/lib/scroll.ts`, `app/lib/spline.ts`
- Test: `tests/lib/spline.test.mjs`

**Interfaces:**
- Produces: `useScroll()` → `{ scrollY: number, velocity: number, scrollFraction: number, maxScroll: number }`
- Produces: `createJourney()` → `{ spline: THREE.CatmullRomCurve3, getCameraAt(t): { position: THREE.Vector3, lookAt: THREE.Vector3 }, zoneForZ(z): ZoneId, totalLength: number, ZONES: {id, from, to, center}[] }`
- ZoneId = `"approach" | "path" | "shrine" | "ascent" | "transmission"`

- [ ] **Step 1:** Write test `tests/lib/spline.test.mjs` — imports `createJourney` from `../app/lib/spline.ts` (test runner: `node --test`, TS via `tsx`-less approach: file is plain ESM JS, `createJourney` must work without DOM/WebGL — build spline from plain Math, return THREE-free data structure where possible; use `three`'s CatmullRomCurve3 but construct values without rendering).
- [ ] **Step 2:** Run `node --test tests/lib/spline.test.mjs` → FAIL (missing module).
- [ ] **Step 3:** Implement `app/lib/spline.ts` — CatmullRomCurve3 through `[0,0,0],[0,0,-40],[0,0,-120],[0,0,-200],[0,0,-300],[0,0,-380]`, `zoneForZ` boundary switch, `getCameraAt(t)` = curve.getPoint(t) + lookAhead point at t+0.02.
- [ ] **Step 4:** Implement `app/lib/scroll.ts` — passive scroll listener, rAF-throttled velocity (EMA), `scrollFraction = scrollY / max(1, documentHeight - innerHeight)`.
- [ ] **Step 5:** Run tests → PASS.

### Task 3: HolographicPanel + ZoneManager

**Files:**
- Create: `app/components/HolographicPanel.tsx`, `app/components/ZoneManager.tsx`

**Interfaces:**
- Produces: `<HolographicPanel zone: ZoneId, title: string, visible: boolean, children>` → `<Html prepend><section data-zone aria-labelledby>` with framer-motion reveal (`opacity 0→1, scale 0.95→1`, 600ms, bezier 0.22/1/0.36/1), stagger 120ms via `motion.div`
- Produces: `<ZoneManager cameraZ: number, content, onZoneChange(z: ZoneId)>` → mounts all 5 zones' panels, active derived from `zoneForZ`, unmount beyond ±50 units

- [ ] **Step 1:** Implement `HolographicPanel.tsx` — `Html prepend`, `<section data-zone>` with `aria-labelledby`, heading + children, framer-motion `AnimatePresence`-compatible reveal (use `visible` prop, no unmount animation needed).
- [ ] **Step 2:** Implement `ZoneManager.tsx` — subscribes cameraZ prop, computes active zone, renders panel registry with content from `app/content.ts` (panic: use React `useMemo` for zone grouping).
- [ ] **Step 3:** Panel focus styles + `:focus-visible` teal outline (CSS in Task 9, inline fallback style ok).
- [ ] **Step 4:** Dev-server smoke: panels render as HTML in DOM with correct ids.

### Task 4: SceneCanvas, SplineController, camera dolly

**Files:**
- Create: `app/components/SceneCanvas.tsx`, `app/components/SplineController.tsx`

**Interfaces:**
- Produces: `SceneCanvas` — dynamic-imported R3F Canvas, fov 43, ACES tone mapping exposure 0.95, Suspense fallback null
- Produces: `SplineController({ journey, targetT })` — lerps `camera.position` along spline + lookAt at `1 - exp(-delta * 8)`

- [ ] **Step 1:** Implement `SplineController` — reads `targetT` prop (0..1 from scrollFraction), samples spline, lerp position, `camera.lookAt(lookAt)`.
- [ ] **Step 2:** Implement `SceneCanvas` — Canvas + fog (fog args `["#03050a", 6, 13]`) + ambient + Suspense.
- [ ] **Step 3:** Wire cameraZ back to ZoneManager (single `useRef` scene store via zustand-lite: plain React context `SceneStateContext` holding `{cameraZ, activeZone}` updated in useFrame).
- [ ] **Step 4:** Manual dev check: scroll dollies camera through 5 zones, zone label updates.

### Task 5: Environment (torii, lanterns, procedural city)

**Files:**
- Create: `app/components/Environment.tsx`, `app/lib/envData.ts`

**Interfaces:**
- Produces: `Environment({ journey, zoneProgress })` — skybox dome (ShaderMaterial gradient by zone), torii gate at z=0 (2 pillars + 2 cross beams, dark chrome), 14 lantern pairs z=-30..-110 (emissive spheres, warm cream), procedural skyline: 80-instance InstancedMesh boxes x∈[-40,40] z∈[-70,-30], height 4-30, emissive window texture (64×64 canvas, 18% lit)
- Produces: `envData.ts` — seeded RNG (LCG seed 901, same pattern as CoreScene.tsx:127), returns deterministic building/lantern/torii transforms

- [ ] **Step 1:** `envData.ts` — seeded RNG generating all geometry transforms (deterministic per build).
- [ ] **Step 2:** Skybox: `<mesh scale={[120,120,120]}><sphereGeometry args={[1, 32, 32]} /><shaderMaterial side={THREE.BackSide} uniforms uZone>` 5-stop ramp (spec §5.2).
- [ ] **Step 3:** Torii + lanterns meshes (instanced for lanterns).
- [ ] **Step 4:** City InstancedMesh with emissive window texture.
- [ ] **Step 5:** Manual check: torii overhead at start, lantern glow, sky shifts per zone.

### Task 6: ReducedMotionFallback + detection hook

**Files:**
- Create: `app/hooks/useExperienceMode.ts`, `app/components/ReducedMotionFallback.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Produces: `useExperienceMode(): "full" | "fallback"` — SSR-safe (server = "full" default), client re-check: `prefers-reduced-motion` OR `innerWidth < 768` OR (deviceMemory defined AND < 4)
- Produces: `ReducedMotionFallback` — static port of current page sections (hero, experience, work, about, scale, contact) from `app/content.ts`, using existing CSS classes + `.fallback-sakura` petals

- [ ] **Step 1:** Implement `useExperienceMode.ts` with hydration-safe double-render check.
- [ ] **Step 2:** Implement `ReducedMotionFallback.tsx` — port JSX from current `page.tsx` (hero, sections, contact, footer) reading content.ts.
- [ ] **Step 3:** Rewrite `page.tsx` — render SceneCanvas + HUD when "full", fallback otherwise; keep skip-link + grain overlay in both.
- [ ] **Step 4:** `npm run build`; verify fallback via reduced-motion emulation.

### Task 7: HUD (progress, zones, audio toggle)

**Files:**
- Create: `app/components/HUD.tsx`, `app/lib/zoneLabels.ts`

**Interfaces:**
- Produces: `ZONE_LABELS: {id: ZoneId, label: string}[]` — approach/path/shrine/ascent/transmission with short labels ("APPROACH", "PATH", "SHRINE", "ASCENT", "TRANSMISSION")
- Produces: `HUD({ activeZone, scrollFraction, onZoneSelect, audioEnabled, onToggleAudio })` — fixed overlay

- [ ] **Step 1:** `zoneLabels.ts` constant.
- [ ] **Step 2:** `HUD.tsx` — bottom-center zone label (mono), right progress bar (scaleY by scrollFraction), 5 jump links → `scrollTo({top})` via inverse mapping `pxFromT(t)`, audio toggle button (Task 13 stub with props).
- [ ] **Step 3:** Mount in `page.tsx` full mode only.
- [ ] **Step 4:** Manual check: zone click dollies camera.

### Task 8: Petal system

**Files:**
- Create: `app/components/PetalSystem.tsx`, `app/shaders/petals.vertex.glsl`, `app/shaders/petals.fragment.glsl`

**Interfaces:**
- Produces: `PetalSystem({ count, zoneProgress, scrollVelocity, pointer })` — GPU transform feedback path (WebGL2 `createBuffer`/transformFeedback) with CPU fallback (BufferGeometry update in useFrame)
- Forces: gravity `vec3(0,-0.0003,0)`, wind = none-noise offset + scrollVelocity × zone wind, cursor attraction inverse-square within 8 units max 0.02, respawn at y∈[4,9] on life end; color ramp mix(indigo,teal,t)→mix(teal,rose,t)→mix(rose,cream,t)

- [ ] **Step 1:** Write GLSL shaders (vertex transform-feedback simulation + point-sprite render with soft radial falloff, additive).
- [ ] **Step 2:** `PetalSystem.tsx` — count 15k (5k if `deviceMemory < 8` or viewport < 980), feature-detect transform feedback; CPU fallback path.
- [ ] **Step 3:** Wire uniforms: zone color lerp, scroll velocity, pointer attraction.
- [ ] **Step 4:** Manual check: petals fall, curl toward cursor, gust on fast scroll; 60fps desktop.

### Task 9: globals.css extension

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1:** Add `:root` palette vars from spec §5.1 (keep existing fallback vars).
- [ ] **Step 2:** HUD styles (`.hud`, `.hud-progress`, `.zone-label`), panel styles (`.hologram-panel`: rgba(3,5,10,.55) + 1px teal/0.18 border + backdrop-blur(12px)), `.fallback-sakura` keyframes (20 petals, translateY 110vh→-10vh + sway, durations 40-90s), focus-visible teal.
- [ ] **Step 3:** `prefers-reduced-motion` block — kill CSS petal animation, reduce panel transitions.
- [ ] **Step 4:** Build + visual check fallback mode.

### Task 10: CoreShrine

**Files:**
- Create: `app/components/CoreShrine.tsx`, `app/shaders/sakuraWireframe.vertex.glsl`, `app/shaders/sakuraWireframe.fragment.glsl`

**Interfaces:**
- Produces: `CoreShrine({ pointer, zoneProgress })` — port of `Core` from `app/components/CoreScene.tsx:52-120` verbatim + sakura fractal LineSegments (L-system, 4 iterations, `F→F[+F]F[-F]`, 12k segments max) with ShaderMaterial `uBloom` (0.2→0.9 on hover), color rose→teal by depth, additive

- [ ] **Step 1:** Port Core geometry/physics verbatim from current `CoreScene.tsx`.
- [ ] **Step 2:** L-system branch generation → LineSegments + wireframe shaders.
- [ ] **Step 3:** Wire hover → uBloom + petal orbit width (shared ref with PetalSystem).
- [ ] **Step 4:** Manual check: shrine glows teal, branch blooms on approach.

### Task 11: Post-processing stack

**Files:**
- Create: `app/components/PostProcessing.tsx`

**Interfaces:**
- Produces: `PostProcessing({ onZoneEnter })` — EffectComposer order: Bloom (0.35/0.78/0.15, mipmapBlur) → ChromaticAberration (0.0015 base, pulse 0.006 on zone enter, 150ms) → Scanlines (opacity 0.08) → Vignette (0.25/0.4) → Noise (0.015 SOFT_LIGHT); `multisampling={0} resolutionScale={0.8}`; skip Bloom if `deviceMemory < 4`

- [ ] **Step 1:** Implement composer stack.
- [ ] **Step 2:** CA pulse on zone enter (subscribe ZoneManager via context).
- [ ] **Step 3:** DeviceMemory guard.
- [ ] **Step 4:** Manual check: CRT feel, no banding.

### Task 12: Contact form + beacon pulse

**Files:**
- Create: `app/components/ContactTerminal.tsx`, `app/shaders/beacon.vertex.glsl`, `app/shaders/beacon.fragment.glsl`

**Interfaces:**
- Produces: `ContactTerminal({ onSend })` — semantic `<form>` (email + message), mailto submission, `aria-live` status, success holo "TRANSMISSION ACKNOWLEDGED"
- Produces: `BeaconPulse` — expanding ring mesh 0→40 units over 800ms, opacity fade; 500-petal radial burst via `PetalSystem.burst(x,y,z)`

- [ ] **Step 1:** Semantic form + mailto submit + status.
- [ ] **Step 2:** Beacon ring shader mesh.
- [ ] **Step 3:** Petal burst via context callback.
- [ ] **Step 4:** Success swap state.
- [ ] **Step 5:** Manual check: submit → ring + burst + status.

### Task 13: Audio

**Files:**
- Create: `app/lib/audio.ts`, `app/hooks/useAudio.ts`

**Interfaces:**
- Produces: `audio.ts` — `startAmbient()` (40Hz sine + bandpass noise, −35dB), `rustle(intensity)` (granular, scroll velocity), `ping()` (880→440Hz, −20dB, 300ms); all require user gesture resume; respects reduced motion
- Produces: `useAudio({ enabled, scrollVelocity })` — lazy AudioContext, `localStorage("synthwave-audio")`, default OFF

- [ ] **Step 1:** Implement audio.ts synthesis graph.
- [ ] **Step 2:** Implement hook with persistence + gesture resume.
- [ ] **Step 3:** Wire HUD toggle (Task 7) + rustle on scroll.
- [ ] **Step 4:** Manual check: no audio before gesture; toggle persists.

### Task 14: Sections content + hero panel

**Files:**
- Modify: `app/components/ZoneManager.tsx`

- [ ] **Step 1:** Hero panel (approach): name, title, tagline, CTAs (scroll hint + email).
- [ ] **Step 2:** path zone: experience (left) + selected work (right, static pair, project links new-tab).
- [ ] **Step 3:** ascent zone: about + capabilities grid + achievement strip.
- [ ] **Step 4:** Manual check: every zone readable, links work.

### Task 15: Performance + accessibility pass

- [ ] **Step 1:** axe-core audit (inject in dev console, both modes) → fix violations.
- [ ] **Step 2:** Keyboard walkthrough: tab order HUD→panels, Escape closes focus, zone links.
- [ ] **Step 3:** Measure frame time, adjust petal count/resolutionScale if >16ms desktop.
- [ ] **Step 4:** SEO meta intact (layout.tsx unchanged), `npm run lint`.

### Task 16: Final verification

- [ ] **Step 1:** Update `tests/rendered-html.test.mjs` — replace CoreScene dynamic-import assertion with SceneCanvas/ReducedMotionFallback assertions; keep `<main id="main">`, nav aria-label, resume Drive URL, reduced-motion CSS checks; hero copy assertions updated to fallback copy. (User-approved plan revision 2026-08-10.)
- [ ] **Step 2:** `npm run build` — zero errors.
- [ ] **Step 3:** `npm test` — passes.
- [ ] **Step 3:** Cross-check spec §10 checklist.
- [ ] **Step 4:** Final commit.