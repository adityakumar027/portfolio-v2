# Strict Implementation Prompt — Synthwave Shrine Portfolio Redesign

**For:** DeepSeek V4 Flash via opencode CLI
**Source of truth:** `2026-08-10-retro-futuristic-sakura-portfolio-redesign.md` — put this in the repo root, reference it by path in every session.

## How to use this

1. Copy the **MASTER DIRECTIVE** block into the start of *every* opencode session on this project — every time, not just the first.
2. Run **one phase per session**. Do not let the model combine phases, even if it offers to "just knock out the rest while it's in there." That offer is exactly the failure mode this file exists to prevent.
3. After the model claims a phase is done, paste that phase's **Verification Checklist** back and require literal pass/fail per item, each with a `file:line` citation. Reject any answer that summarizes instead of citing.
4. Don't start Phase N+1 until Phase N's checklist is fully green.

---

## MASTER DIRECTIVE (paste first, every session)

You are implementing a pre-approved design spec, not designing one. `design.md` in the repo root is the single source of truth. Read it in full before writing any code.

Non-negotiable rules:

1. **Match §7 File Structure exactly.** Every file/path listed must exist at that path. Don't rename, merge, or omit files. Don't invent extra files unless §7 explicitly allows it.
2. **Implement exact numeric values as written** — particle counts, timings, easing curves, hex colors, ratios, offsets. Never round, approximate, or substitute a "simpler" value. If a value is genuinely unattainable on target hardware, stop and report it — don't silently downgrade it.
3. **Don't swap technologies.** The spec requires Three.js/R3F, GLSL shaders, GSAP. Don't replace any of it with CSS animations, Framer Motion, or a "lighter" alternative — except inside `ReducedMotionFallback`, which is CSS by design (§3, §6.2).
4. **Don't cut scope.** If a feature is listed (GPU petal sim, Catmull-Rom spline, full post-processing stack, audio system) it gets built, even if it's the hardest part. Flag blockers instead of quietly dropping features.
5. **No placeholder content from Phase 3 onward.** Content (experience, projects, skills, achievements, contact) comes from the existing `page.tsx` constants — reuse them, don't invent sample copy. (Phases 1–2 may use clearly-marked `TODO` placeholder text for structural scaffolding only — final DOM/semantics must still be correct.)
6. **No unrequested creative additions.** If you have a good idea that isn't in the spec, propose it in your final report — don't implement it unasked.
7. **Accessibility and SEO (§6) are required, not optional polish**, in every phase that touches DOM structure.
8. **Ambiguity resolves via §11** ("Open Decisions — Resolved"). Those are already decided; don't re-litigate them.
9. **End every phase with a self-check** against that phase's checklist below, reported item-by-item — not "done, looks good."

If following the spec exactly conflicts with making something build faster or simpler, the spec wins. Report the conflict instead of resolving it silently.

---

## Phase 1 — Foundation

**Scope (per §10):** spline + camera dolly + scroll binding; ZoneManager + HolographicPanel; ReducedMotionFallback; HUD + zone jump links; palette + globals.css.

**Deliverables (exact paths, §7):**
- `app/lib/spline.ts` — CatmullRom3, 5 waypoints matching §2.2 zone Z-ranges: approach `0→-40`, path `-40→-120`, shrine `-120→-200`, ascent `-200→-300`, transmission `-300→-380`
- `app/components/SplineController.tsx` — per §4.1: `scrollY / maxScroll → t` clamped 0–1, eased with `cubic-bezier(0.25, 0.46, 0.45, 0.94)`, `1px scroll = 0.08 world units`, camera lerp in `useFrame` at `1 - exp(-delta * 8)`
- `app/components/ZoneManager.tsx` — camera Z → `activeZone`, panel mount/unmount, zone overlap ±10 units (§9 mitigation for "zone transition pop")
- `app/components/HolographicPanel.tsx` — Html overlay per §6.1 exactly: `<Html transform={false} prepend={true}>` wrapping `<section aria-labelledby={zoneId}>`, `<h2 id={zoneId}>`; reveal animation logic can be a stub (built out in Phase 3)
- `app/components/HUD.tsx` — zone indicator, progress ring, audio toggle (wire the control now, sound comes in Phase 4), zone jump links as `<a href="#zone">`
- `app/components/ReducedMotionFallback.tsx` — port the **current** `page.tsx` content 1:1, no redesign, same content constants, mounted synchronously (no flash)
- `app/lib/reducedMotion.ts`, `app/hooks/useReducedMotion.ts` — detection = `prefers-reduced-motion` OR viewport `<768px` OR `navigator.deviceMemory <4` (§2.3)
- `globals.css` — the 8 custom properties from §5.1, exact hex values, added not replacing existing tokens

