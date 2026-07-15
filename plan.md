# Cogent — Immersive Marketing Site Plan

> Goal: turn `iocogent.com` from a plain support/legal page into an immersive,
> 3D-forward marketing site that explains what Cogent does — in the spirit of
> [lusion.co](https://lusion.co/projects/devin_ai) and [le-lab.io](https://le-lab.io/)
> — while preserving the existing legal pages exactly where they are.

---

## 1. The repo decision (answering "same repo or separate?")

**Recommendation: keep the *app* and the *website* in separate repos (they already are),
but keep the *marketing site and the legal pages together* in this one repo.**

Three distinct things, three correct homes:

| Thing | Repo | Why |
|---|---|---|
| The product (RN/Expo + server) | `C:\Repos\cogent` | Different toolchain, different deploy target. Do **not** add web-marketing code here. |
| The **entire web presence** (marketing home **+** legal) | `C:\Repos\cogent-legal` (this repo) | Serves the domain. One repo, one deploy, one domain. |
| — | — | — |

### Why not a brand-new separate repo for just the marketing site?

The hard constraint is **DNS + already-submitted URLs**:

- `iocogent.com` (apex, via `CNAME`) can be the custom domain for **exactly one**
  GitHub Pages site. You cannot point two GitHub Pages repos at the same apex domain.
- `/privacy.html`, `/terms.html`, `/delete-account.html` are **already live and
  referenced by the Google Play data-safety form and store listing**. Breaking or
  moving them (e.g. to `legal.iocogent.com`) risks a Play policy flag.

So the safest, simplest structure is: **this repo becomes the whole website.** The
immersive landing page replaces `index.html`; the legal pages stay at their exact
paths and are preserved byte-for-byte. One deploy guarantees the legal URLs never break.

> Optional cosmetic follow-up: rename the GitHub repo `cogent-legal` → `cogent-web`
> later. GitHub keeps the Pages domain binding and auto-redirects the old repo URL.
> Not required to start — the name is just a label.

---

## 2. Hosting

**Recommendation: stay on GitHub Pages, add a build step via GitHub Actions.**

Today the repo raw-serves static HTML. An immersive 3D site needs a bundler, so we add
a build. Two paths:

- **Path A (recommended, least friction):** Keep the domain + DNS exactly as-is.
  Add a GitHub Actions workflow that builds the site and publishes to Pages. `CNAME`
  and `.nojekyll` are carried into the build output. Zero DNS changes, free, nothing
  else moves.
- **Path B (upgrade later if needed):** Migrate to **Cloudflare Pages** or **Vercel**
  for instant preview deploys per-PR and edge caching of heavier WebGL assets. Costs a
  one-time DNS re-point of the `CNAME`. Worth it only if build/preview friction becomes
  real; not needed to launch.

Start with Path A.

---

## 3. Tech stack

**Astro + React islands + Three.js (React Three Fiber) + GSAP/Lenis + Tailwind.**

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Astro** | Static output; ships **zero JS by default** and hydrates heavy interactive "islands" only where the 3D lives. Lets us drop the existing legal HTML into `public/` untouched, so those URLs stay byte-identical. |
| 3D | **Three.js** via `@react-three/fiber` + `@react-three/drei` | Industry standard for this class of site; R3F keeps scenes declarative and componentized. |
| Scroll / motion | **Lenis** (smooth scroll) + **GSAP ScrollTrigger** | The scroll-linked "scene" choreography that defines this genre. |
| Styling | **Tailwind** | You already work in NativeWind/Tailwind; reuse the muscle memory + the app's tokens. |
| Post-processing | `@react-three/postprocessing` (bloom, chromatic aberration) | The glow/haze that sells the "thought/mind" aesthetic. |

Alternative if you want less framework: **Vite + vanilla TS + Three.js**, with legal
pages kept as static files. Lighter conceptually, but you hand-roll more. Astro is the
better fit given there are content pages *and* one heavy interactive page.

---

## 4. Site structure

```
/                      → immersive marketing landing (the new experience)
/privacy.html          → PRESERVED byte-for-byte (Play-referenced)
/terms.html            → PRESERVED byte-for-byte (Play-referenced)
/delete-account.html   → PRESERVED byte-for-byte (Play-referenced)
CNAME, .nojekyll       → carried into build output unchanged
```

The landing is a single scroll-driven narrative (not a multi-page site). Sections:

1. **Hero** — wordmark + tagline, cursor-reactive particle field, "the mind before it decides."
2. **The problem** — the impulsive moment (fast, hot, chaotic).
3. **The core loop** — the 5-stage journey, told as a scroll-linked 3D narrative (§5).
4. **Proof / how it feels** — app UI shown inside a floating glass device frame.
5. **CTA** — join closed testing / get notified + footer links to legal pages.

---

## 5. Creative concept — "Watch a thought cool down"

The 3D metaphor maps 1:1 to Cogent's **core loop**, so the visuals *teach the product*
as you scroll. A stream of glowing particles = a single impulse moving through the pipeline:

| Scroll scene | Loop stage | Visual language | Palette |
|---|---|---|---|
| **1. Impulse** | Brain Dump | Fast, jittery, hot particles racing outward; a spiking pulse-line. | red/amber `#FF453A` `#FF9F0A` |
| **2. Caught** | Gatekeeper (Gemini) | The stream hits a lens/membrane; particles get sorted; bias labels surface ("sunk cost", "FOMO"). | amber → indigo |
| **3. Quarantine** | Adaptive cooling-off | Time dilation — everything slows; a cool orb holds the impulse; a cooling-off ring winds down. | cool blue `#3B82F6` |
| **4. Socratic** | Interrogator (Claude) | Branching light-paths / a dialogue lattice; questions ripple. | indigo `#5E5CE6` |
| **5. Clarity** | Post-Mortem → ELO | Chaos resolves into ordered geometry; a rationality score rises. | calm ink + green `#30D158` |

**Signature interactions**
- Hero particle field reacts to cursor (mouse repulsion / flow field).
- The **"Cogent" wordmark** as a 3D glass/extruded object, or assembled from particles
  that settle into the letters on load (ties to §8 — the wordmark *is* the logo).
- Magnetic CTA buttons; scroll-velocity-driven bloom/haze.
- The small **blue underline** accent from the splash reused as a recurring motif
  (progress rail, section divider, the cooling-off ring).

---

## 6. Design system (inherited from the app)

Pull directly from `apps/mobile/src/constants/theme.ts` so web and app feel like one brand:

- **Background:** `#0D0F14` (primary), `#1A1C22` (elevated)
- **Foreground:** `#F2F2F7`, secondary `rgba(255,255,255,0.6)`, muted `rgba(255,255,255,0.35)`
- **Accents:** blue `#3B82F6`, indigo `#5E5CE6`, purple `#BF5AF2`, green `#30D158`, amber `#FF9F0A`, red `#FF453A`
- **Glass:** border `rgba(255,255,255,0.08)`, fill `rgba(255,255,255,0.05)`
- **Type:** wordmark + display headings; body in Inter (the app's font). Load Inter via
  self-hosted woff2 (no external font CDN → faster, CSP-clean).
- **Radii/spacing:** mirror the app's scale (`8/12/16/20`, `4/8/16/24/32/48`).

---

## 7. Guardrails — performance & accessibility

Immersive sites die on mobile and on accessibility if unguarded. Non-negotiables:

- **`prefers-reduced-motion`** → disable scroll-jacking + heavy motion; serve a calm,
  static (but still beautiful) version. Design this fallback *first*, not last.
- **No-WebGL / low-power fallback** → detect and render a static hero image + CSS-only
  sections. The particle scene is an enhancement, never a requirement to read the page.
- **Mobile budget** → lower particle counts / DPR cap on small screens; lazy-init the
  canvas below the fold; pause rAF when the tab/section isn't visible.
- **SEO/social** → real semantic HTML behind the canvas, meta + OpenGraph tags, so the
  page is indexable and previews well when shared (Play listing, social).
- **Performance budget** → target a fast first paint; the 3D loads progressively behind
  a lightweight hero. Keep the initial JS island small.

---

## 8. Logo / brand assets

The app icon (`~/Downloads/playstore/icon-512.png`) is the perfect centerpiece: a brain
split into a **chaotic, tangled "IMPULSE" hemisphere** (left) and an **ordered, geometric
"LOGIC" hemisphere** (right), neon-on-black. That impulse→logic duality *is* the product
thesis and the spine of the whole narrative (§5).

- **Favicon / tab icon:** `icon-512.png` (in `public/favicon.png` + apple-touch-icon).
- **Hero centerpiece:** the logo, glowing. In Phase 2 the two hemispheres become the
  seed for the 3D — a chaotic particle cloud on the left resolving into faceted, ordered
  geometry on the right.
- **Recurring motifs:** the center-split line and the hot→cool (red→blue→green) palette
  progression echo through the core-loop rail and section accents.
- **OG share image:** `feature-graphic.png` → `public/og.png` (1024×500).
- App screenshots (`~/Downloads/playstore/phone/*`) drive the "A look inside" filmstrip.

---

## 9. Phased roadmap

**Phase 0 — Scaffold & safety net — ✅ DONE**
- Astro 7 + React 19 + Tailwind 4 scaffolded in this repo. `index.html` → `index.legacy.html`;
  `privacy/terms/delete-account.html`, `CNAME`, `.nojekyll` moved to `public/` unchanged.
- GitHub Actions → Pages workflow added (`.github/workflows/deploy.yml`).
- Legal pages verified byte-for-byte identical to live (before build and in `dist/`).

**Phase 1 — Static narrative (no 3D yet) — ✅ DONE**
- Component architecture (`Base` layout + `Hero`, `Duality`, `CoreLoop`, `Showcase`,
  `CTA`, `Footer`) so Phase 2 can drop R3F islands into `#hero-visual` cleanly.
- Full narrative: hero (brain logo) → Impulse/Logic problem → 5-stage core loop with a
  hot→cool rail → app-screenshot filmstrip → CTA → footer. Real App Store CTA.
- Reveal-on-scroll via IntersectionObserver with no-JS + reduced-motion fallbacks (the
  earlier CSS `view()`-timeline approach left the above-the-fold hero invisible on load —
  replaced). Images auto-optimized to WebP (~850 KB → ~25 KB).

**Phase 2 — Hero 3D — ✅ DONE**
- `HeroCanvas.tsx` R3F island (`client:only="react"`): samples the actual logo PNG into
  a particle cloud — chaotic + warm on the Impulse (left) hemisphere, calm + cool on the
  Logic (right) hemisphere — with cursor repulsion, idle sway, and Bloom post-fx.
- **Full-bleed**: the canvas spans the whole hero behind the headline; a radial scrim +
  text-shadows keep the copy legible, and pointer-events pass through the copy so the
  particles react to the cursor across the entire hero (CTA stays clickable).
- Robust fallback chain: reduced-motion, no-WebGL, tainted-canvas, or a thrown error all
  degrade to the static logo (`.hero-logo-fallback`); `.webgl` class (hides the fallback)
  is only added once R3F's `onCreated` fires. Bloom disabled on mobile; DPR capped.
- Island is `client:only`, so the static hero paints first and the 3D loads after.
  Bundle ≈ 934 KB uncompressed (~280 KB gzipped) — a Phase 4 lazy-load/trim candidate.

**Phase 3 — Scroll narrative — ✅ DONE**
- **Lenis** smooth scroll site-wide (Base.astro), reduced-motion aware, with smoothed
  same-page anchor jumps.
- **CoreLoop → sticky scroll scene**: a desktop `position: sticky` canvas visual pairs
  with the scrolling 5 stages. A canvas-2D "impulse cooling" particle field is driven by
  the section's scroll progress — colour interpolates through the stage palette
  (red→amber→blue→indigo→green), agitation calms as you descend, and the active stage
  highlights while the others dim. Centre label tracks the active stage.
- Used a hand-rolled rAF + scroll-progress driver instead of GSAP ScrollTrigger — fewer
  deps and, crucially, programmatically verifiable (the active-stage/colour pipeline was
  confirmed via `setActive`). The 5 stages stay fully readable with no JS / reduced motion
  / on mobile (the scene is pure enhancement; the static list is the fallback).

**Phase 4 — Polish & ship — ✅ DONE (build side)**
- **Favicons**: generated small optimized icons (350 KB → 2.3 KB tab icon) via
  `scripts/gen-favicons.mjs` (sharp); 32/48 + 180 apple-touch.
- **Self-hosted Inter** via `@fontsource-variable/inter` — no external font CDN, CSP-clean
  (verified: 7 woff2 emitted locally, zero `fonts.googleapis`/CDN references).
- **SEO**: `@astrojs/sitemap` (home + the 3 legal pages via `customPages`), `robots.txt`,
  and `SoftwareApplication` JSON-LD structured data.
- **Branded 404** (`src/pages/404.astro` → `dist/404.html`, served by GitHub Pages).
- **Magnetic App Store badges** + keyboard `:focus-visible` rings — both reduced-motion
  (and magnetic also coarse-pointer) aware.
- **A11y / reduced-motion audit**: Lenis, hero canvas, loop scene, and magnetic all skip
  under `prefers-reduced-motion`; reveals + content stay visible; alt text + aria labels
  in place.
- Skipped by choice: full-screen loader and sound (risk > value; hero already loads
  progressively). Cross-device + Lighthouse visual QA still needs a real browser pass.

---

## 11. Deploy runbook (GitHub Pages)

Nothing is pushed yet — the live site is untouched. To go live:

1. **Switch the Pages source** (one-time): GitHub repo → **Settings → Pages → Build and
   deployment → Source → "GitHub Actions"**. (This does not take the current site down;
   the existing deploy stays live until the workflow runs.)
2. **Commit + push to `main`** — the workflow (`.github/workflows/deploy.yml`) builds
   `dist/` and publishes it. Because the build carries `CNAME`, `.nojekyll`, and the legal
   pages at their exact paths, `iocogent.com` and the Play-referenced legal URLs keep
   working.
3. **Verify after deploy**: `/`, `/privacy.html`, `/terms.html`, `/delete-account.html`,
   `/sitemap-index.xml`, `/robots.txt`.

---

## 10. Locked decisions

1. **Stack:** ✅ Astro + React Three Fiber (+ Lenis/GSAP + Tailwind).
2. **Hosting:** ✅ Stay on GitHub Pages, add a GitHub Actions build → Pages workflow.
   No DNS change.
3. **Ambition level:** ✅ Full 5-scene scroll narrative (§5).
4. **Repo name:** keep `cogent-legal` for now (rename to `cogent-web` later is optional
   and cosmetic).
5. **CTA:**
   - **Primary — "Download on the App Store"** →
     `https://apps.apple.com/nz/app/cogent-ai-impulse-interceptor/id6765811032`
     (the app is **live on iOS**).
   - **Secondary — Google Play** → placeholder / "coming soon" (closed testing) until
     the public listing is ready.
```
