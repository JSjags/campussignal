/*
 * A tiny keyed cache for client data. Framework-free so it can be unit tested.
 *
 * - Stale-while-revalidate: a refetch keeps the last good data visible.
 * - Request sequencing: only the newest request for a key may write. A slower,
 *   older response (or one superseded by set()) is discarded.
 * - Deduplication: concurrent loads of one key share a single request.
 * - Targeted invalidation: only keys that match are refetched.
 * - dispose(): one store per signed-in user; disposing drops every entry and
 *   ignores late responses, so cached content never crosses accounts.
 */
export type Entry<T = unknown> = {
  data?: T;
  error?: string;
  /** Epoch ms of the last successful load or set(); 0 when never loaded or invalidated. */
  updatedAt: number;
  fetching: boolean;
};

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Fetcher = (key: string) => Promise<unknown>;
type Options = {
  onUnauthorized?: () => void;
  now?: () => number;
};

const EMPTY: Entry = Object.freeze({ updatedAt: 0, fetching: false });

export function createResourceStore(fetcher: Fetcher, options: Options = {}) {
  const now = options.now ?? Date.now;
  const entries = new Map<string, Entry>();
  const listeners = new Map<string, Set<() => void>>();
  const latest = new Map<string, number>();
  const inflight = new Map<string, Promise<void>>();
  let counter = 0;
  let disposed = false;

  function emit(key: string) {
    listeners.get(key)?.forEach((l) => l());
  }
  function get<T = unknown>(key: string): Entry<T> {
    return (entries.get(key) as Entry<T> | undefined) ?? (EMPTY as Entry<T>);
  }
  function patch(key: string, value: Partial<Entry>) {
    if (disposed) return;
    entries.set(key, { ...get(key), ...value });
    emit(key);
  }
  function subscribe(key: string, listener: () => void) {
    let set = listeners.get(key);
    if (!set) listeners.set(key, (set = new Set()));
    set.add(listener);
    return () => {
      set!.delete(listener);
      if (!set!.size) listeners.delete(key);
    };
  }
  /** Fetch a key. Shares an in-flight request unless force is set. */
  function load(key: string, { force = false } = {}): Promise<void> {
    if (disposed) return Promise.resolve();
    const existing = inflight.get(key);
    if (existing && !force) return existing;
    const id = ++counter;
    latest.set(key, id);
    if (!get(key).fetching) patch(key, { fetching: true });
    const request = fetcher(key).then(
      (data) => {
        if (disposed || latest.get(key) !== id) return;
        patch(key, {
          data,
          error: undefined,
          updatedAt: now(),
          fetching: false,
        });
      },
      (err: unknown) => {
        if (disposed || latest.get(key) !== id) return;
        if (err instanceof HttpError && err.status === 401) {
          options.onUnauthorized?.();
          return;
        }
        patch(key, {
          error: err instanceof Error ? err.message : "Something went wrong.",
          fetching: false,
        });
      },
    );
    const tracked = request.finally(() => {
      if (inflight.get(key) === tracked) inflight.delete(key);
    });
    inflight.set(key, tracked);
    return tracked;
  }
  /** Write data from a mutation response. Supersedes any in-flight load. */
  function set<T>(key: string, value: T | ((prev: T | undefined) => T)) {
    if (disposed) return;
    latest.set(key, ++counter);
    inflight.delete(key);
    const prev = get<T>(key).data;
    const data =
      typeof value === "function"
        ? (value as (p: T | undefined) => T)(prev)
        : value;
    patch(key, { data, error: undefined, fetching: false, updatedAt: now() });
  }
  /**
   * Mark matching keys stale. Keys someone is watching refetch immediately;
   * others refetch when next used. Cached data stays visible meanwhile.
   */
  function invalidate(match: string[] | ((key: string) => boolean)) {
    const test =
      typeof match === "function" ? match : (k: string) => match.includes(k);
    const keys = new Set([...entries.keys(), ...listeners.keys()]);
    const loads: Promise<void>[] = [];
    for (const key of keys) {
      if (!test(key)) continue;
      if (entries.has(key)) patch(key, { updatedAt: 0 });
      if (listeners.has(key)) loads.push(load(key, { force: true }));
    }
    return Promise.all(loads).then(() => undefined);
  }
  function dispose() {
    disposed = true;
    entries.clear();
    listeners.clear();
    inflight.clear();
  }
  return {
    get,
    subscribe,
    load,
    set,
    invalidate,
    dispose,
    get disposed() {
      return disposed;
    },
  };
}
export type ResourceStore = ReturnType<typeof createResourceStore>;