**Do NOT:** touch petals, shaders, or post-processing — that's Phase 2. Don't wire final panel content yet.

**Verification checklist:**
- [ ] All Phase-1 files exist at the exact §7 paths
- [ ] Spline has exactly 5 waypoints matching §2.2 Z-ranges
- [ ] Scroll mapping uses the exact easing curve and the `0.08` world-units-per-pixel constant
- [ ] Camera lerp formula is literally `1 - exp(-delta * 8)`
- [ ] `ReducedMotionFallback` mounts synchronously and contains identical content to current `page.tsx`
- [ ] Reduced-motion detection checks all 3 conditions (not just `prefers-reduced-motion`)
- [ ] `globals.css` has all 8 properties from §5.1 with exact hex values
- [ ] `HolographicPanel` markup matches the §6.1 example verbatim in structure
- [ ] HUD has zone jump links as real anchor tags

---

## Phase 2 — Atmosphere

**Scope (per §10):** Environment (skybox, torii, lanterns, procedural city); PetalSystem (GPU compute + render); PostProcessing stack; zone gradient transitions.

**Exact specs to hit:**
- **PetalSystem (§4.2):** 15,000 particles desktop / 5,000 on mobile-or-`deviceMemory<4`; WebGL2 transform feedback (`petals.simulation.glsl`); forces — gravity `vec3(0, -0.0003, 0)`, simplex-noise wind × scroll velocity × zone wind vector, cursor attraction inverse-square within 8 world units at max force `0.02`, zone color mix indigo→teal→rose→cream across scroll; instanced `Points` with additive blending; CPU `BufferGeometry` fallback if transform feedback is unavailable.
- **PostProcessing order (§5.4) — do not reorder:**
  1. Bloom — intensity `0.35`, threshold `0.78`, luminanceSmoothing `0.15`
  2. ChromaticAberration — offset `0.0015`, pulses on panel enter
  3. Scanlines — opacity `0.08`, density `2.0`
  4. Vignette — offset `0.25`, darkness `0.4`
  5. Noise — opacity `0.015`, blend mode `SOFT_LIGHT`
- **Environment:** city is **procedural instanced-mesh boxes with lit windows** — §11 explicitly resolved this over a skybox texture ("more alive"). Don't substitute a texture.
- **Zone gradients:** the 5 exact gradient strings from §5.2, tied to `cameraZ`.

**Do NOT:** use a texture/image skybox for the city; skip the CPU fallback path; drop or reorder post-processing passes to hit a frame budget — report budget conflicts instead (§9 risk table).

**Verification checklist:**
- [ ] Petal count switches 15000→5000 correctly on the deviceMemory check
- [ ] All 4 named forces are implemented (gravity, wind noise, cursor attraction, zone color mix)
- [ ] Post-processing passes present in the exact 5-step order with exact params
- [ ] City is instanced-mesh boxes with lit windows, not a texture
- [ ] All 5 zone gradients match §5.2 strings exactly
- [ ] CPU fallback path exists and is reachable

---

## Phase 3 — Content & Core

**Scope (per §10):** populate panels with real content; CoreShrine (extend CoreScene + sakura wireframe); panel reveal + glitch effect; contact form + beacon pulse.

