#!/usr/bin/env python3
"""Rebuild the CampusSignal brand assets.

Optional design tooling. Nothing in `npm run build` calls it; the generated files
are committed. Run it from the repo root after `npm install`:

    pip install fonttools brotli pillow playwright   # local tooling only
    python3 scripts/brand/build_brand.py

Outputs:
  public/brand/*.svg               symbol, wordmark, lockups, favicon, app icons
  public/brand/*.png               32px icon, 180 Apple touch icon, 192/512 app icons, lockup@2x
  public/favicon.ico               16, 32 and 48px
  components/brand/paths.ts        path data for the React <Logo> component

The wordmark is drawn from Archivo (SIL Open Font License 1.1, bundled via
@fontsource-variable/archivo), instanced at wght 800 / wdth 96 and outlined to
SVG paths, then customised: the i-dot becomes the symbol's round signal dot, the
final l gains a short rounded forward foot, and the spacing is hand-set.
"""
import asyncio, json, os, re
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "brand")
FONT = os.path.join(ROOT, "node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2")

INK, CREAM, YEL, YEL_D, COB = "#17140f", "#f6efdf", "#ffd23f", "#ffd84d", "#2347d6"

# ---------------------------------------------------------------- symbol
# "Opening": two rounded L-blocks (learners) leave a stepped channel that runs
# up and to the right, where the signal dot marks the next step. 48-unit grid:
# block thickness 13, outer corner radius 10, inner radius 4, gaps of 4-5.
A = "M14 4H23A4 4 0 0 1 27 8V13A4 4 0 0 1 23 17H21A4 4 0 0 0 17 21V23A4 4 0 0 1 13 27H8A4 4 0 0 1 4 23V14A10 10 0 0 1 14 4Z"

def rotate180(d):
    """Rotate a path 180deg about (24,24). Arc sweep flags are preserved."""
    toks = re.findall(r"[A-Za-z]|-?\d*\.?\d+", d); i = 0; cmd = None; out = []
    while i < len(toks):
        t = toks[i]
        if t.isalpha(): cmd = t; out.append(t); i += 1; continue
        if cmd in "ML": out.append(f"{48-float(t):g} {48-float(toks[i+1]):g}"); i += 2
        elif cmd in "HV": out.append(f"{48-float(t):g}"); i += 1
        elif cmd == "A":
            rx, ry, rot, la, sw, x, y = toks[i:i+7]
            out.append(f"{rx} {ry} {rot} {la} {sw} {48-float(x):g} {48-float(y):g}"); i += 7
    return "".join(out)

B = rotate180(A)
DOT = (37.5, 10.5, 5.5)
MARK = f'<path d="{A}"/><path d="{B}"/><circle cx="{DOT[0]}" cy="{DOT[1]}" r="{DOT[2]}"/>'
# Pixel-fit favicon geometry on a 16 grid: same idea, snapped for 16-32px.
FAV_MARK = ("M2 4.5A2.5 2.5 0 0 1 4.5 2H8A1 1 0 0 1 9 3V5A1 1 0 0 1 8 6H7A1 1 0 0 0 6 7V8A1 1 0 0 1 5 9H3A1 1 0 0 1 2 8Z"
            "M14 11.5A2.5 2.5 0 0 1 11.5 14H8A1 1 0 0 1 7 13V11A1 1 0 0 1 8 10H9A1 1 0 0 0 10 9V8A1 1 0 0 1 11 7H13A1 1 0 0 1 14 8Z"
            "M10 4A2 2 0 1 0 14 4A2 2 0 1 0 10 4Z")

