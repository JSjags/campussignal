"use client";
/*
 * One route-aware Lenis controller for the whole app.
 * - Smooth wheel/trackpad on reading routes only; touch stays native.
 * - Off for reduced motion; kept alive across smooth routes (re-measured on
 *   navigation) and destroyed only when smoothing turns off.
 * - Nested scrollers (chat, dialogs, textareas, selects) stay native.
 * - lockScroll/unlockScroll pause background scrolling for modals.
 */
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type Lenis from "lenis";
import { usePrefersReducedMotion } from "./reduced-motion";

const SMOOTH_ROUTES = new Set([
  "/",
  "/onboarding",
  "/home",
  "/outline",
  "/stamps",
  "/profile",
]);
export const isSmoothRoute = (path: string) => SMOOTH_ROUTES.has(path);

let instance: Lenis | null = null;
let locks = 0;

export function lockScroll() {
  locks += 1;
  if (locks === 1) {
    document.documentElement.classList.add("scroll-locked");
    instance?.stop();
  }
}
export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) {
    document.documentElement.classList.remove("scroll-locked");
    instance?.start();
  }
}

const nativeOnly = (node: HTMLElement) =>
  node.tagName === "TEXTAREA" ||
  node.tagName === "SELECT" ||
  node.tagName === "DIALOG" ||
  node.classList?.contains("leaflet-container");

export function SmoothScroll() {
  const path = usePathname();
  const reduced = usePrefersReducedMotion();
  const enabled = reduced === false && isSmoothRoute(path);
  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let lenis: Lenis | null = null;
    import("lenis").then(({ default: LenisCtor }) => {
      if (disposed || instance) return;
      lenis = new LenisCtor({
        autoRaf: true,
        smoothWheel: true,
        syncTouch: false,
        lerp: 0.16,
        wheelMultiplier: 1,
        anchors: { offset: -24 },
        allowNestedScroll: true,
        stopInertiaOnNavigate: true,
        prevent: nativeOnly,
      });
      instance = lenis;
      if (locks > 0) lenis.stop();
    });
    return () => {
      disposed = true;
      if (lenis) {
        lenis.destroy();
        if (instance === lenis) instance = null;
      }
    };
    // One instance spans consecutive smooth routes; it is only rebuilt when
    // smoothing turns on or off (route group or reduced-motion change).
  }, [enabled]);
  useEffect(() => {
    // New page content: stop any inertia and re-measure the scroll height.
    // Next.js still owns scroll restoration and scroll-to-top.
    if (!instance) return;
    if (locks === 0) {
      instance.stop();
      instance.start();
    }
    instance.resize();
  }, [path]);
  return null;
}
