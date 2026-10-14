"use client";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      {children}
    </motion.div>
  );
}
export function SignalLines({ connected = false }: { connected?: boolean }) {
  const reduced = useReducedMotion();
  return (
    <svg
      className="signal-lines"
      viewBox="0 0 480 280"
      fill="none"
      aria-hidden="true"
    >
      <path className="signal-guide" d="M0 140H480M240 0V280" />
      <circle className="signal-guide" cx="240" cy="140" r="105" />
      <circle className="signal-guide" cx="240" cy="140" r="70" />
      <motion.path
        className="signal-path"
        d="M0 223C110 223 100 60 220 60S353 219 480 100"
        initial={reduced ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: reduced ? 0 : 1.1, ease: "easeInOut" }}
      />
      <motion.path
        className="signal-path secondary"
        d="M0 86C110 86 140 222 269 222S398 56 480 56"
        initial={reduced ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: reduced ? 0 : 1.3, ease: "easeInOut" }}
      />
      <circle cx="144" cy="103" r="5" className="signal-node" />
      <circle cx="345" cy="178" r="5" className="signal-node" />
      {connected && (
        <motion.path
          className="signal-path connection-path"
          d="M144 103L345 178"
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4 }}
        />
      )}
      <path
        className="signal-tick"
        d="M10 10v12M4 16h12M470 258v12M464 264h12"
      />
    </svg>
  );
}
export function LandingScroll({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced !== false) return;
    let disposed = false;
    let instance: { destroy: () => void } | undefined;
    import("lenis").then(({ default: Lenis }) => {
      if (!disposed)
        instance = new Lenis({
          autoRaf: true,
          anchors: true,
          smoothWheel: true,
          syncTouch: false,
          duration: 0.85,
        });
    });
    return () => {
      disposed = true;
      instance?.destroy();
    };
  }, [reduced]);
  return <>{children}</>;
}
export function StampReveal({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 1.12, rotate: -4 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      {children}
    </motion.div>
  );
}
export function RequestDialog({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      node?.close();
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="request-dialog"
      aria-labelledby="request-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Reveal className="modal">{children}</Reveal>
    </dialog>
  );
}