# ---------------------------------------------------------------- wordmark
def build_wordmark(wght=800, wdth=96, foot=0.55):
    font = instantiateVariableFont(TTFont(FONT), {"wght": wght, "wdth": wdth})
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); hmtx = font["hmtx"]
    ASC = 760; text = "CampusSignal"; track = -14
    kern = {("C","a"): -6, ("u","s"): -4, ("s","S"): 4, ("S","i"): -6, ("g","n"): -4, ("n","a"): -4, ("a","l"): -6}
    x = 0; glyphs = []; boxes = []; dot = None; lbox = None
    for i, ch in enumerate(text):
        name = cmap[ord(ch)]; bp = BoundsPen(gs); gs[name].draw(bp); bounds = bp.bounds
        boxes.append((x, bounds))
        if ch == "l" and i == len(text) - 1:
            lbox = (x, bounds)
        else:
            pen = SVGPathPen(gs); tp = TransformPen(pen, (1, 0, 0, -1, x, ASC))
            (gs["dotlessi"] if ch == "i" else gs[name]).draw(tp)
            glyphs.append(pen.getCommands())
            if ch == "i":
                sb = BoundsPen(gs); gs["dotlessi"].draw(sb)
                stem = sb.bounds[2] - sb.bounds[0]
                dot = (x + (sb.bounds[0] + sb.bounds[2]) / 2, round(stem * 0.54))
        x += hmtx[name][0] + track + kern.get((ch, text[i+1] if i + 1 < len(text) else None), 0)
    # Custom final l: the symbol's L-step as a short rounded forward foot.
    lx, lb = lbox; x0 = lx + lb[0]; x1 = lx + lb[2]; w = x1 - x0; top = ASC - lb[3]; base = ASC
    h = round(w * .86); R = round(w * .5); ri = round(w * .22); rend = round(h * .32); xe = x1 + round(w * foot)
    glyphs.append(f"M{x0:.1f} {top:.1f}H{x1:.1f}V{base-h-ri:.1f}A{ri} {ri} 0 0 0 {x1+ri:.1f} {base-h:.1f}"
                  f"H{xe-rend:.1f}A{rend} {rend} 0 0 1 {xe:.1f} {base-h+rend:.1f}V{base-rend:.1f}"
                  f"A{rend} {rend} 0 0 1 {xe-rend:.1f} {base:.1f}H{x0+R:.1f}A{R} {R} 0 0 1 {x0:.1f} {base-R:.1f}Z")
    # Round signal dot, lifted clear of the x-height.
    cx, r = dot; cy = (ASC - 527) - 62 - r
    dotpath = f"M{cx-r:.1f} {cy:.1f}A{r} {r} 0 1 0 {cx+r:.1f} {cy:.1f}A{r} {r} 0 1 0 {cx-r:.1f} {cy:.1f}Z"
    rnd = lambda s: re.sub(r"-?\d+\.\d+", lambda m: str(round(float(m.group()))), s)
    minx = min(bx + b[0] for bx, b in boxes); miny = min(cy - r, min(ASC - b[3] for _, b in boxes))
    maxy = max(ASC - b[1] for _, b in boxes)
    vb = (round(minx), round(miny), round(xe - minx), round(maxy - miny))
    return {"glyphs": rnd("".join(glyphs)), "dot": rnd(dotpath), "vb": vb, "baseline": ASC}

# ---------------------------------------------------------------- assets
def svg(vb, body, label="CampusSignal"):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="{label}"><title>{label}</title>{body}</svg>\n'

def tile(fill=YEL, mark=INK, stroke=INK):
    return (f'<rect x="1.5" y="1.5" width="45" height="45" rx="10.5" fill="{fill}" stroke="{stroke}" stroke-width="3"/>'
            f'<g fill="{mark}" transform="translate(24 24) scale(.66) translate(-24 -24)">{MARK}</g>')

