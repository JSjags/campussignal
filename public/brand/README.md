# CampusSignal brand assets

Final logo, favicon and app-icon files. The usage rules are in [`docs/BRAND.md`](../../docs/BRAND.md).

- `preview.html`: the identity in context (navigation, themes, monochrome, favicon sizes, components).
- `concepts/index.html`: the three explored symbol concepts and why "The Opening" was chosen.
- `preview/`: navigation screenshots taken from a production build for the preview sheet.

The SVGs are hand-readable and editable. Regenerate everything with `python3 scripts/brand/build_brand.py`, which also writes `components/brand/paths.ts` for the React `<Logo>` component and `public/favicon.ico`.
