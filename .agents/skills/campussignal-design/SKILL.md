---
name: campussignal-design
description: Design and refine CampusSignal screens using its rounded neubrutalist system — semantic tokens, crisp outlines, solid offset shadows, purposeful accents, physical press motion and route-aware Lenis. Use for CampusSignal UI, styling, theming, responsive layout, or animation changes.
---

# CampusSignal design

Read `docs/DESIGN.md` and `app/theme.css` before changing UI. Preserve the product, privacy and authorization invariants in `AGENTS.md`, and never change API contracts for visual work.

## Visual rules

- **Look:** rounded neubrutalism. Use a warm off-white `--bg`, `--border` outlines at `--bw` (2px) or `--bw-strong` (3px), and solid shadows (`--shadow-sm` / `--shadow` / `--shadow-lg`) that are never blurred.
- **Radii:** controls 12, cards 20, dialogs 24, tags 8, and circles/pills for avatars, badges, stamps and toggles. Inner radii are smaller than outer radii.
- **Accent jobs:**
  - **Yellow:** primary actions and restarts.
  - **Cobalt:** peers, connections and links.
  - **Mint:** places and success.
  - **Coral:** attention.

  Don't colour every card differently, and never rely on colour alone. Pair it with text or an icon.

- **Type:** Archivo 800–900 headings, Inter body text (16px), and Geist Mono for short labels, numbering and timers. Uppercase is for short labels only. Instrument Serif is not part of the system.
- **Layout:** asymmetry is welcome on the landing page and hero sections. Forms, chat, PDF import and task screens stay predictable, with light decoration.
- **Never:** gradients, glassmorphism, blurred shadows, blobs, emoji decoration, arbitrary rotations (stamps in the landing cluster are the exception), or hover effects on non-interactive content.

## Implementation

- **Primitives:** reuse the classes in `theme.css` (`.btn*`, `.icon-btn`, `.card*`, `.card-link`, `.tile`, `.tag`, `.badge`, `.num`, `.alert*`, `.toggle-row`, `.stamp*`, `.form`, `dialog.dialog`) and the shared React pieces in `components/campus-app.tsx` (`PageHead`, `Stamp`, `Avatar`, `StatusBadge`, `ErrorAlert`, `Empty`, `Loader`, `Stepper`).
- **Screen CSS:** goes in `app/globals.css`, using tokens only. Add a token in `theme.css` for any new colour role, in both `[data-theme]` blocks, and check contrast (AA or better) in light and dark.
- **Themes:** keep the light, dark and system controls and the pre-paint bootstrap in `lib/theme-bootstrap.ts`.

## Brand

- **Rendering:** use `<Logo>` (`components/brand/logo.tsx`) for every brand placement:
  - `variant`: `full`, `compact`, `symbol` or `wordmark`
  - `decorative` when a parent link already names CampusSignal
- **Rules:** never retype the name as styled text, never use an `<img>` of the SVG in the app, and never redraw the mark.
- **Assets and guidance:** follow `docs/BRAND.md` for clear space, minimum sizes, light/dark usage and misuse. Regenerate assets only with `scripts/brand/build_brand.py`.

## Motion

Consult the neighbouring `motion` skill and import from `motion/react`.

- **Press feedback:** CSS on interactive elements only.
- **Screen entrances:** one `Reveal` per screen. Use `StepTransition` for directional steps and `Dialog` for modals (native `<dialog>`, labelled, scroll-locked, focus restored).
- **Stamps:** `StampLand` animates only newly earned stamps (pass `force` when earned in the current view).
- **Connections:** `ConnectionGraphic` tells the peer-help story.
- **Timing:** about 110–250ms, with larger moves under 400ms. Use transform and opacity only, with no layout animation for decoration.
- **Reduced motion:** respect it everywhere. Use `usePrefersReducedMotion` for SVG drawing and anything `MotionConfig` doesn't cover.
- **Lenis:** never create Lenis instances directly. `SmoothScroll` in `components/design/smooth-scroll.tsx` owns the only one.
  - To change which routes are smooth, edit `SMOOTH_ROUTES`. Coach, help chat, map, Phone a Friend and task/timer stay native.
  - Mark nested scrollers with `data-lenis-prevent` and `overscroll-behavior: contain`.
  - Use `lockScroll()`/`unlockScroll()` for any new modal.
  - Never add CSS `scroll-behavior: smooth`.

## Verify

Run `npm test`, `npm run typecheck` and `npm run build`. Then check:

- 320px, 390px and desktop widths for horizontal overflow, with the fixed bottom nav clear of controls
- both themes
- keyboard-only use and visible focus
- dialog trap, Escape and focus return
- reduced motion
- real loading, empty and error states

Use disposable local data for journeys and never reset hosted learner data. Document new reusable rules in `docs/DESIGN.md`.