def write_assets(W):
    vx, vy, vw, vh = W["vb"]; os.makedirs(OUT, exist_ok=True)
    wm = lambda ink, dot: f'<path fill="{ink}" d="{W["glyphs"]}"/><path fill="{dot}" d="{W["dot"]}"/>'
    cap = 699; s = 48 * .42 / cap; gap = 13
    def lockup(tb, ink, dot):
        tx = 48 + gap - vx * s; ty = 24 + cap * s / 2 - W["baseline"] * s
        return f"0 0 {48+gap+vw*s:.2f} 48", tb + f'<g transform="translate({tx:.3f} {ty:.3f}) scale({s:.6f})">{wm(ink, dot)}</g>'
    def stacked(tb, ink, dot):
        s2 = 150 / vw; t = f'<g transform="translate(47 0) scale({56/48:.6f})">{tb}</g>'
        return f"0 0 150 {70+vh*s2:.2f}", t + f'<g transform="translate({-vx*s2:.3f} {70-vy*s2:.3f}) scale({s2:.6f})">{wm(ink, dot)}</g>'
    files = {
        "symbol.svg": ("0 0 48 48", f'<g fill="{INK}">{MARK}</g>'),
        "symbol-reversed.svg": ("0 0 48 48", f'<g fill="{CREAM}">{MARK}</g>'),
        "symbol-tile.svg": ("0 0 48 48", tile()),
        "wordmark.svg": (f"{vx} {vy} {vw} {vh}", wm(INK, COB)),
        "wordmark-mono.svg": (f"{vx} {vy} {vw} {vh}", wm(INK, INK)),
        "wordmark-reversed.svg": (f"{vx} {vy} {vw} {vh}", wm(CREAM, YEL_D)),
        "lockup-horizontal.svg": lockup(tile(), INK, COB),
        "lockup-horizontal-mono.svg": lockup(f'<g fill="{INK}">{MARK}</g>', INK, INK),
        "lockup-horizontal-reversed.svg": lockup(tile(YEL_D, INK, CREAM), CREAM, YEL_D),
        "lockup-stacked.svg": stacked(tile(), INK, COB),
        "lockup-stacked-reversed.svg": stacked(tile(YEL_D, INK, CREAM), CREAM, YEL_D),
        "favicon.svg": ("0 0 16 16", f'<rect width="16" height="16" rx="3.5" fill="{YEL}"/><path fill="{INK}" d="{FAV_MARK}"/>'),
        "app-icon-square.svg": ("0 0 48 48", f'<rect width="48" height="48" fill="{YEL}"/><g fill="{INK}" transform="translate(24 24) scale(.62) translate(-24 -24)">{MARK}</g>'),
        "app-icon-rounded.svg": ("0 0 48 48", f'<rect width="48" height="48" rx="11" fill="{YEL}"/><g fill="{INK}" transform="translate(24 24) scale(.66) translate(-24 -24)">{MARK}</g>'),
    }
    for name, (vb, body) in files.items():
        open(os.path.join(OUT, name), "w").write(svg(vb, body))
    ts = ("// Generated by scripts/brand/build_brand.py. Do not hand-edit paths.\n"
          "// Wordmark outlines derived from Archivo (SIL Open Font License 1.1), customised.\n"
          f"export const SYMBOL_PATHS = {json.dumps([A, B])} as const;\n"
          f"export const SYMBOL_DOT = {{ cx: {DOT[0]}, cy: {DOT[1]}, r: {DOT[2]} }} as const;\n"
          f"export const FAVICON_PATH = {json.dumps(FAV_MARK)};\n"
          f'export const WORDMARK_VIEWBOX = "{vx} {vy} {vw} {vh}";\n'
          f"export const WORDMARK_GLYPHS = {json.dumps(W['glyphs'])};\n"
          f"export const WORDMARK_DOT = {json.dumps(W['dot'])};\n")
    open(os.path.join(ROOT, "components/brand/paths.ts"), "w").write(ts)

async def rasterise():
    """Render PNGs with the bundled Chromium at exact pixel sizes, then pack the ICO."""
    from playwright.async_api import async_playwright
    from PIL import Image
    tmp = os.path.join(OUT, ".render.html")
    jobs = [("favicon.svg", 16, "/tmp/cs-fav16.png"), ("favicon.svg", 32, f"{OUT}/icon-32.png"),
            ("favicon.svg", 48, "/tmp/cs-fav48.png"), ("app-icon-square.svg", 180, f"{OUT}/apple-touch-icon.png"),
            ("app-icon-rounded.svg", 192, f"{OUT}/icon-192.png"), ("app-icon-rounded.svg", 512, f"{OUT}/icon-512.png")]
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for src, size, out in jobs:
            pg = await b.new_page(viewport={"width": size, "height": size})
            open(tmp, "w").write(f'<body style="margin:0"><img src="{src}" width="{size}" height="{size}" style="display:block">')
            await pg.goto("file://" + tmp); await pg.wait_for_timeout(150)
            await pg.screenshot(path=out, omit_background=True); await pg.close()
        pg = await b.new_page(viewport={"width": 600, "height": 200}, device_scale_factor=2)
        open(tmp, "w").write('<body style="margin:0"><img id=i src="lockup-horizontal.svg" style="height:96px;display:block">')
        await pg.goto("file://" + tmp); await pg.wait_for_timeout(150)
        await pg.locator("#i").screenshot(path=f"{OUT}/lockup-horizontal@2x.png", omit_background=True)
        await b.close()
    os.remove(tmp)
    ims = [Image.open(f).convert("RGBA") for f in ("/tmp/cs-fav16.png", f"{OUT}/icon-32.png", "/tmp/cs-fav48.png")]
    ims[2].save(os.path.join(ROOT, "public/favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)], append_images=ims[:2])

if __name__ == "__main__":
    write_assets(build_wordmark())
    asyncio.run(rasterise())
    print("Brand assets written to public/brand, public/favicon.ico and components/brand/paths.ts")
