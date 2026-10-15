# CampusSignal design system

CampusSignal uses **rounded neubrutalism**: warm paper surfaces, crisp near-black outlines, solid offset shadows, generous rounding and bold type. The goal is a confident, friendly, tactile interface. Expressive layouts are kept for the landing page and section headers. Forms, chat and task screens stay calm and predictable.

## Tokens (`app/theme.css`)

All colours, borders, radii, shadows and motion timings are semantic custom properties on `:root` / `[data-theme]`. Components never use raw colour values. If a new role is needed, add a token.

| Group     | Tokens                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Surfaces  | `--bg` (warm off-white), `--surface`, `--surface-sunken`, `--surface-inverse`, `--overlay`                                      |
| Text      | `--text`, `--text-secondary`, `--text-inverse`                                                                                  |
| Lines     | `--border` (outlines), `--divider` (quiet rules), `--shadow-color`, `--shadow-rim` (dark only)                                  |
| Accents   | `--accent` acid yellow, `--cobalt`, `--coral`, `--mint`, each with `--on-*` foreground, `-soft` tint; `--cobalt-text` for links |
| Status    | `--success-bg/-text`, `--warning-bg/-text`, `--error-bg/-text/-border`, `--focus`, `--focus-halo`                               |
| Shape     | `--bw` 2px, `--bw-strong` 3px; `--r-tag` 8, `--r-control` 12, `--r-card` 20, `--r-dialog` 24, `--r-pill`                        |
| Elevation | `--offset-sm/--offset/--offset-lg` (3/5/8px) → `--shadow-sm`, `--shadow`, `--shadow-lg`. Solid, never blurred                   |
| Motion    | `--dur-press` 110ms, `--dur-fast` 160ms, `--dur-base` 220ms, `--dur-slow` 360ms; `--ease-out`, `--ease-press`                   |

### Accent jobs

Each accent has one meaning. Don't give every card its own colour.

- **Yellow:** primary actions, the restart/focus timer, active navigation, the RESTARTED stamp.
- **Cobalt:** peers, connections and links, your own chat bubbles, the UNSTUCK stamp.
- **Mint:** places, success and "open to help".
- **Coral:** attention, such as incoming help requests and stall reminders. Errors use the dedicated error tokens.

Colour never carries status alone. Badges always include text, and alerts include an icon and a message.

### Dark mode

Dark mode is designed separately, not inverted: a warm near-black page, raised brown-black surfaces and cream outlines. Accents are re-tuned (lighter cobalt with dark text) so they keep at least AA contrast. Shadows pair black with a 1px `--shadow-rim` so depth stays visible. Map tiles are filter-inverted in dark mode; markers and attribution use tokens.

Measured contrast (WCAG): body text ≥ 16:1, secondary text ≥ 7.6:1, text on every accent ≥ 6.6:1, status text on status backgrounds ≥ 6:1, in both themes.

### Radii

| Element                           | Radius         |
| --------------------------------- | -------------- |
| Inputs, buttons, icon tiles       | 12px           |
| Cards and panels                  | 20px           |
| Dialogs, login card, privacy band | 24px           |
| Tags and chips                    | 8px            |
| Avatars, stamps, badges, toggles  | circle or pill |

Nested elements use smaller radii than their containers (e.g. a 16px rubric inside a 20px card).

## Typography

The fonts are self-hosted Fontsource packages, so there are no runtime font requests:

- **Archivo:** headings, at weight 800–900.
- **Inter:** body text and forms. Body size is 16px, and inputs are 16px to avoid iOS zoom.
- **Geist Mono:** concise labels, numbering, metadata and timers.

Instrument Serif has been removed. Uppercase applies only to short `.label` text, never to instructions or passages. Headings use `clamp()` sizes, so mobile actions stay above the fold. Paragraphs are capped at `--measure` (68ch).

## Primitives

These are defined in `theme.css`:

- **Buttons:** `.btn` (+ `btn-primary`, `btn-cobalt`, `btn-danger`, `btn-ghost`, `btn-sm`, `btn-block`) and `.icon-btn`. Buttons sit on a solid shadow, lift 1px on hover, and press into the shadow on `:active`. Disabled buttons drop the shadow and switch to a dashed border.
- **Text and cards:** `.text-link` (underlined and yellow), `.card` (+ `is-flat`, `is-sunken`, `is-accent`), and `.card-link` for interactive cards. Only cards that are links shift on hover.
- **Small elements:** `.tile` (category icon tile), `.tag`, `.badge`, `.avatar`, `.num` (numbered steps: `is-current`, `is-done`).
- **Forms:** `.form`, `.toggle-row` (a real checkbox styled as a switch, with an ON/OFF text state), `details.disclosure`, `.two-fields`, `.hint`.
- **Feedback:** `.alert` (error by default; `is-success`, `is-info`, `is-warning`), `.loader`, `.loading-block`, `.full-loading`, `.empty`.
- **Stamps:** `.stamp` (`is-unstuck`, `is-sm`, `is-placeholder`). Stamps are drawn in CSS: a circular badge with a dashed inner ring and an accessible `role="img"` label.
- **Dialog:** `dialog.dialog` with `.dialog-panel`.

