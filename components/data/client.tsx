"use client";
/*
 * Client data layer: one session for the whole app, one cache per signed-in user.
 *
 * SessionProvider lives in the root layout, so it survives navigation. It loads
 * the session once (when a signed-in route is first opened) and again only after
 * events that change it: sign-in, persona switch, profile or onboarding saves,
 * sign-out, or any API request answering 401.
 *
 * The ResourceStore is recreated whenever the user id changes, so one learner's
 * cached data can never render for another.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import type { User } from "@/lib/domain";
import {
  createResourceStore,
  HttpError,
  type Entry,
  type ResourceStore,
} from "@/lib/resource-store";
import { needsSession } from "@/lib/routes";

export async function api<T>(
  path: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const r = await fetch(`/api/${path}`, {
    method: method ?? (body ? "POST" : "GET"),
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  let d: { error?: string } = {};
  try {
    d = await r.json();
  } catch {}
  if (!r.ok)
    throw new HttpError(
      r.status,
      d.error || "Something went wrong. Please try again.",
    );
  return d as T;
}

type SessionStatus = "unknown" | "loading" | "authed" | "anon";
type SessionValue = {
  status: SessionStatus;
  user: User | null;
  /** Re-read the session from the server (after sign-in or persona switch). */
  refresh: () => Promise<User | null>;
  /** Apply a user returned by a mutation (profile/onboarding save). */
  setUser: (user: User) => void;
  /** Forget the user locally; call after the server has signed out. */
  signOut: () => void;
  /** A request was rejected as unauthenticated. */
  expire: () => void;
};
const SessionContext = createContext<SessionValue | null>(null);
const StoreContext = createContext<ResourceStore | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [state, setState] = useState<{
    status: SessionStatus;
    user: User | null;
  }>({ status: "unknown", user: null });
  const seq = useRef(0);
  const refresh = useCallback(async () => {
    const id = ++seq.current;
    setState((s) => (s.status === "unknown" ? { ...s, status: "loading" } : s));
    try {
      const d = await api<{ user: User }>("auth/session");
      if (id === seq.current) setState({ status: "authed", user: d.user });
      return d.user;
    } catch {
      if (id === seq.current) setState({ status: "anon", user: null });
      return null;
    }
  }, []);
  const setUser = useCallback((user: User) => {
    seq.current++;
    setState({ status: "authed", user });
  }, []);
  const signOut = useCallback(() => {
    seq.current++;
    setState({ status: "anon", user: null });
  }, []);
  // Load lazily: the landing and login pages don't need a session.
  useEffect(() => {
    if (state.status === "unknown" && needsSession(path)) void refresh();
  }, [path, state.status, refresh]);
  const userId = state.user?.id ?? null;
  const store = useMemo(
    () =>
      userId
        ? createResourceStore((key) => api(key), { onUnauthorized: signOut })
        : null,
    [userId, signOut],
  );
  useEffect(() => () => store?.dispose(), [store]);
  const value = useMemo<SessionValue>(
    () => ({ ...state, refresh, setUser, signOut, expire: signOut }),
    [state, refresh, setUser, signOut],
  );
  return (
    <SessionContext.Provider value={value}>
      <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    </SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession needs SessionProvider");
  return value;
}
export function useStore() {
  return useContext(StoreContext);
}

const NO_ENTRY: Entry = Object.freeze({ updatedAt: 0, fetching: false });
const noop = () => () => {};

function useDocumentVisible() {
  return useSyncExternalStore(
    (cb) => {
      document.addEventListener("visibilitychange", cb);
      return () => document.removeEventListener("visibilitychange", cb);
    },
    () => document.visibilityState !== "hidden",
    () => true,
  );
}

/**
 * Read a cached resource and keep it fresh.
 * - Revalidates on mount but keeps cached data on screen meanwhile.
 * - poll: refetch every N ms after the previous request finishes (never
 *   overlapping), only while this screen is mounted and the tab is visible.
 */
export function useResource<T>(
  key: string | null,
  { poll }: { poll?: number } = {},
) {
  const store = useStore();
  const visible = useDocumentVisible();
  const entry = useSyncExternalStore(
    store && key ? (cb) => store.subscribe(key, cb) : noop,
    () => (store && key ? store.get<T>(key) : (NO_ENTRY as Entry<T>)),
    () => NO_ENTRY as Entry<T>,
  );
  useEffect(() => {
    if (store && key) void store.load(key);
  }, [store, key]);
  useEffect(() => {
    if (!store || !key || !poll || !visible) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      await store.load(key);
      if (!stopped) timer = setTimeout(tick, poll);
    };
    // Returning to a hidden tab refreshes once, then resumes the interval.
    timer = setTimeout(tick, store.get(key).updatedAt ? poll : 0);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [store, key, poll, visible]);
  useEffect(() => {
    // A tab that becomes visible again catches up straight away.
    if (visible && store && key && poll) void store.load(key);
  }, [visible, store, key, poll]);
  const reload = useCallback(
    () => (store && key ? store.load(key, { force: true }) : Promise.resolve()),
    [store, key],
  );
  return {
    data: entry.data,
    error: entry.error,
    fetching: entry.fetching,
    reload,
  };
}

/** Local busy/error state for one screen's mutations. */
export function useAction() {
  const { expire } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  const run = useCallback(
    async (fn: () => Promise<unknown>) => {
      setError("");
      setBusy(true);
      try {
        await fn();
        return true;
      } catch (e) {
        if (e instanceof HttpError && e.status === 401) expire();
        else if (live.current)
          setError(e instanceof Error ? e.message : "Please try again.");
        return false;
      } finally {
        if (live.current) setBusy(false);
      }
    },
    [expire],
  );
  return { run, busy, error, clearError: () => setError("") };
}
