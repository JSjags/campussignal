---
name: campussignal-design
description: Design and refine CampusSignal screens using its editorial typography, semantic themes, ruled layouts, and restrained motion. Use for CampusSignal UI, styling, theming, responsive layout, or animation changes.
---

# CampusSignal design

Read docs/DESIGN.md and app/theme.css before changing UI. Preserve product and privacy invariants in AGENTS.md.

Use Archivo for headings, Inter for body copy, Geist Mono for concise labels, and Instrument Serif italic for occasional expressive phrases. Fonts are self-hosted. Use semantic theme variables; support light, dark, and system without adding isolated palette values.

Build hierarchy with typography, whitespace, hairline rules, numbered sections, and purposeful SVG connection lines. Keep copy concrete and learner-focused. Avoid generic gradient cards, excessive pills, decorative blobs, emoji decoration, or animated content everywhere.

Use CSS for simple interaction states. Consult the neighboring motion skill for Motion React patterns. Keep transitions restrained, respect reduced motion, and retain keyboard focus. Use Lenis only on the landing page; application routes use native scrolling. Give dialogs accessible names and preserve native focus trapping and Escape dismissal.

Check desktop and narrow mobile layouts, both color themes, keyboard controls, overflow, and real empty/loading/error states. Preserve API behavior when redesigning. Document new reusable design rules in docs/DESIGN.md.
