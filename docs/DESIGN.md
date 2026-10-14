# CampusSignal design system

The visual direction takes inspiration from Artcraft's editorial typography, fine rules, and technical labels. CampusSignal's connection lines and learner-focused content give it its own identity.

## Typography and themes

Self-hosted Fontsource packages provide Archivo headings, Inter body copy, Geist Mono labels and controls, and occasional Instrument Serif italic accents. Fonts require no runtime third-party requests.

`app/theme.css` defines semantic surface, text, border, accent, focus, and status tokens, shared spacing treatment, and responsive styles. Use these tokens for new screens. Light, dark, and system controls persist locally as `campus-theme`; an early bootstrap applies the saved preference before paint. System mode follows device preference changes.

Phone a Friend establishes the detailed visual pattern: numbered sections, ruled process steps, a connection illustration, searchable peers, and a focused native request dialog. Other screens inherit the shared typography, themes, and component styling.

## Motion

Use CSS for simple hover/focus colors. Motion for React powers brief content entrances, SVG connection drawing, and stamp entrances. The root MotionConfig respects reduced motion; SVG paths also handle this preference explicitly. Avoid repeating decorative loops.

Lenis loads dynamically on the landing page only, with native touch behavior. It is disabled for reduced motion and destroyed when leaving the page. Application routes, chat, maps, and forms keep native scrolling.

The request dialog uses native focus trapping, Escape dismissal, and focus restoration. Keep visible focus indicators and accessible control names.

## Skills and verification

Project skills live in `.agents/skills/campussignal-design` and `.agents/skills/motion` (the official Motion skill). The free Motion library and local best-practice instructions require no account or paid service.

For changes, run the production build and typecheck, then inspect desktop/mobile layouts, light/dark themes, search, dialogs, and keyboard navigation. Do not reset learner data for visual checks.
