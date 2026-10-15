"use client";
import { useSyncExternalStore } from "react";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
function subscribe(callback: () => void) {
  const media = window.matchMedia(REDUCED_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
/** `null` until the client knows; then tracks live changes to the OS setting. */
export function usePrefersReducedMotion(): boolean | null {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => null,
  );
}