**Exact specs to hit:**
- **Reveal (§4.3):** staggered 120ms per panel; `opacity 0→1`, `scale 0.95→1`, `translateZ 20→0` over 600ms `cubic-bezier(0.22, 1, 0.36, 1)`; glitch = 2px RGB split for 150ms via ChromaticAberration intensity pulse.
- **CoreShrine (§4.4):** inherits existing CoreScene physics (pointer rotation, hover intensity, auto-rotation) **unchanged** — extend, don't rewrite. Adds sakura wireframe, fractal branch, **5 iterations**, via `sakuraWireframe.glsl`. Hover → wireframe bloom + petal orbit radius increase. Click → 2-unit camera micro-dolly + panel focus.
- **Contact (§4.5):** semantic `<form>` inside a `HolographicPanel`. Submit → `beacon.glsl` ring expanding `0→40` world units over 800ms + 500-petal radial burst + audio ping. Success text is exactly **"TRANSMISSION ACKNOWLEDGED"**, form fades out.
- **Path-zone layout (§11 resolved):** static left/right pair, Experience left, Work right. **No carousel.**

**Do NOT:** build a carousel/slider for path-zone panels (explicitly rejected in §11); rewrite CoreScene's existing physics; leave placeholder/lorem copy anywhere content constants already exist.

**Verification checklist:**
- [ ] Reveal timing/easing/stagger match exactly
- [ ] Glitch is 2px / 150ms
- [ ] CoreScene's existing pointer/hover/auto-rotate behavior is untouched
- [ ] Sakura wireframe has exactly 5 fractal iterations
- [ ] Path zone is a static two-column layout, not a carousel
- [ ] Contact success text is exactly "TRANSMISSION ACKNOWLEDGED"
- [ ] Beacon ring is 0→40 units / 800ms / 500-particle burst
- [ ] All panels pull from real `page.tsx` content constants

---

## Phase 4 — Polish

**Scope (per §10):** audio system; performance tuning; accessibility audit; cross-browser test; fallback parity.

**Exact specs to hit:**
- **Audio (§4.6):** ambient = 40Hz sine + filtered noise at −35dB, looped; petal rustle = granular synthesis triggered above a scroll-velocity threshold; beacon ping = 880Hz→440Hz exponential decay at −20dB; toggle persists in `localStorage`; audio respects `prefers-reduced-motion` (stays off when reduced motion is on).
- **Performance (§8):** 60fps desktop, 30fps mobile fallback, <16ms GPU frame time, <250KB gz WebGL bundle chunk, <1.5s fallback initial paint. Report *measured* numbers, not assumed ones.
- **Contrast (§6.4):** cream/void 14.2:1, teal/indigo 7.1:1, magenta/void 9.3:1, phosphor/void 11.8:1 — verify with an actual contrast checker.

**Verification checklist:**
- [ ] Audio defaults OFF, toggle persists in `localStorage`
- [ ] Audio respects reduced-motion
- [ ] Measured FPS reported against §8 targets
- [ ] Bundle analyzer output for the WebGL chunk reported against the 250KB gz target
- [ ] Contrast ratios verified against §6.4, not eyeballed
- [ ] Fallback and full-fidelity experience have identical content (no drift)

---

## If DeepSeek still cuts corners

- Keep phases in **separate sessions or branches**. Never let it attempt the whole spec in one pass — that's the single biggest cause of quiet scope-shrinking on a flash-tier model.
- Reject any "done" claim that doesn't cite a specific `file:line` for each checklist item. "Particle count set" is not an answer; "15000/5000, `PetalSystem.tsx:42`" is.
- Keep `design.md` in context every session — don't rely on it remembering a prior session's understanding of the spec.
- Phase 2 (GPU petal sim + shaders) is the highest-complexity, highest-risk-of-simplification phase. If it keeps degrading here specifically, consider running just that phase on a stronger model and handing the rest back to Flash.

