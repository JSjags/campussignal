/** Route classification shared by the persistent shell and the screen router. */
export type RouteKind = "public" | "setup" | "app" | "unknown";

const PUBLIC = new Set(["/", "/login"]);
const APP = new Set([
  "/home",
  "/coach",
  "/map",
  "/phone-a-friend",
  "/outline",
  "/stamps",
  "/profile",
]);

export function routeKind(path: string): RouteKind {
  if (PUBLIC.has(path)) return "public";
  if (path === "/onboarding") return "setup";
  if (APP.has(path)) return "app";
  if (/^\/(help|task)\/[^/]+$/.test(path)) return "app";
  return "unknown";
}

/** Signed-in routes need a session before they can render. */
export const needsSession = (path: string) => {
  const kind = routeKind(path);
  return kind === "app" || kind === "setup";
};

/**
 * Chat histories follow new messages only when the learner sent one or is
 * already reading near the bottom; otherwise their position is kept.
 */
export function shouldFollowNewMessages({
  initial,
  sentByMe,
  distanceFromBottom,
  threshold = 96,
}: {
  initial: boolean;
  sentByMe: boolean;
  distanceFromBottom: number;
  threshold?: number;
}) {
  return initial || sentByMe || distanceFromBottom <= threshold;
}
