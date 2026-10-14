import test from "node:test";
import assert from "node:assert/strict";
import { seedState, visiblePeers } from "./domain";
import { saveLearning, helperSuggestions, coachReply } from "./learning";
const input = {
  name: "Ada Learner",
  university: "MIVA University",
  programme: "Computer Science",
  level: "200",
  modules: ["APIs"],
  topics: ["Testing"],
  strengths: ["Writing"],
  goal: "Finish my module",
  studyTime: "evenings",
  studyFormat: "examples",
  area: "Yaba",
  lat: 6.51049,
  lng: 3.37049,
  nearby: true,
  helper: true,
};
test("setup saves rounded location and private preferences, without leaking them to peers", () => {
  const s = seedState();
  const u = saveLearning(s, "amaka", input);
  assert.equal(u.lat, 6.51);
  assert.ok(u.onboardingCompletedAt);
  const peer = visiblePeers(s, s.users[1]).find((p) => p.id === u.id)!;
  assert.equal(peer.name, "Ada Learner");
  for (const key of [
    "goal",
    "studyTime",
    "modules",
    "blocked",
    "onboardingCompletedAt",
  ])
    assert.equal(key in peer, false);
  assert.deepEqual(peer.strengths, ["Writing"]);
});
test("discovery and helping require explicit area and strengths", () => {
  const s = seedState();
  assert.throws(() => saveLearning(s, "amaka", { ...input, area: "" }));
  assert.throws(() => saveLearning(s, "amaka", { ...input, strengths: [] }));
  saveLearning(s, "amaka", {
    ...input,
    nearby: false,
    helper: false,
    area: "",
    strengths: [],
  });
  assert.equal(visiblePeers(s, s.users[0]).length, 0);
});
test("suggestions rank relevant strengths and retain block/consent filters", () => {
  const s = seedState();
  s.users[0].topics = ["Testing"];
  s.users[1].strengths = ["Writing"];
  s.users[2].strengths = ["Testing"];
  assert.equal(helperSuggestions(s, s.users[0])[0].id, "chioma");
  s.users[0].blocked.push("chioma");
  assert.equal(helperSuggestions(s, s.users[0])[0].id, "tunde");
  s.users[0].nearby = false;
  assert.equal(helperSuggestions(s, s.users[0]).length, 0);
});
test("coach uses confirmed task context and preferences without inventing outcomes", () => {
  const s = seedState();
  const u = saveLearning(s, "amaka", input);
  assert.match(coachReply(s, u, "plan"), /evenings/);
  assert.match(coachReply(s, u, "plan"), /worked example/);
  assert.match(coachReply(s, u, "practice"), /not an official/);
  s.tasks = [];
  assert.match(coachReply(s, u, "plan"), /confirm your module outcomes first/);
});
