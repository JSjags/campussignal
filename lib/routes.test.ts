import { test } from "node:test";
import assert from "node:assert/strict";
import { needsSession, routeKind, shouldFollowNewMessages } from "./routes";

test("routes are classified for the persistent shell", () => {
  assert.equal(routeKind("/"), "public");
  assert.equal(routeKind("/login"), "public");
  assert.equal(routeKind("/onboarding"), "setup");
  for (const p of [
    "/home",
    "/coach",
    "/map",
    "/phone-a-friend",
    "/stamps",
    "/profile",
    "/outline",
    "/help/abc",
    "/task/t1",
  ])
    assert.equal(routeKind(p), "app", p);
  assert.equal(routeKind("/help"), "unknown");
  assert.equal(routeKind("/help/a/b"), "unknown");
  assert.equal(needsSession("/"), false);
  assert.equal(needsSession("/login"), false);
  assert.equal(needsSession("/coach"), true);
});

test("chat follows new messages only when appropriate", () => {
  assert.equal(
    shouldFollowNewMessages({
      initial: true,
      sentByMe: false,
      distanceFromBottom: 900,
    }),
    true,
  );
  assert.equal(
    shouldFollowNewMessages({
      initial: false,
      sentByMe: true,
      distanceFromBottom: 900,
    }),
    true,
  );
  assert.equal(
    shouldFollowNewMessages({
      initial: false,
      sentByMe: false,
      distanceFromBottom: 40,
    }),
    true,
  );
  // Reading older messages: keep the position and show "New messages" instead.
  assert.equal(
    shouldFollowNewMessages({
      initial: false,
      sentByMe: false,
      distanceFromBottom: 400,
    }),
    false,
  );
});
