import test from "node:test";
import assert from "node:assert/strict";
import {
  seedState,
  visiblePeers,
  completeHelp,
  distance,
  HelpRequest,
} from "./domain";
import { FreeRuleProvider } from "./providers";
test("nearby discovery respects consent, blocks, and 1.6 km radius", () => {
  const s = seedState();
  const u = s.users[0];
  assert.equal(visiblePeers(s, u).length, 2);
  assert.equal(visiblePeers(s, u)[0].distance, "~0.4 mi");
  u.nearby = false;
  assert.equal(visiblePeers(s, u).length, 0);
  u.nearby = true;
  s.users[1].blocked.push(u.id);
  assert.equal(visiblePeers(s, u).length, 1);
  s.users[2].lat = 7;
  assert.equal(visiblePeers(s, u).length, 0);
  assert.ok(distance(u, s.users[1]) < 1.6);
});
test("both participants must complete; stamps are idempotent", () => {
  const s = seedState();
  const r: HelpRequest = {
    id: "help",
    fromId: "amaka",
    toId: "tunde",
    topic: "Node",
    note: "Help",
    status: "accepted",
    completedBy: [],
    createdAt: new Date().toISOString(),
  };
  assert.throws(() => completeHelp(s, r, "chioma"));
  completeHelp(s, r, "amaka");
  assert.equal(s.stamps.length, 0);
  assert.equal(r.status, "accepted");
  completeHelp(s, r, "tunde");
  assert.equal(r.status, "completed");
  assert.equal(s.stamps.length, 2);
  assert.equal(s.stalls[0].status, "unstuck");
  completeHelp(s, r, "tunde");
  assert.equal(s.stamps.length, 2);
});
test("unaccepted sessions cannot complete", () => {
  const s = seedState();
  const r: HelpRequest = {
    id: "help",
    fromId: "amaka",
    toId: "tunde",
    topic: "Node",
    note: "Help",
    status: "pending",
    completedBy: [],
    createdAt: "",
  };
  assert.throws(() => completeHelp(s, r, "amaka"));
  assert.equal(s.stamps.length, 0);
});
test("rule provider extracts source lines and requires action, relevance, and result", () => {
  const ai = new FreeRuleProvider();
  assert.deepEqual(ai.extract("- Build an endpoint\n- Test the endpoint"), [
    "Build an endpoint",
    "Test the endpoint",
  ]);
  const task = seedState().tasks[0];
  assert.equal(ai.score(task, "done").score, 0);
  assert.equal(
    ai.score(
      task,
      "I built a REST endpoint and the test returned a 200 response with the expected JSON.",
    ).score,
    3,
  );
  assert.ok(
    ai.score(
      task,
      "I spent forty minutes thinking about unrelated holiday destinations.",
    ).score < 3,
  );
});
