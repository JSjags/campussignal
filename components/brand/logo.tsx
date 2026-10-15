import {
  SYMBOL_DOT,
  SYMBOL_PATHS,
  WORDMARK_DOT,
  WORDMARK_GLYPHS,
  WORDMARK_VIEWBOX,
} from "./paths";

/*
 * CampusSignal logo. One inline SVG per variant, coloured by theme tokens:
 *  - full:     yellow tile symbol + wordmark (primary lockup)
 *  - compact:  tile symbol only (tight spaces, mobile headers)
 *  - symbol:   bare mark in currentColor (monochrome contexts)
 *  - wordmark: lettering only
 * tone="mono" drops the tile fill and accent dot so everything follows currentColor.
 * Pass decorative when a surrounding link or heading already names the brand.
 */
type Variant = "full" | "compact" | "symbol" | "wordmark";
type LogoProps = {
  variant?: Variant;
  /** Rendered height in px; width follows the variant's aspect ratio. */
  size?: number;
  tone?: "brand" | "mono";
  decorative?: boolean;
  label?: string;
  className?: string;
};

const [wx, , ww] = WORDMARK_VIEWBOX.split(" ").map(Number);
const TILE = 48;
const GAP = 13;
const CAP = 699; // Archivo cap height in font units
const WM_SCALE = (TILE * 0.42) / CAP;
const BASELINE = 760;

function Mark({ scale = 1 }: { scale?: number }) {
  return (
    <g
      className="logo-mark"
      transform={
        scale === 1
          ? undefined
          : `translate(24 24) scale(${scale}) translate(-24 -24)`
      }
    >
      <path d={SYMBOL_PATHS[0]} />
      <path d={SYMBOL_PATHS[1]} />
      <circle cx={SYMBOL_DOT.cx} cy={SYMBOL_DOT.cy} r={SYMBOL_DOT.r} />
    </g>
  );
}
function Tile({ mono }: { mono: boolean }) {
  if (mono) return <Mark />;
  return (
    <>
      <rect
        className="logo-tile"
        x="1.5"
        y="1.5"
        width="45"
        height="45"
        rx="10.5"
        strokeWidth="3"
      />
      <Mark scale={0.66} />
    </>
  );
}
function Wordmark({ mono }: { mono: boolean }) {
  return (
    <>
      <path className="logo-letters" d={WORDMARK_GLYPHS} />
      <path className={mono ? "logo-letters" : "logo-dot"} d={WORDMARK_DOT} />
    </>
  );
}

export function Logo({
  variant = "full",
  size = 36,
  tone = "brand",
  decorative = false,
  label = "CampusSignal",
  className = "",
}: LogoProps) {
  const mono = tone === "mono";
  let viewBox: string;
  let body: React.ReactNode;
  if (variant === "wordmark") {
    viewBox = WORDMARK_VIEWBOX;
    body = <Wordmark mono={mono} />;
  } else if (variant === "symbol") {
    viewBox = "0 0 48 48";
    body = <Mark />;
  } else if (variant === "compact") {
    viewBox = "0 0 48 48";
    body = <Tile mono={mono} />;
  } else {
    const tx = TILE + GAP - wx * WM_SCALE;
    const ty = 24 + (CAP * WM_SCALE) / 2 - BASELINE * WM_SCALE;
    viewBox = `0 0 ${(TILE + GAP + ww * WM_SCALE).toFixed(2)} 48`;
    body = (
      <>
        <Tile mono={mono} />
        <g
          transform={`translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${WM_SCALE.toFixed(6)})`}
        >
          <Wordmark mono={mono} />
        </g>
      </>
    );
  }
  const [, , vw, vh] = viewBox.split(" ").map(Number);
  const width = Math.round((size * vw) / vh);
  const a11y = decorative
    ? { "aria-hidden": true as const, focusable: "false" as const }
    : { role: "img", "aria-label": label };
  return (
    <svg
      className={`logo logo-${variant} ${mono ? "is-mono" : ""} ${className}`}
      viewBox={viewBox}
      width={width}
      height={size}
      fill="currentColor"
      {...a11y}
    >
      {body}
    </svg>
  );
}
