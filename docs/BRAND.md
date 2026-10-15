# CampusSignal brand guide

The product name is always **CampusSignal**: one word with two capitals. This guide covers how the name is drawn and presented.

- **Preview:** `public/brand/preview.html` shows the identity in the real navigation, on light and dark backgrounds, in monochrome, at favicon sizes and beside the product components.
- **Concepts:** `public/brand/concepts/index.html` shows the three concepts that were compared.

## Concept: "The Opening"

Two solid, rounded L-blocks stand for two learners. Between them they leave a stepped channel that runs from the lower left to the upper right, where a round **signal dot** marks the next step. The mark expresses three ideas:

- **Connection:** the opening only exists because both blocks are there.
- **Forward movement:** the channel and the dot both point up and to the right.
- **Achievable progress:** small, chunky steps rather than a summit.

Its square, open silhouette also suggests a campus with no walls.

### Why this concept

It was chosen over "Relay" (two path segments meeting at a node) and "Step signal" (tiles climbing to a dot) on four criteria:

- **Small-size clarity:** solid shapes survive 16px, where strokes blur.
- **Distinctiveness:** an ownable silhouette, rather than a generic stairs or progress pictogram.
- **Product relevance:** it shows peers and the next step at once.
- **System fit:** the blocks share the app's rounded radii, and the tile shares its outlines.

The geometry sits on a 48-unit grid. Each block is 13 units thick, with a 10-unit outer radius and 4-unit inner and end radii. Gaps are 4–5 units, and the dot has a radius of 5.5.

## Wordmark

The wordmark is drawn as SVG paths, so it never depends on an installed font. It starts from Archivo at weight 800 and width 96, outlined, with three changes tied to the symbol:

1. **Signal dot:** the dot of the _i_ is a true circle, lifted slightly. In the colour lockup it carries the accent (cobalt on light, yellow on dark).
2. **Forward step:** the final _l_ ends in a short, rounded foot that turns forward. This is the symbol's L-block in miniature.
3. **Hand-set spacing:** tighter tracking with pair adjustments, tuned for navigation sizes.

Archivo is licensed under the SIL Open Font License 1.1. The OFL permits using the font to create artwork, including outlined lettering in a logo. The licence text ships in `node_modules/@fontsource-variable/archivo/LICENSE`. This is a summary, not legal advice. No trademark search or clearance has been done, and none is claimed.

## Approved lockups

All of these live in `public/brand/`.

| Use                                     | File                                                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Primary horizontal lockup               | `lockup-horizontal.svg` (`@2x.png` raster)                                                           |
| Horizontal, monochrome                  | `lockup-horizontal-mono.svg`                                                                         |
| Horizontal, reversed (dark backgrounds) | `lockup-horizontal-reversed.svg`                                                                     |
| Stacked (title slides, splash, posters) | `lockup-stacked.svg`, `lockup-stacked-reversed.svg`                                                  |
| Compact tile (tight headers, avatars)   | `symbol-tile.svg`                                                                                    |
| Symbol only, one colour                 | `symbol.svg`, `symbol-reversed.svg`                                                                  |
| Wordmark only                           | `wordmark.svg`, `wordmark-mono.svg`, `wordmark-reversed.svg`                                         |
| Favicon / app icons                     | `favicon.svg`, `/favicon.ico`, `icon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` |

In the app, use `<Logo>` from `components/brand/logo.tsx`. Never use an `<img>` of the SVG or retyped text.

| `variant`  | Contents                    |
| ---------- | --------------------------- |
| `full`     | Tile + wordmark             |
| `compact`  | Tile only                   |
| `symbol`   | Bare mark in `currentColor` |
| `wordmark` | Lettering only              |

| Prop          | Behaviour                                                                |
| ------------- | ------------------------------------------------------------------------ |
| `size`        | Height in px; width follows the aspect ratio                             |
| `tone="mono"` | Single colour                                                            |
| `decorative`  | `aria-hidden`. Use when the parent link already says "CampusSignal home" |
| Otherwise     | The logo is `role="img"` with `aria-label="CampusSignal"`                |

Colours come from theme tokens (`--accent`, `--on-accent`, `--border`, `--brand-dot`), so the logo follows light, dark and system themes automatically.

## Colour

| Role                              | Light            | Dark                                  |
| --------------------------------- | ---------------- | ------------------------------------- |
| Signal yellow (tile)              | `#ffd23f`        | `#ffd84d`                             |
| Ink (mark, letters, tile outline) | `#17140f`        | — (mark stays ink on the yellow tile) |
| Letters on dark                   | —                | Cream `#f6efdf`                       |
| Tile outline on dark              | —                | Cream `#f6efdf`                       |
| _i_-dot accent                    | Cobalt `#2347d6` | Yellow `#ffd84d`                      |
| Backgrounds                       | Paper `#fbf6ea`  | Near-black `#15130f`                  |

The symbol never relies on colour, shadow or outline to read. It works in solid ink, solid cream or any single colour that has at least 4.5:1 contrast with its background.

## Clear space and minimum size

- **Clear space:** keep at least ¼ of the tile height clear on every side of any lockup. Navigation, buttons and text sit outside it.
- **Full lockup:** at least 24px tall, which gives a cap height of about 10px. The app uses 36px.
- **Below 24px:** use the compact tile (at least 20px) or the favicon (16px).
- **Below 32px:** use the pixel-snapped favicon artwork (`favicon.svg`, a 16-unit grid). Never shrink the lockup.
- **Responsive headers:** they switch to the compact tile when the full lockup would crowd the controls:
  - app top bar below 640px
  - landing and login headers below 480px
  - onboarding header below 380px

## Light and dark usage

- **Light:** use the yellow tile with an ink outline and ink letters, and a cobalt _i_-dot.
- **Dark:** use the yellow tile with a cream outline and cream letters, and a yellow _i_-dot (`lockup-*-reversed.svg`).
- **Yellow backgrounds:** use the ink monochrome lockup.
- **Photos or busy backgrounds:** place the lockup on a solid paper or ink panel.

## Incorrect usage

- **Shape:** don't rotate, tilt, stretch or squash the logo.
- **Colour:** don't recolour the tile outside the palette, or apply gradients, glows, blurred shadows or transparency.
- **Wordmark:** don't retype "CampusSignal" or "Campus Signal" in a font. Use the supplied wordmark.
- **Placement:** don't place the ink mark at low contrast (for example faded on yellow), or crowd the clear space.
- **Changes:** don't add elements (caps, books, pins, waves) or rearrange the symbol's parts.

## Rebuilding

`scripts/brand/build_brand.py` regenerates every SVG and PNG, `public/favicon.ico` and `components/brand/paths.ts` from the documented geometry and the bundled Archivo file. It is optional local tooling and never runs during `npm run build`. Its requirements are listed in the script header.
