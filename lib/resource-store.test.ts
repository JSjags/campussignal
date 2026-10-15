import { test } from "node:test";
import assert from "node:assert/strict";
import { createResourceStore, HttpError } from "./resource-store";

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test("an older, slower response cannot overwrite newer data", async () => {
  const calls: ReturnType<typeof deferred<unknown>>[] = [];
  const store = createResourceStore(() => {
    const d = deferred<unknown>();
    calls.push(d);
    return d.promise;
  });
  const first = store.load("help-requests/1");
  const second = store.load("help-requests/1", { force: true });
  calls[1].resolve({ status: "completed" });
  await second;
  calls[0].resolve({ status: "pending" });
  await first;
  assert.deepEqual(store.get("help-requests/1").data, { status: "completed" });
});

test("a mutation response supersedes an in-flight poll", async () => {
  const poll = deferred<unknown>();
  const store = createResourceStore(() => poll.promise);
  const pending = store.load("tasks/t1");
  store.set("tasks/t1", { submissions: ["new"] });
  poll.resolve({ submissions: [] });
  await pending;
  assert.deepEqual(store.get("tasks/t1").data, { submissions: ["new"] });
});

test("concurrent loads share one request (no overlapping polls)", async () => {
  let calls = 0;
  const store = createResourceStore(async () => {
    calls++;
    return { ok: true };
  });
  await Promise.all([
    store.load("coach"),
    store.load("coach"),
    store.load("coach"),
  ]);
  assert.equal(calls, 1);
});

test("background refresh keeps cached data and records a failure separately", async () => {
  let fail = false;
  const store = createResourceStore(async () => {
    if (fail) throw new Error("Network down");
    return ["message"];
  });
  await store.load("coach");
  fail = true;
  await store.load("coach", { force: true });
  const entry = store.get("coach");
  assert.deepEqual(entry.data, ["message"]);
  assert.equal(entry.error, "Network down");
  assert.equal(entry.fetching, false);
});

test("invalidation refetches only matching watched keys", async () => {
  const fetched: string[] = [];
  const store = createResourceStore(async (key) => {
    fetched.push(key);
    return key;
  });
  const stop = [
    store.subscribe("home", () => {}),
    store.subscribe("stamps", () => {}),
  ];
  await store.load("home");
  await store.load("stamps");
  fetched.length = 0;
  await store.invalidate(["stamps"]);
  assert.deepEqual(fetched, ["stamps"]);
  stop.forEach((s) => s());
});

test("401 responses expire the session instead of showing an error", async () => {
  let expired = 0;
  const store = createResourceStore(
    async () => {
      throw new HttpError(401, "Please sign in to continue.");
    },
    { onUnauthorized: () => expired++ },
  );
  await store.load("home");
  assert.equal(expired, 1);
  assert.equal(store.get("home").error, undefined);
});

test("a disposed store (sign-out or persona switch) ignores late responses", async () => {
  const late = deferred<unknown>();
  const store = createResourceStore((key) =>
    key === "home" ? Promise.resolve({ user: "amaka" }) : late.promise,
  );
  await store.load("home");
  const pending = store.load("coach");
  store.dispose();
  late.resolve(["Amaka's private message"]);
  await pending;
  assert.equal(store.get("coach").data, undefined);
  assert.equal(store.get("home").data, undefined);
});
