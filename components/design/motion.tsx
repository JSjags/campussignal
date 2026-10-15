"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { lockScroll, unlockScroll } from "./smooth-scroll";
import { usePrefersReducedMotion } from "./reduced-motion";
export { usePrefersReducedMotion };

/* ---------- Shared transitions ---------- */
export const ease = [0.2, 0.8, 0.2, 1] as const;
export const springPress = {
  type: "spring",
  stiffness: 520,
  damping: 34,
} as const;

/** One short entrance for a whole screen — never per item. */
export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease }}
    >
      {children}
    </motion.div>
  );
}

/** Forward/backward step transition (onboarding). */
export function StepTransition({
  stepKey,
  direction,
  children,
}: {
  stepKey: string | number;
  direction: 1 | -1;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div
        key={stepKey}
        custom={direction}
        variants={{
          enter: (d: number) => ({ opacity: 0, x: d * 28 }),
          center: { opacity: 1, x: 0 },
          exit: (d: number) => ({ opacity: 0, x: d * -28 }),
        }}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.2, ease }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

const short = (v: string) => (v.length <= 3 ? v : v.slice(0, 1)).toUpperCase();

/* ---------- Connection illustration (peer-help story) ---------- */
export function ConnectionGraphic({
  connected = false,
  label = "You",
  peerLabel = "+1",
}: {
  connected?: boolean;
  label?: string;
  peerLabel?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const still = reduced !== false;
  return (
    <svg
      className={`connection-graphic ${connected ? "is-connected" : ""}`}
      viewBox="0 0 320 180"
      fill="none"
      aria-hidden="true"
    >
      <rect
        className="cg-radius"
        x="14"
        y="14"
        width="292"
        height="152"
        rx="22"
      />
      <path
        className="cg-route"
        d="M76 112 C 120 40, 196 150, 244 70"
        strokeDasharray="2 10"
      />
      <motion.path
        className="cg-link"
        d="M76 112 C 120 40, 196 150, 244 70"
        initial={still ? false : { pathLength: 0 }}
        animate={{ pathLength: connected ? 1 : 0.42 }}
        transition={{ duration: still ? 0 : 0.7, ease, delay: still ? 0 : 0.1 }}
      />
      <g className="cg-node cg-you">
        <circle cx="76" cy="112" r="24" />
        <text x="76" y="117" textAnchor="middle">
          {short(label)}
        </text>
      </g>
      <g className="cg-node cg-peer">
        <circle cx="244" cy="70" r="24" />
        <text x="244" y="75" textAnchor="middle">
          {short(peerLabel)}
        </text>
      </g>
      {connected && (
        <motion.g
          className="cg-check"
          initial={still ? false : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...springPress, delay: still ? 0 : 0.55 }}
          style={{ transformOrigin: "160px 98px" }}
        >
          <circle cx="160" cy="98" r="16" />
          <path d="M152 98l6 6 11-12" />
        </motion.g>
      )}
    </svg>
  );
}

/* ---------- Stamps land once, only when newly earned ---------- */
const SEEN_KEY = "campus-seen-stamps";
const FRESH_WINDOW_MS = 30 * 60 * 1000;
function readSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}
function markSeen(key: string) {
  try {
    const list = readSeen().filter((k) => k !== key);
    list.push(key);
    localStorage.setItem(SEEN_KEY, JSON.stringify(list.slice(-200)));
  } catch {}
}
/**
 * `force` animates regardless (a stamp earned in this view).
 * Otherwise a stamp lands only if it was created recently and this
 * browser has not shown it yet — ordinary revisits stay still.
 */
export function StampLand({
  stampKey,
  createdAt,
  force = false,
  children,
}: {
  stampKey: string;
  createdAt?: string;
  force?: boolean;
  children: React.ReactNode;
}) {
  const [fresh] = useState(() => {
    if (force) return true;
    if (typeof window === "undefined" || !createdAt) return false;
    const age = Date.now() - new Date(createdAt).getTime();
    return age >= 0 && age < FRESH_WINDOW_MS && !readSeen().includes(stampKey);
  });
  useEffect(() => {
    markSeen(stampKey);
  }, [stampKey]);
  return (
    <motion.div
      className="stamp-land"
      initial={fresh ? { opacity: 0, scale: 1.3, rotate: -8 } : false}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 22, mass: 0.8 }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Accessible modal dialog ---------- */
export function Dialog({
  children,
  onClose,
  labelledBy,
}: {
  children: React.ReactNode;
  onClose: () => void;
  labelledBy: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    node?.showModal();
    lockScroll();
    return () => {
      node?.close();
      unlockScroll();
      // Native dialogs restore focus on close; keep it explicit for unmount.
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="dialog"
      aria-labelledby={labelledBy}
      aria-modal="true"
      data-lenis-prevent
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="dialog-panel"
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease }}
      >
        {children}
      </motion.div>
    </dialog>
  );
}

/** Stable id helper for labelling dialogs and regions. */
export function useLabelId(prefix: string) {
  return `${prefix}-${useId().replace(/:/g, "")}`;
}
