export type User = {
  id: string;
  name: string;
  programme: string;
  topics: string[];
  nearby: boolean;
  helper: boolean;
  lat: number;
  lng: number;
  blocked: string[];
  demo?: boolean;
  university?: string;
  level?: string;
  modules?: string[];
  strengths?: string[];
  goal?: string;
  studyTime?: "mornings" | "afternoons" | "evenings" | "weekends" | "flexible";
  studyFormat?: "examples" | "practice" | "discussion" | "reading";
  area?: string;
  onboardingCompletedAt?: string;
};
export type ModuleOutline = {
  id: string;
  userId: string;
  title: string;
  text: string;
  confirmed: boolean;
};
export type Outcome = { id: string; outlineId: string; text: string };
export type StallState = {
  userId: string;
  lastActivity: string;
  status: "stalled" | "active" | "unstuck";
};
export type RestartTask = {
  id: string;
  userId: string;
  outlineId: string;
  title: string;
  outcomes: string[];
  rubric: string[];
  minutes: number;
};
export type Submission = {
  id: string;
  userId: string;
  taskId: string;
  text: string;
  photoUrl?: string;
  score: number;
  feedback: string;
  createdAt: string;
};
export type ProofStamp = {
  id: string;
  userId: string;
  kind: "restart" | "unstuck";
  title: string;
  sourceId: string;
  createdAt: string;
};
export type MapPin = {
  id: string;
  userId: string;
  kind: "desk" | "buddy";
  title: string;
  lat: number;
  lng: number;
};
export type HelpRequest = {
  id: string;
  fromId: string;
  toId: string;
  topic: string;
  note: string;
  status: "pending" | "accepted" | "completed" | "declined";
  completedBy: string[];
  createdAt: string;
};
export type HelpSessionMessage = {
  id: string;
  requestId: string;
  userId: string;
  text: string;
  createdAt: string;
};
export type CoachMessageLog = {
  id: string;
  userId: string;
  role: "coach" | "user";
  text: string;
  createdAt: string;
};
export type State = {
  users: User[];
  outlines: ModuleOutline[];
  outcomes: Outcome[];
  stalls: StallState[];
  tasks: RestartTask[];
  submissions: Submission[];
  stamps: ProofStamp[];
  pins: MapPin[];
  requests: HelpRequest[];
  messages: HelpSessionMessage[];
  coach: CoachMessageLog[];
  reports: { id: string; userId: string; targetId: string; reason: string }[];
};
export const id = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export function seedState(): State {
  const ago = new Date(Date.now() - 6 * 86400000).toISOString();
  return {
    users: [
      {
        id: "amaka",
        name: "Amaka Okafor",
        programme: "MIVA · BSc Computer Science",
        topics: ["REST APIs", "Node.js"],
        nearby: true,
        helper: false,
        lat: 6.51,
        lng: 3.37,
        blocked: [],
        demo: true,
      },
      {
        id: "tunde",
        name: "Tunde Adeyemi",
        programme: "MIVA · BSc Computer Science",
        topics: ["REST APIs", "Node.js", "Testing"],
        nearby: true,
        helper: true,
        lat: 6.516,
        lng: 3.37,
        blocked: [],
        demo: true,
      },
      {
        id: "chioma",
        name: "Chioma Eze",
        programme: "MIVA · BSc Computer Science",
        topics: ["Testing", "Study planning"],
        nearby: true,
        helper: true,
        lat: 6.513,
        lng: 3.378,
        blocked: [],
        demo: true,
      },
    ],
    outlines: [
      {
        id: "node",
        userId: "amaka",
        title: "REST, Auth & Testing a Node endpoint",
        text: "Build a REST endpoint. Protect a route with authentication. Test an endpoint.",
        confirmed: true,
      },
    ],
    outcomes: [
      { id: "o1", outlineId: "node", text: "Build a REST endpoint" },
      {
        id: "o2",
        outlineId: "node",
        text: "Protect a route with authentication",
      },
      { id: "o3", outlineId: "node", text: "Test an endpoint" },
    ],
    stalls: [{ userId: "amaka", lastActivity: ago, status: "stalled" }],
    tasks: [
      {
        id: "restart-node",
        userId: "amaka",
        outlineId: "node",
        title: "Make one endpoint work",
        outcomes: ["Build a REST endpoint"],
        rubric: [
          "Describe the action you took (at least 40 characters).",
          "Connect your evidence to a word in the confirmed outcome.",
          "Include a result: an observation, test, response, or what you learned.",
        ],
        minutes: 12,
      },
    ],
    submissions: [],
    stamps: [],
    pins: [
      {
        id: "desk-chioma",
        userId: "chioma",
        kind: "desk",
        title: "Quiet study desk · Yaba",
        lat: 6.513,
        lng: 3.378,
      },
    ],
    requests: [],
    messages: [],
    coach: [
      {
        id: "welcome",
        userId: "amaka",
        role: "coach",
        text: "Hey Amaka 👋 It’s been 6 days since your last step on REST, Auth & Testing. No catching up today. Just 12 minutes. Ready for one small restart? Reply “stuck” if you could use a friend.",
        createdAt: ago,
      },
    ],
    reports: [],
  };
}
export function distance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const r = Math.PI / 180;
  const x =
    Math.sin(((b.lat - a.lat) * r) / 2) ** 2 +
    Math.cos(a.lat * r) *
      Math.cos(b.lat * r) *
      Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
export function visiblePeers(s: State, u: User) {
  return u.nearby
    ? s.users
        .filter(
          (p) =>
            p.id !== u.id &&
            p.nearby &&
            !u.blocked.includes(p.id) &&
            !p.blocked.includes(u.id) &&
            distance(u, p) <= 1.6,
        )
        .map((p) => ({
          id: p.id,
          name: p.name,
          programme: p.programme,
          topics: p.topics,
          strengths: p.strengths,
          nearby: p.nearby,
          helper: p.helper,
          lat: p.lat,
          lng: p.lng,
          distance: `~${(distance(u, p) / 1.609).toFixed(1)} mi`,
        }))
    : [];
}
export function completeHelp(s: State, r: HelpRequest, userId: string) {
  if (r.status !== "accepted" && r.status !== "completed")
    throw new Error("Accept this request before completing it.");
  if (![r.fromId, r.toId].includes(userId))
    throw new Error("Not a participant.");
  if (!r.completedBy.includes(userId)) r.completedBy.push(userId);
  if (r.completedBy.length === 2) {
    r.status = "completed";
    for (const uid of [r.fromId, r.toId]) {
      if (!s.stamps.some((x) => x.userId === uid && x.sourceId === r.id))
        s.stamps.push({
          id: id(),
          userId: uid,
          kind: "unstuck",
          title: "Better, together",
          sourceId: r.id,
          createdAt: now(),
        });
      const st = s.stalls.find((x) => x.userId === uid);
      if (st) {
        st.status = "unstuck";
        st.lastActivity = now();
      }
    }
  }
}
