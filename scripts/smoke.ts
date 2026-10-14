// Run against a seeded, disposable LOCAL demo server. This changes demo data.
import assert from "node:assert/strict";
const base = process.env.SMOKE_URL || "http://localhost:3000";
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base))
  throw new Error("Smoke checks only run against a local server.");
const cookies: Record<string, string> = {};
async function request(
  who: string,
  path: string,
  body?: unknown,
  expected = 200,
  method?: string,
) {
  const response = await fetch(`${base}/api/${path}`, {
    method: method ?? (body ? "POST" : "GET"),
    headers: {
      ...(body ? { "Content-Type": "application/json", Origin: base } : {}),
      ...(cookies[who] ? { Cookie: cookies[who] } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  assert.equal(
    response.status,
    expected,
    `${who} ${path}: ${JSON.stringify(data)}`,
  );
  const cookie = response.headers.get("set-cookie");
  if (cookie) cookies[who] = cookie.split(";")[0];
  return data;
}
async function main() {
  await request("anon", "home", undefined, 401);
  for (const who of ["amaka", "tunde", "chioma"])
    await request(who, "auth/demo", { persona: who });
  const home = await request("amaka", "home");
  assert.equal(home.user.id, "amaka");
  assert.equal(home.stall.days, 6);
  await request("tunde", "tasks/restart-node", undefined, 404);
  const map = await request("amaka", "map/pins");
  assert.equal(map.peers.length, 2);
  assert.equal(map.peers[0].distance, "~0.4 mi");
  assert.ok(map.peers.every((p: { blocked?: unknown }) => !p.blocked));
  await request("amaka", "outlines", { title: "x", text: "tiny" }, 400);
  const outline = await request(
    "amaka",
    "outlines",
    {
      title: "Testing module",
      text: "Build a REST endpoint\nTest an endpoint",
    },
    201,
  );
  assert.equal(outline.confirmed, false);
  await request(
    "tunde",
    `outlines/${outline.id}/confirm`,
    { outcomes: ["Build a REST endpoint"] },
    404,
  );
  const task = await request("amaka", `outlines/${outline.id}/confirm`, {
    outcomes: ["Build a REST endpoint"],
  });
  assert.equal(task.outcomes[0], "Build a REST endpoint");
  const taskAgain = await request("amaka", `outlines/${outline.id}/confirm`, {
    outcomes: ["Changed outcome cannot replace a confirmed task"],
  });
  assert.equal(task.id, taskAgain.id);
  const before = (await request("amaka", "stamps")).length;
  const weak = await request("amaka", `tasks/${task.id}/submit`, {
    text: "done",
  });
  assert.equal(weak.score, 0);
  assert.equal((await request("amaka", "stamps")).length, before);
  const proof = {
    text: "I built a REST endpoint and the test returned a 200 response with the expected JSON.",
  };
  const good = await request("amaka", `tasks/${task.id}/submit`, proof);
  assert.equal(good.score, 3);
  await request("amaka", `tasks/${task.id}/submit`, proof);
  assert.equal((await request("amaka", "stamps")).length, before + 1);
  await request(
    "amaka",
    `tasks/${task.id}/submit`,
    { text: proof.text, photoUrl: "javascript:alert(1)" },
    400,
  );
  await request("amaka", "coach/inbound", { text: "stuck" });
  const logs = await request("amaka", "coach");
  assert.match(logs.at(-1).text, /Phone a Friend/);
  const r = await request(
    "amaka",
    "help-requests",
    {
      toId: "tunde",
      topic: "REST APIs",
      note: "I built an endpoint but need help understanding a 401 response.",
    },
    201,
  );
  await request("chioma", `help-requests/${r.id}`, undefined, 404);
  await request("amaka", `help-requests/${r.id}/accept`, {}, 403);
  await request("amaka", `help-requests/${r.id}/complete`, {}, 409);
  await request("tunde", `help-requests/${r.id}/accept`, {});
  await request("tunde", `help-requests/${r.id}/messages`, {
    text: "Check whether your Authorization header includes Bearer.",
  });
  await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      request("tunde", `help-requests/${r.id}/messages`, {
        text: `Concurrent message ${i}`,
      }),
    ),
  );
  const session = await request("amaka", `help-requests/${r.id}`);
  assert.equal(
    session.messages.filter((m: { text: string }) =>
      m.text.startsWith("Concurrent message"),
    ).length,
    5,
  );
  const partial = await request("tunde", `help-requests/${r.id}/complete`, {});
  assert.equal(partial.status, "accepted");
  const done = await request("amaka", `help-requests/${r.id}/complete`, {});
  assert.equal(done.status, "completed");
  await request("amaka", `help-requests/${r.id}/complete`, {});
  assert.equal(
    (await request("amaka", "stamps")).filter(
      (s: { sourceId: string }) => s.sourceId === r.id,
    ).length,
    1,
  );
  assert.equal(
    (await request("tunde", "stamps")).filter(
      (s: { sourceId: string }) => s.sourceId === r.id,
    ).length,
    1,
  );
  await request(
    "tunde",
    `help-requests/${r.id}/messages`,
    { text: "Closed session" },
    409,
  );
  const profile = await request("chioma", "profile");
  await request(
    "chioma",
    "profile",
    { ...profile, nearby: false },
    200,
    "PATCH",
  );
  assert.equal((await request("amaka", "map/pins")).peers.length, 1);
  assert.equal((await request("amaka", "map/pins")).pins.length, 0);
  await request("chioma", "profile", profile, 200, "PATCH");
  await request("amaka", "safety", {
    targetId: "tunde",
    action: "block",
    reason: "Smoke test block",
  });
  await request("tunde", `help-requests/${r.id}`, undefined, 403);
  assert.ok(
    !(await request("amaka", "map/pins")).peers.some(
      (p: { id: string }) => p.id === "tunde",
    ),
  );
  const invalidOrigin = await fetch(`${base}/api/coach/inbound`, {
    method: "POST",
    headers: {
      Origin: "https://invalid.example",
      Cookie: cookies.amaka,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: "hello" }),
  });
  assert.equal(invalidOrigin.status, 403);
  console.log(
    "API smoke checks passed: authentication, privacy, validation, outcomes, evidence, stamps, coach, bilateral help, blocks, and origin checks.",
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