Screen layouts live in `app/globals.css`, which also imports Tailwind and Leaflet. Shared React pieces in `components/campus-app.tsx` are `Brand`, `PageHead`, `Avatar`, `Stamp`, `StatusBadge`, `ErrorAlert`, `Empty`, `Loader`, `Stepper` and `SkipLink`.

## Brand

The identity, "The Opening", is documented in [`docs/BRAND.md`](BRAND.md), with assets in `public/brand/`. In the UI, always render it with `<Logo>` from `components/brand/logo.tsx`; `Brand` in `campus-app.tsx` wraps it in a home link.

- **Colour:** it is coloured by `--accent`, `--on-accent`, `--border` and `--brand-dot`, so it follows the theme.
- **Headers:** they show the full lockup when it fits and the compact tile otherwise (app top bar below 640px, landing and login headers below 480px, onboarding header below 380px).
- **Favicons:** favicons, the Apple touch icon and the manifest icons are declared in `app/layout.tsx` metadata.

## Layout

The layout is mobile-first:

- **Mobile:** a top bar (brand, theme, persona switch, avatar) and a fixed rounded bottom nav. Page padding and `scroll-padding-bottom` keep content and focused controls clear of the nav.
- **≥1000px:** a fixed sidebar with numbered navigation.
- **Main/aside screens** (coach, help, map, outline, task, profile) use a single column below 1000px and a `1fr / 320px` grid above it.
- **Landing:** deliberately asymmetric. The hero copy sits beside a composed card cluster with overlapping stamps, and the middle "how it works" step is offset.

## Motion (`components/design/motion.tsx`)

Motion for React plus CSS:

- **Press:** CSS transform/box-shadow on buttons, chips, personas and the file button (110ms).
- **Screens:** one short fade/rise per route (`Reveal`, 240ms). Individual items are never staggered.
- **Onboarding:** `StepTransition` slides ±28px with opacity in the direction of travel (200ms). Focus moves to the step heading.
- **Dialog:** the panel enters with opacity, an 8–14px rise and a slight scale (200ms).
- **Stamps:** `StampLand` plays a restrained spring "landing" only for a stamp earned in the current view (task pass, help completion), or one created in the last 30 minutes that this browser hasn't shown yet (tracked in `localStorage` under `campus-seen-stamps`). Ordinary revisits are still.
- **Connection:** `ConnectionGraphic` draws the You → peer path once. When a session completes, it fills the path and lands a mint check.
- **Loading:** a small three-block loader. The PDF spinner is the only looping animation, and it runs only while work is in progress.

`MotionConfig reducedMotion="user"` and a CSS reduced-motion block remove transforms and transitions. `usePrefersReducedMotion` (live `matchMedia`) also disables the SVG path drawing and Lenis.

## Smooth scrolling (`components/design/smooth-scroll.tsx`)

`SmoothScroll` is mounted once in `DesignProvider`. It owns at most one Lenis instance.

- **Smooth routes:** `/`, `/onboarding`, `/home`, `/outline` (including outcome review), `/stamps` and `/profile`.
- **Native routes:** everything else, including coach, help chat, map, Phone a Friend, tasks/timer and login.
- **Lifecycle:** one instance spans consecutive smooth routes. It is re-measured on navigation, and destroyed only when moving to a native route or when reduced motion turns on. Data refreshes never touch it.
- **Options:** `lerp: 0.16`, `syncTouch: false` (touch stays native), `anchors` (24px offset), `allowNestedScroll`, `stopInertiaOnNavigate`, and `prevent` for textareas, selects, dialogs and Leaflet.
- **Nested scrollers:** chat histories use `data-lenis-prevent` and `overscroll-behavior: contain`.
- **Modals:** `lockScroll()`/`unlockScroll()` (ref-counted) pause Lenis and lock `html` overflow while a modal is open. `scrollbar-gutter: stable` prevents layout shift.
- **CSS:** `html` keeps `scroll-behavior: auto`, so CSS smooth scrolling never competes with Lenis.

## Accessibility

- **Navigation:** a skip link on every shell; `aria-current` on navigation and steps.
- **Labels and states:** visible labels on every field; `role="alert"` errors with icons; `role="status"` for progress and saved states.
- **Dialogs:** a native `<dialog>` with `aria-labelledby`, focus trapping, Escape dismissal, backdrop dismissal and explicit focus restoration to the opener.
- **Focus:** 3px focus outlines (cobalt in light mode, yellow in dark mode) offset from the element.
- **Touch targets:** at least 44px.
- **Long content:** long names, topics and messages wrap (`overflow-wrap: anywhere`).
- **Map:** Leaflet markers have keyboard focus, titles and alt text. Attribution stays visible.

## Verification checklist

1. Run `npm test`, `npm run typecheck` and `npm run build`.
2. Inspect 320/390px and desktop widths, both themes, keyboard-only use, the request dialog (Tab trap, Escape, focus return), and reduced motion.
3. Confirm there is no horizontal overflow and that the bottom nav never covers controls.
4. Walk onboarding, PDF import → confirm outcomes → restart submit → stamp, and request → accept → chat → both complete → UNSTUCK, using disposable local data. Never reset learner data for visual checks.
