"use client";
import Link from "next/link";
import Onboarding from "./onboarding";
import PdfImport from "./pdf-import";
import { ThemeSwitch } from "./design/theme";
import {
  Reveal,
  SignalLines,
  LandingScroll,
  StampReveal,
  RequestDialog,
} from "./design/motion";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowDown,
  Search,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Compass,
  Flag,
  Heart,
  Home,
  Leaf,
  MapPin as Pin,
  MessageCircle,
  Plus,
  Radio,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
  LogOut,
} from "lucide-react";
import type {
  CoachMessageLog,
  HelpRequest,
  HelpSessionMessage,
  MapPin,
  ModuleOutline,
  Outcome,
  ProofStamp,
  RestartTask,
  Submission,
  User,
} from "@/lib/domain";
const NearbyMap = dynamic(() => import("./nearby-map"), {
  ssr: false,
  loading: () => (
    <div className="map-placeholder">Finding your corner of campus…</div>
  ),
});
type Peer = Pick<
  User,
  | "id"
  | "name"
  | "programme"
  | "topics"
  | "nearby"
  | "helper"
  | "lat"
  | "lng"
  | "strengths"
> & { distance: string; matchReason?: string };
type HomeData = {
  user: User;
  stall: { days: number; status: string } | null;
  task?: RestartTask;
  stamps: ProofStamp[];
  requests: HelpRequest[];
  peers: Peer[];
};
type MapData = {
  center: { lat: number; lng: number };
  enabled: boolean;
  peers: Peer[];
  pins: MapPin[];
};
type HelpData = HelpRequest & {
  participants: { id: string; name: string }[];
  messages: HelpSessionMessage[];
  viewerId: string;
};
async function api<T>(
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
  const d = await r.json();
  if (!r.ok)
    throw new Error(d.error || "Something went wrong. Please try again.");
  return d;
}
const nav = [
  { href: "/home", label: "My campus", icon: Home },
  { href: "/coach", label: "My coach", icon: MessageCircle },
  { href: "/map", label: "Nearby", icon: Compass },
  { href: "/phone-a-friend", label: "Phone a Friend", icon: Users },
  { href: "/stamps", label: "My stamps", icon: Star },
];
function Avatar({ name, size = "" }: { name: string; size?: string }) {
  return (
    <span
      className={`avatar ${name.toLowerCase().startsWith("t") ? "peach" : name.toLowerCase().startsWith("c") ? "lilac" : ""} ${size}`}
    >
      {name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}
function Stamp({
  kind = "restart",
  small = false,
}: {
  kind?: string;
  small?: boolean;
}) {
  return (
    <div
      className={`stamp ${kind === "unstuck" ? "blue-stamp" : ""} ${small ? "small-stamp" : ""}`}
    >
      <span>CAMPUS SIGNAL</span>
      {kind === "unstuck" ? <Users /> : <Zap />}
      <strong>{kind === "unstuck" ? "UNSTUCK" : "RESTARTED"}</strong>
      <span>ONE SMALL WIN</span>
    </div>
  );
}
function Heading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
function Empty({
  title,
  text,
  href,
  label,
}: {
  title: string;
  text: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty">
      <Sparkles />
      <h3>{title}</h3>
      <p>{text}</p>
      {href && (
        <Link className="btn primary" href={href}>
          {label}
          <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}
export default function CampusApp() {
  const path = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);
  useEffect(() => {
    let live = true;
    api<{ user: User }>("auth/session")
      .then((d) => {
        if (live) {
          setUser(d.user);
          if (
            !d.user.demo &&
            !d.user.onboardingCompletedAt &&
            !["/", "/login", "/onboarding"].includes(path)
          )
            router.replace("/onboarding");
        }
      })
      .catch(() => {
        if (live) {
          setUser(null);
          if (path !== "/" && path !== "/login") router.replace("/login");
        }
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [path, version, router]);
  async function act(fn: () => Promise<unknown>) {
    setError("");
    setBusy(true);
    try {
      await fn();
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  if (path === "/") return <Landing />;
  if (path === "/login") return <Login act={act} busy={busy} error={error} />;
  if (loading || !user)
    return (
      <div className="loading">
        <Radio />
        <p>Finding your signal…</p>
      </div>
    );
  if (path === "/onboarding" || (!user.demo && !user.onboardingCompletedAt))
    return (
      <div className="setup-page">
        <header className="setup-header">
          <Link href="/home" className="brand">
            campussignal
          </Link>
          <ThemeSwitch />
        </header>
        <Onboarding
          user={user}
          onSaved={(u) => {
            setUser(u);
            refresh();
          }}
        />
      </div>
    );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/home" className="brand">
          <span className="brand-icon">
            <Radio size={24} />
          </span>
          campus<span>signal</span>
          <i />
        </Link>
        <div className="workspace">
          <span className="workspace-icon">
            <BookOpen size={19} />
          </span>
          <div>
            <strong>Your open campus</strong>
            <small>{user.university || "Your university community"}</small>
          </div>
          <span className="online-dot" />
        </div>
        <div className="nav-label">YOUR WORKSPACE</div>
        <nav>
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={path === href ? "active" : ""}
            >
              <Icon size={20} />
              {label}
              {href === "/coach" && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="encouragement">
            <span className="eyebrow">OPEN UNIVERSITY / REAL LIFE</span>
            <Leaf size={24} />
            <p>
              You don’t have to do it all.
              <br />
              <strong>Just the next little thing.</strong>
            </p>
            <span>GROW AT YOUR OWN PACE</span>
          </div>
          <Link className="profile-link" href="/profile">
            <Avatar name={user.name} />
            <span>
              <strong>{user.name.split(" ")[0]}</strong>
              <small>{user.demo ? "Demo learner" : "Your profile"}</small>
            </span>
            <Settings size={17} />
          </Link>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <div>
            <span className="online-dot" />
            LEARN / CONNECT / CONTINUE
          </div>
          <div className="top-actions">
            <ThemeSwitch />
            <span className="location">
              <Pin size={15} /> Your local campus
            </span>
            {user.demo && (
              <Link href="/login" className="demo-tag">
                Switch persona
              </Link>
            )}
            <Link href="/profile" aria-label="Open profile">
              <Avatar name={user.name} size="tiny" />
            </Link>
          </div>
        </header>
        <main key={path}>
          <Reveal>
            {error && (
              <div role="alert" className="alert">
                <span>{error}</span>
                <button aria-label="Dismiss error" onClick={() => setError("")}>
                  <X size={16} />
                </button>
              </div>
            )}
            <Content
              path={path}
              user={user}
              version={version}
              act={act}
              busy={busy}
            />
          </Reveal>
        </main>
        <footer>
          Made for the days life gets in the way.
          <span>
            <ShieldCheck size={14} /> Private by choice. Connected by a little
            courage.
          </span>
        </footer>
      </div>
      <nav className="mobile-nav">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={path === href ? "active" : ""}
          >
            <Icon size={20} />
            <span>
              {label === "Phone a Friend"
                ? "Friends"
                : label.replace("My ", "")}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
type Actions = {
  act: (fn: () => Promise<unknown>) => Promise<void>;
  busy: boolean;
};
function useData<T>(path: string, version: number) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    api<T>(path)
      .then((d) => {
        if (live) {
          setData(d);
          setError("");
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [path, version]);
  return { data, error };
}
function Content({
  path,
  user,
  version,
  act,
  busy,
}: { path: string; user: User; version: number } & Actions) {
  const props = { user, version, act, busy };
  if (path === "/home") return <Dashboard {...props} />;
  if (path === "/coach") return <Coach {...props} />;
  if (path === "/map") return <MapScreen {...props} />;
  if (path === "/phone-a-friend") return <Friends {...props} />;
  if (path.startsWith("/help/"))
    return <HelpScreen {...props} rid={path.split("/")[2]} />;
  if (path === "/outline") return <Outline {...props} />;
  if (path.startsWith("/task/"))
    return <TaskScreen {...props} tid={path.split("/")[2]} />;
  if (path === "/stamps") return <Stamps version={version} />;
  return <Profile {...props} />;
}
type ScreenProps = { user: User; version: number } & Actions;
function Load({ error }: { error: string }) {
  return (
    <div
      className={error ? "alert" : "loading-card"}
      role={error ? "alert" : "status"}
    >
      {error || "A little moment…"}
    </div>
  );
}
function Dashboard({ user, version }: ScreenProps) {
  const { data, error } = useData<HomeData>("home", version);
  if (!data) return <Load error={error} />;
  const pending = data.requests.filter(
    (r) => r.toId === user.id && r.status === "pending",
  );
  return (
    <>
      <Heading
        eyebrow="YOUR NEXT CHAPTER STARTS SMALL"
        title={`Hey ${user.name.split(" ")[0]}, you’ve got this.`}
        description="Life gets busy. Your learning journey is still right here."
        action={
          <span className="date-pill">
            <Leaf size={16} /> A fresh start awaits
          </span>
        }
      />
      <section className="personal-note white-card">
        <div>
          <span className="eyebrow">YOUR LEARNING PLAN</span>
          <h2>{user.goal || "Make room for one small win."}</h2>
          <p>
            {user.modules?.length
              ? `Studying ${user.modules.join(", ")}. `
              : "Add your current modules to personalize your campus. "}
            Study time: {user.studyTime || "flexible"}. Start with{" "}
            {user.studyFormat || "practice"}.
          </p>
        </div>
        <Link className="text-action" href="/onboarding">
          Learning preferences <ArrowUpRight size={16} />
        </Link>
      </section>
      <div className="dashboard-grid">
        <div className="main-column">
          <section className="restart-hero">
            <div className="hero-copy">
              <span className="pill">
                <span className="online-dot" />
                {data.stall?.status === "stalled"
                  ? `A GENTLE NUDGE · ${data.stall.days} DAYS AWAY`
                  : "SMALL STEPS, REAL MOMENTUM"}
              </span>
              <h2>
                A little restart.
                <br />A lot of possibility.
              </h2>
              <p>
                You don’t need a free afternoon.
                <br />
                Just 12 minutes and one small win.
              </p>
              <Link
                href={data.task ? `/task/${data.task.id}` : "/outline"}
                className="btn primary"
              >
                {data.task ? "Let’s restart" : "Create my first restart"}
                <ArrowRight size={18} />
              </Link>
              <small>
                <Clock size={13} />
                12 minutes · No pressure · Your pace
              </small>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <span className="art-star star-one">✦</span>
              <span className="art-star star-two">✧</span>
              <div className="plant-pot">
                <div className="stem" />
                <i className="leaf leaf-one" />
                <i className="leaf leaf-two" />
                <i className="leaf leaf-three" />
                <i className="leaf leaf-four" />
                <div className="pot">
                  <span>little by little</span>
                </div>
              </div>
              <span className="art-label">
                <Sparkles size={14} /> Still growing.
              </span>
            </div>
          </section>
          <div className="section-title">
            <h2>Your learning, in motion</h2>
            <Link href="/outline">
              Add a module <Plus size={15} />
            </Link>
          </div>
          <section className="module-card">
            <div className="module-top">
              <span className="square-icon">
                <BookOpen size={23} />
              </span>
              <div>
                <span className="eyebrow">YOUR CURRENT FOCUS</span>
                <h3>
                  {data.task?.outlineId === "node"
                    ? "REST, Auth & Testing a Node endpoint"
                    : data.task?.title || "A new chapter is waiting"}
                </h3>
                <p>{user.programme}</p>
              </div>
            </div>
            <div className="module-outcome">
              <span className="outcome-dot" />
              <p>
                {data.task?.outcomes[0] ||
                  "Paste your module outline and choose one confirmed outcome."}
              </p>
            </div>
            <div className="module-bottom">
              <span className="status-chip">
                <span />
                {data.stall?.status === "stalled"
                  ? "Ready when you are"
                  : data.stall?.status === "unstuck"
                    ? "Unstuck — together"
                    : "One step at a time"}
              </span>
              <Link href={data.task ? `/task/${data.task.id}` : "/outline"}>
                Take the next step <ArrowRight size={17} />
              </Link>
            </div>
          </section>
          <div className="section-title">
            <h2>Better with a little company</h2>
            <span>You’re not doing this alone</span>
          </div>
          <div className="action-grid">
            <Link className="action-card peach-card" href="/phone-a-friend">
              <span className="square-icon">
                <Users size={24} />
              </span>
              <h3>Phone a Friend</h3>
              <p>
                A fresh pair of eyes. A familiar struggle.
                <br />
                Get unstuck with someone nearby.
              </p>
              <span className="text-action">
                Find your person <ArrowUpRight size={19} />
              </span>
              <span className="card-decoration">✳</span>
            </Link>
            <Link className="action-card sky-card" href="/map">
              <span className="square-icon">
                <Compass size={24} />
              </span>
              <h3>Your campus is closer</h3>
              <p>
                Find a study buddy or a quiet desk.
                <br />
                Good company, just around the corner.
              </p>
              <span className="text-action">
                Explore nearby <ArrowUpRight size={19} />
              </span>
              <span className="card-decoration">⌖</span>
            </Link>
          </div>
        </div>
        <div className="right-column">
          <section className="coach-preview">
            <div className="card-heading">
              <span className="coach-icon">
                <Sparkles size={21} />
              </span>
              <div>
                <h3>A nudge from your coach</h3>
                <small>
                  <span className="online-dot" /> In your corner, always
                </small>
              </div>
            </div>
            <div className="quote">
              “
              {data.stall?.status === "stalled"
                ? `Hey ${user.name.split(" ")[0]} 👋 Picking up where you left off counts as progress. What’s one tiny thing we can tackle today?`
                : "A small step today is something to be proud of. Want to find your next one?"}
              ”
            </div>
            <Link className="btn outline-btn full" href="/coach">
              Let’s talk <MessageCircle size={17} />
            </Link>
          </section>
          <section className="stamp-preview">
            <div className="card-heading spread">
              <h3>Little wins. Big energy.</h3>
              <Star size={17} />
            </div>
            <div className="stamp-showcase">
              <Stamp kind={data.stamps.at(-1)?.kind} />
              <span className="sparkle s1">✧</span>
              <span className="sparkle s2">✧</span>
            </div>
            <h3>
              {data.stamps.length
                ? `${data.stamps.length} win${data.stamps.length === 1 ? "" : "s"} worth keeping`
                : "Your next win is waiting"}
            </h3>
            <p>
              {data.stamps.length
                ? "Every stamp is a step you actually took."
                : "Finish a restart. Earn your first stamp. Every small step deserves a little celebration."}
            </p>
            <Link href="/stamps">
              Your stamp collection <ArrowRight size={16} />
            </Link>
          </section>
          <section className="nearby-preview">
            <div className="section-title">
              <h3>Around your corner</h3>
              <span className="soft-tag">~1 mi</span>
            </div>
            {data.peers.slice(0, 2).map((p) => (
              <Link href="/phone-a-friend" className="peer-row" key={p.id}>
                <Avatar name={p.name} />
                <span>
                  <strong>{p.name.split(" ")[0]}</strong>
                  <small>
                    {p.topics[0]} · {p.distance}
                  </small>
                </span>
                <span className="online-dot" />
              </Link>
            ))}
            {!data.peers.length && (
              <p>
                Opt into nearby discovery in your profile to find your people.
              </p>
            )}
            <Link className="small-link" href="/map">
              A whole campus, close to home <ArrowUpRight size={15} />
            </Link>
          </section>
        </div>
      </div>
      {pending.length > 0 && (
        <Link className="incoming-banner" href={`/help/${pending[0].id}`}>
          <MessageCircle />
          Someone could use your help. {pending.length} pending request(s)
          <ArrowRight />
        </Link>
      )}
      <div className="bottom-note">
        <Heart size={17} />
        <span>
          Some days, showing up is the achievement.{" "}
          <strong>Today can be one of those days.</strong>
        </span>
      </div>
    </>
  );
}
function Landing() {
  return (
    <LandingScroll>
      <div className="landing">
        <header>
          <Link className="brand" href="/">
            <span className="brand-icon">
              <Radio />
            </span>
            campus<span>signal</span>
          </Link>
          <Link className="btn outline-btn" href="/login">
            Come on in <ArrowRight size={17} />
          </Link>
          <ThemeSwitch />
        </header>
        <div className="landing-main">
          <div>
            <div className="eyebrow">
              FOR LEARNERS WITH A WHOLE LIFE TO LIVE
            </div>
            <h1>
              Your degree.
              <br />
              Your people.
              <br />
              <em>Your next small win.</em>
            </h1>
            <p>
              When life interrupts your learning, find your way back. A
              12-minute restart, a nearby friend, and a little proof that you’re
              moving forward.
            </p>
            <Link href="/login" className="btn primary">
              Find your momentum <ArrowRight size={19} />
            </Link>
            <span className="landing-caption">
              MIVA-first. Open to every working learner. Free to start.
            </span>
          </div>
          <div className="landing-visual">
            <SignalLines />
            <span className="pill">PROGRESS / COLLECTED</span>
            <div className="landing-stamps">
              <Stamp />
              <Stamp kind="unstuck" />
            </div>
            <h2>
              A little progress
              <br />
              goes a long way.
            </h2>
            <div className="people-stack">
              <Avatar name="Amaka Okafor" />
              <Avatar name="Tunde Adeyemi" />
              <Avatar name="Chioma Eze" />
              <span>A campus beyond the classroom.</span>
            </div>
          </div>
        </div>
        <div className="landing-features">
          {[
            [
              Clock,
              "12 minutes to begin again",
              "One outcome. One doable task.",
            ],
            [
              Users,
              "A friend, just around the corner",
              "Learn together, on your own terms.",
            ],
            [
              Star,
              "Progress you can hold onto",
              "Collect proof of your small wins.",
            ],
          ].map(([Icon, title, desc]) => {
            const I = Icon as typeof Clock;
            return (
              <div key={String(title)}>
                <I />
                <h3>{String(title)}</h3>
                <p>{String(desc)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </LandingScroll>
  );
}
function Login({ act, busy, error }: Actions & { error: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { data } = useData<{ demo: boolean; magic: boolean }>("auth/config", 0);
  const [linkError, setLinkError] = useState("");
  useEffect(() => {
    setLinkError(
      new URLSearchParams(window.location.search).get("error") || "",
    );
  }, []);
  return (
    <div className="login-page">
      <div className="login-appearance">
        <ThemeSwitch />
      </div>
      <Link className="brand" href="/">
        <span className="brand-icon">
          <Radio />
        </span>
        campus<span>signal</span>
      </Link>
      <div className="login-card">
        <span className="square-icon">
          <Leaf />
        </span>
        <div className="eyebrow">THERE’S ROOM FOR YOU HERE</div>
        <h1>A fresh start, anytime.</h1>
        <p>Welcome back to your learning journey.</p>
        {(error || linkError) && (
          <div className="alert" role="alert">
            {error || linkError}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            act(async () => {
              await api("auth/magic-link", { email });
              setSent(true);
            });
          }}
        >
          <label>
            Email address
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <button className="btn primary full" disabled={busy || !data?.magic}>
            Send me a magic link <ArrowRight size={17} />
          </button>
          {sent && (
            <p role="status" className="success-text">
              Check your inbox. Your sign-in link is on its way.
            </p>
          )}
          {data && !data.magic && (
            <small>
              Magic-link signup is available when Supabase is configured.
            </small>
          )}
        </form>
        {data?.demo && (
          <>
            <div className="divider">OR EXPLORE THE DEMO</div>
            <div className="persona-list">
              {[
                ["amaka", "Amaka Okafor", "A learner finding her momentum"],
                ["tunde", "Tunde Adeyemi", "A helping hand with Node.js"],
                ["chioma", "Chioma Eze", "Testing buddy & study desk host"],
              ].map(([persona, name, desc]) => (
                <button
                  disabled={busy}
                  key={persona}
                  onClick={() =>
                    act(async () => {
                      await api("auth/demo", { persona });
                      router.push("/home");
                    })
                  }
                >
                  <Avatar name={name} />
                  <span>
                    <strong>{name}</strong>
                    <small>{desc}</small>
                  </span>
                  <ArrowRight size={17} />
                </button>
              ))}
            </div>
            <small className="demo-note">
              Shared demo personas · no email or paid keys needed.
              <br />
              Switch personas to try both sides of Phone a Friend.
            </small>
          </>
        )}
        <p className="privacy-caption">
          <ShieldCheck size={15} /> Your location is yours to share.
        </p>
      </div>
    </div>
  );
}
function Coach({ user, version, act, busy }: ScreenProps) {
  const { data: home } = useData<HomeData>("home", version);
  const { data, error } = useData<CoachMessageLog[]>("coach", version);
  const [message, setMessage] = useState("");
  const send = (value: string) =>
    act(async () => {
      await api("coach/inbound", { text: value });
      setMessage("");
    });
  return (
    <>
      <Heading
        eyebrow="A LITTLE SUPPORT GOES A LONG WAY"
        title="You’ve got someone in your corner."
        description="No lectures. No catching up. Just a gentle nudge toward your next small step."
      />
      <div className="chat-layout">
        <section className="chat-card">
          <div className="chat-header">
            <span className="coach-icon">
              <Sparkles />
            </span>
            <div>
              <h3>Your Campus Coach</h3>
              <small>Rule-based AI · no paid keys needed</small>
            </div>
            <span className="online-dot" />
          </div>
          <div className="chat-messages">
            {!data ? (
              <Load error={error} />
            ) : data.length === 0 ? (
              <Empty
                title={`Hey ${user.name.split(" ")[0]} 👋`}
                text="Tell me where you’re at. Try “stuck”, or create a restart from your outline."
              />
            ) : (
              data.map((m) => (
                <div
                  key={m.id}
                  className={`bubble ${m.role === "user" ? "mine" : ""}`}
                >
                  <p>{m.text}</p>
                  <small>
                    {m.role === "coach" ? "Campus Coach" : "You"} ·{" "}
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </div>
              ))
            )}
          </div>
          <div className="quick-replies">
            <button disabled={busy} onClick={() => send("I’m stuck")}>
              I’m stuck
            </button>
            <Link href="/phone-a-friend">
              Find a friend <ArrowUpRight size={13} />
            </Link>
            <button disabled={busy} onClick={() => send("Make a plan")}>
              Make a plan
            </button>
            <button disabled={busy} onClick={() => send("Practice question")}>
              Practice prompt
            </button>
            <Link href="/outline">Add objectives / PDF</Link>
          </div>
          <form
            className="chat-compose"
            onSubmit={(e) => {
              e.preventDefault();
              send(message);
            }}
          >
            <input
              aria-label="Message your coach"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              maxLength={4000}
              placeholder="A small hello is a good start…"
            />
            <button
              className="icon-button"
              disabled={busy || !message.trim()}
              aria-label="Send message"
            >
              <Send size={19} />
            </button>
          </form>
        </section>
        <aside className="support-card">
          <Leaf />
          <h3>Progress, in your own words.</h3>
          {home?.task && (
            <div className="coach-rubric">
              <strong>Your restart rubric</strong>
              <ol>
                {home.task.rubric.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ol>
            </div>
          )}
          <p>
            Read the rubric on your restart before submitting. When you’re
            ready, send <strong>DONE</strong> followed by what you tried and
            what happened.
          </p>
          <p>
            Want to share a photo URL? Use the restart page to add it alongside
            your written evidence.
          </p>
          <Link href="/home" className="text-action">
            Open my restart <ArrowRight size={16} />
          </Link>
          <hr />
          <ShieldCheck />
          <p>
            Coach messages are private to your account. Demo personas share
            their demo history.
          </p>
        </aside>
      </div>
    </>
  );
}
function MapScreen({ version, act, busy }: ScreenProps) {
  const { data, error } = useData<MapData>("map/pins", version);
  const [kind, setKind] = useState<"desk" | "buddy">("desk");
  const [title, setTitle] = useState("");
  if (!data) return <Load error={error} />;
  return (
    <>
      <Heading
        eyebrow="A CAMPUS WITHOUT WALLS"
        title="Your people are closer than you think."
        description="A study buddy, a helping hand, a place to focus. Explore your little corner of campus."
        action={
          <span className="date-pill">
            <Pin size={16} /> Within ~1 mile
          </span>
        }
      />
      {!data.enabled ? (
        <Empty
          title="Let your campus find you"
          text="Nearby discovery is off. Choose your approximate area and opt in through your profile."
          href="/profile"
          label="Set my preferences"
        />
      ) : (
        <div className="map-layout">
          <section className="map-card">
            <NearbyMap {...data} />
            <div className="map-legend">
              <span>
                <i className="legend-dot green" /> Learners
              </span>
              <span>
                <i className="legend-dot orange" /> Study desks
              </span>
              <span>
                <ShieldCheck size={15} /> Approximate locations only
              </span>
            </div>
          </section>
          <div>
            <section className="white-card">
              <h3>Around your corner</h3>
              {data.peers.map((p) => (
                <div key={p.id} className="peer-row">
                  <Avatar name={p.name} />
                  <span>
                    <strong>{p.name.split(" ")[0]}</strong>
                    <small>
                      {p.topics[0]} · {p.distance}
                    </small>
                  </span>
                  <Link
                    href="/phone-a-friend"
                    aria-label={`Connect with ${p.name}`}
                  >
                    <ArrowUpRight size={17} />
                  </Link>
                </div>
              ))}
              {!data.peers.length && (
                <p>No opted-in learners in this area yet.</p>
              )}
              {data.pins.map((p) => (
                <div className="desk-row" key={p.id}>
                  <BookOpen size={18} />
                  <div>
                    <strong>{p.title}</strong>
                    <small>
                      {p.kind === "desk" ? "Study desk" : "Buddy spot"} ·
                      community shared
                    </small>
                  </div>
                </div>
              ))}
            </section>
            <section className="white-card pin-form">
              <h3>Make room for a little company</h3>
              <p>Share a desk or buddy pin in your approximate area.</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  act(async () => {
                    await api("map/pins", { kind, title });
                    setTitle("");
                  });
                }}
              >
                <label>
                  Pin type
                  <select
                    value={kind}
                    onChange={(e) =>
                      setKind(e.target.value as "desk" | "buddy")
                    }
                  >
                    <option value="desk">Study desk</option>
                    <option value="buddy">Study buddy</option>
                  </select>
                </label>
                <label>
                  A short description
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    minLength={3}
                    maxLength={80}
                    required
                    placeholder="Quiet afternoon study spot"
                  />
                </label>
                <button disabled={busy} className="btn primary full">
                  <Plus size={16} /> Share a pin
                </button>
              </form>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
function Friends({ user, version, act, busy }: ScreenProps) {
  const [requestTick, setRequestTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setRequestTick((v) => v + 1), 10000);
    return () => clearInterval(timer);
  }, []);
  const { data, error } = useData<{ requests: HelpRequest[]; peers: Peer[] }>(
    "help-requests",
    version + requestTick,
  );
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Peer | null>(null);
  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");
  const [requestError, setRequestError] = useState("");
  const peers =
    data?.peers.filter((p) =>
      `${p.name} ${p.topics.join(" ")} ${(p.strengths || []).join(" ")} ${p.programme}`
        .toLowerCase()
        .includes(filter.toLowerCase()),
    ) ?? [];
  const topics = [
    ...new Set(
      data?.peers.flatMap((p) =>
        p.strengths?.length ? p.strengths : p.topics,
      ) ?? [],
    ),
  ].slice(0, 5);
  return (
    <div className="friends-studio">
      <div className="section-index">
        <span>01 / PEER SUPPORT</span>
        <span>
          THE OPEN CAMPUS <span className="online-dot" />
        </span>
      </div>
      <section className="friends-hero">
        <Reveal className="friends-hero-copy">
          <div className="eyebrow">PHONE A FRIEND</div>
          <h1>
            A fresh perspective.
            <br />
            <em>Closer than you think.</em>
          </h1>
          <p>
            Bring the problem you’re sitting with.
            <br />
            Find a learner who can help you see it differently.
          </p>
          <a className="studio-anchor" href="#find-a-friend">
            Find your person <ArrowDown size={16} />
          </a>
        </Reveal>
        <div className="connection-visual">
          <div className="visual-meta">
            <span>LOCAL CONNECTIONS</span>
            <span>RADIUS / 1.6 KM</span>
          </div>
          <SignalLines />
          <div className="connection-caption">
            <span className="online-dot" />
            <span>
              {data
                ? `${data.peers.length} ${data.peers.length === 1 ? "learner" : "learners"} open to helping`
                : "Finding nearby learners"}
            </span>
            <ArrowUpRight size={16} />
          </div>
        </div>
      </section>
      <div className="help-process" aria-label="How peer support works">
        <div>
          <span>01</span>
          <strong>Share where you’re stuck.</strong>
        </div>
        <ArrowRight size={15} />
        <div>
          <span>02</span>
          <strong>Work through it together.</strong>
        </div>
        <ArrowRight size={15} />
        <div>
          <span>03</span>
          <strong>Both finish. Both earn a stamp.</strong>
        </div>
      </div>
      <section className="discovery-section" id="find-a-friend">
        <div className="discovery-heading">
          <div>
            <span className="eyebrow">A CAMPUS WITHIN REACH</span>
            <h2>
              Find your kind of help
              <span className="count-label">
                {data ? String(peers.length).padStart(2, "0") : "—"}
              </span>
            </h2>
          </div>
          <label className="friend-search">
            <Search size={17} />
            <span className="sr-only">Search a topic or programme</span>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Topic, name or programme"
            />
            {filter && (
              <button aria-label="Clear search" onClick={() => setFilter("")}>
                <X size={15} />
              </button>
            )}
          </label>
        </div>
        <div className="filter-bar">
          <div className="filter-chips">
            <button aria-pressed={!filter} onClick={() => setFilter("")}>
              All topics
            </button>
            {topics.map((t) => (
              <button
                key={t}
                aria-pressed={filter === t}
                onClick={() => setFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <span>
            <Pin size={13} /> Approximate locations
          </span>
        </div>
        {!data ? (
          <Load error={error} />
        ) : (
          <>
            <div className="friend-grid">
              {peers.map((p, index) => (
                <Reveal key={p.id} className="friend-card">
                  <div className="friend-card-index">
                    <span>LEARNER / {String(index + 1).padStart(2, "0")}</span>
                    <span className="available-label">
                      <span className="online-dot" /> OPEN TO HELP
                    </span>
                  </div>
                  <div className="friend-identity">
                    <Avatar name={p.name} size="large" />
                    <div>
                      <h3>{p.name}</h3>
                      <p>{p.programme}</p>
                    </div>
                    <ArrowUpRight size={20} />
                  </div>
                  <div className="friend-expertise">
                    <span className="eyebrow">SELF-REPORTED STRENGTHS</span>
                    {p.matchReason && <p>{p.matchReason}</p>}
                    <div className="topic-tags">
                      {(p.strengths?.length ? p.strengths : p.topics).map(
                        (t) => (
                          <span key={t}>{t}</span>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="friend-card-footer">
                    <span className="friend-distance">
                      <Pin size={15} />
                      {p.distance} away
                    </span>
                    <button
                      className="btn primary"
                      disabled={busy}
                      onClick={() => {
                        setSelected(p);
                        setTopic(
                          p.strengths?.[0] || p.topics[0] || "Study planning",
                        );
                        setRequestError("");
                      }}
                    >
                      Ask for a hand <ArrowUpRight size={17} />
                    </button>
                  </div>
                </Reveal>
              ))}
            </div>
            {!peers.length &&
              (data.peers.length ? (
                <Empty
                  title="No matches just yet"
                  text="Try another topic or clear your search to see everyone nearby."
                />
              ) : (
                <Empty
                  title="Make yourself discoverable"
                  text="Opt into nearby discovery in your profile. Helpers who have opted in within 1.6 km will appear here."
                  href="/profile"
                  label="Discovery preferences"
                />
              ))}
          </>
        )}
        <div className="discovery-note">
          <ShieldCheck size={14} />
          <span>
            Your neighbourhood, not your doorstep. Locations stay approximate.
          </span>
        </div>
      </section>
      <section className="connections-section">
        <div className="section-title">
          <h2>Your connections</h2>
          <span>
            {String(data?.requests.length ?? 0).padStart(2, "0")} /
            CONVERSATIONS
          </span>
        </div>
        <div className="request-list">
          {data?.requests.map((r) => (
            <Link key={r.id} href={`/help/${r.id}`}>
              <span className="square-icon">
                <MessageCircle size={18} />
              </span>
              <div>
                <strong>{r.topic}</strong>
                <small>
                  {r.fromId === user.id
                    ? "You asked for a hand"
                    : "A learner requested your help"}{" "}
                  · {new Date(r.createdAt).toLocaleDateString()}
                </small>
              </div>
              <span className="soft-tag">{r.status}</span>
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </div>
        {data && !data.requests.length && (
          <div className="connections-empty">
            <MessageCircle size={22} />
            <p>
              No conversations yet.
              <span>Your next connection starts with a request.</span>
            </p>
            <span className="connection-end">—</span>
          </div>
        )}
      </section>
      {selected && (
        <RequestDialog onClose={() => setSelected(null)}>
          <button
            className="close-button"
            aria-label="Close request"
            onClick={() => setSelected(null)}
          >
            <X />
          </button>
          {requestError && (
            <p className="alert" role="alert">
              {requestError}
            </p>
          )}
          <span className="eyebrow">START A CONVERSATION</span>
          <Avatar name={selected.name} />
          <h2 id="request-title">
            A hand from
            <br />
            <em>{selected.name.split(" ")[0]}.</em>
          </h2>
          <p>Share what you tried and where it stopped making sense.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              act(async () => {
                setRequestError("");
                try {
                  const r = await api<HelpRequest>("help-requests", {
                    toId: selected.id,
                    topic,
                    note,
                  });
                  router.push(`/help/${r.id}`);
                } catch (e) {
                  setRequestError(
                    e instanceof Error
                      ? e.message
                      : "Request failed. Please retry.",
                  );
                }
              });
            }}
          >
            <label>
              What are you working on?
              <input
                required
                minLength={2}
                maxLength={100}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </label>
            <label>
              Where did you get stuck?
              <textarea
                required
                maxLength={4000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="I tried protecting my route, but it keeps returning 401…"
              />
            </label>
            <button disabled={busy} className="btn primary full">
              Send request <ArrowUpRight size={17} />
            </button>
          </form>
        </RequestDialog>
      )}
    </div>
  );
}
function HelpScreen({
  user,
  version,
  act,
  busy,
  rid,
}: ScreenProps & { rid: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 5000);
    return () => clearInterval(t);
  }, []);
  const { data, error } = useData<HelpData>(
    `help-requests/${rid}`,
    version + tick,
  );
  const [message, setMessage] = useState("");
  const [report, setReport] = useState(false);
  const [reason, setReason] = useState("");
  if (!data) return <Load error={error} />;
  const peer = data.participants.find((p) => p.id !== user.id)!;
  return (
    <>
      <Heading
        eyebrow="YOU’RE FIGURING IT OUT, TOGETHER"
        title={data.topic}
        description={`A little help between you and ${peer.name}.`}
      />
      {error && <Load error={error} />}
      <div className="chat-layout">
        <section className="chat-card">
          <div className="chat-header">
            <Avatar name={peer.name} />
            <div>
              <h3>{peer.name}</h3>
              <small>{data.status} · Location stays approximate</small>
            </div>
          </div>
          <div className="session-status">
            {data.status === "pending" ? (
              data.toId === user.id ? (
                <>
                  <p>
                    {peer.name.split(" ")[0]} could use a hand. Ready to join?
                  </p>
                  <button
                    className="btn primary"
                    disabled={busy}
                    onClick={() =>
                      act(() => api(`help-requests/${rid}/accept`, {}))
                    }
                  >
                    Accept request <Check size={17} />
                  </button>
                  <button
                    className="btn outline-btn"
                    disabled={busy}
                    onClick={() =>
                      act(() => api(`help-requests/${rid}/decline`, {}))
                    }
                  >
                    Not right now
                  </button>
                </>
              ) : (
                <p>
                  Your request is on its way. Waiting for{" "}
                  {peer.name.split(" ")[0]} to accept.
                </p>
              )
            ) : data.status === "completed" ? (
              <div className="completion">
                <Check />
                <h3>You did it, together.</h3>
                <div className="completed-signal">
                  <SignalLines connected />
                </div>
                <Link href="/stamps">
                  Your UNSTUCK stamp is waiting <ArrowRight size={16} />
                </Link>
              </div>
            ) : data.status === "declined" ? (
              <p>
                Your friend can’t help right now.{" "}
                <Link href="/phone-a-friend">Try another learner.</Link>
              </p>
            ) : (
              <>
                <p>
                  {data.completedBy.includes(user.id)
                    ? "You’ve marked this complete. Waiting for your friend."
                    : "A fresh perspective can be all it takes. When you’re both done, you’ll each earn a stamp."}
                </p>
                <button
                  className="btn primary"
                  disabled={busy || data.completedBy.includes(user.id)}
                  onClick={() =>
                    act(() => api(`help-requests/${rid}/complete`, {}))
                  }
                >
                  <Check size={17} /> I’m done — mark complete
                </button>
              </>
            )}
          </div>
          <div className="chat-messages">
            {data.messages.map((m) => (
              <div
                className={`bubble ${m.userId === user.id ? "mine" : ""}`}
                key={m.id}
              >
                <p>{m.text}</p>
                <small>
                  {m.userId === user.id ? "You" : peer.name.split(" ")[0]} ·{" "}
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </div>
            ))}
          </div>
          {data.status === "accepted" && (
            <form
              className="chat-compose"
              onSubmit={(e) => {
                e.preventDefault();
                act(async () => {
                  await api(`help-requests/${rid}/messages`, { text: message });
                  setMessage("");
                });
              }}
            >
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                maxLength={4000}
                aria-label="Message your friend"
                placeholder="Share a thought, a question, a small breakthrough…"
              />
              <button
                disabled={busy}
                className="icon-button"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>
          )}
        </section>
        <aside className="support-card">
          <Users />
          <h3>Good help starts small.</h3>
          <p>
            Share what you tried, what you expected, and what actually happened.
            Keep personal details private.
          </p>
          {user.demo && (
            <div className="demo-instruction">
              <strong>Trying the demo?</strong>
              <p>
                Switch to {peer.name.split(" ")[0]} from the top bar, open this
                request under Phone a Friend, and respond. Switch back to
                complete both sides.
              </p>
            </div>
          )}
          <button className="text-button" onClick={() => setReport(!report)}>
            <Flag size={15} /> Report or block
          </button>
          {report && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                act(async () => {
                  await api("safety", {
                    targetId: peer.id,
                    action: "report",
                    reason,
                  });
                  setReport(false);
                });
              }}
            >
              <label>
                What happened?
                <textarea
                  required
                  minLength={3}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <small>
                Reports are recorded; the MVP has no staffed moderation service.
              </small>
              <button className="btn outline-btn" disabled={busy}>
                Record report
              </button>
              <button
                type="button"
                className="btn danger"
                disabled={busy}
                onClick={() =>
                  act(async () => {
                    await api("safety", {
                      targetId: peer.id,
                      action: "block",
                      reason: reason || "Blocked by learner",
                    });
                    window.location.href = "/phone-a-friend";
                  })
                }
              >
                Block learner
              </button>
            </form>
          )}
        </aside>
      </div>
    </>
  );
}
function Outline({ act, busy }: ScreenProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [outline, setOutline] = useState<
    (ModuleOutline & { outcomes: Outcome[] }) | null
  >(null);
  const [outcomes, setOutcomes] = useState<string[]>([]);
  return (
    <>
      <Heading
        eyebrow="BIG MODULE. SMALL BEGINNINGS."
        title="What are you learning?"
        description="Bring your outline. We’ll help you find a manageable place to begin."
      />
      <div className="form-layout">
        <section className="white-card form-card">
          {!outline ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                act(async () => {
                  const o = await api<ModuleOutline & { outcomes: Outcome[] }>(
                    "outlines",
                    { title, text },
                  );
                  setOutline(o);
                  setOutcomes(o.outcomes.map((x) => x.text));
                });
              }}
            >
              <span className="step-label">STEP 01 / YOUR OUTLINE</span>
              <h2>Start with what’s already there.</h2>
              <label>
                Module title
                <input
                  required
                  minLength={3}
                  maxLength={180}
                  placeholder="REST, Auth & Testing a Node endpoint"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <PdfImport
                onText={(value, name) => {
                  setText(value);
                  if (!title) setTitle(name);
                }}
              />
              <label>
                Paste or review your module outline
                <textarea
                  className="large-textarea"
                  minLength={10}
                  maxLength={15000}
                  required
                  placeholder={
                    "Paste the learning outcomes from your module here.\nOne outcome per line works best."
                  }
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </label>
              <button disabled={busy} className="btn primary">
                Find my outcomes <ArrowRight size={17} />
              </button>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                act(async () => {
                  const task = await api<RestartTask>(
                    `outlines/${outline.id}/confirm`,
                    { outcomes },
                  );
                  router.push(`/task/${task.id}`);
                });
              }}
            >
              <span className="step-label">STEP 02 / YOUR SAY, ALWAYS</span>
              <h2>Make these outcomes yours.</h2>
              <p>
                These lines were extracted from your text. Edit or remove
                anything that isn’t a learning outcome. Your first outcome
                becomes your restart.
              </p>
              {outcomes.map((o, i) => (
                <div className="outcome-edit" key={i}>
                  <label>
                    Outcome {i + 1}
                    <textarea
                      required
                      minLength={5}
                      maxLength={400}
                      value={o}
                      onChange={(e) =>
                        setOutcomes(
                          outcomes.map((v, n) =>
                            n === i ? e.target.value : v,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    aria-label={`Remove outcome ${i + 1}`}
                    onClick={() =>
                      setOutcomes(outcomes.filter((_, n) => n !== i))
                    }
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-button"
                disabled={outcomes.length >= 12}
                onClick={() => setOutcomes([...outcomes, ""])}
              >
                <Plus size={16} /> Add an outcome
              </button>
              <div className="form-actions">
                <button
                  className="btn primary"
                  disabled={busy || !outcomes.length}
                >
                  Confirm & create my restart <ArrowRight size={17} />
                </button>
              </div>
            </form>
          )}
        </section>
        <aside className="support-card">
          <ShieldCheck />
          <h3>No invented outcomes.</h3>
          <p>
            Our rule-based AI extracts lines from your outline. You review and
            confirm them before any task is created.
          </p>
          <hr />
          <Clock />
          <h3>Make space for 12 minutes.</h3>
          <p>
            We’ll pick one confirmed outcome, show you a simple rubric, and ask
            for a little evidence of progress.
          </p>
        </aside>
      </div>
    </>
  );
}
function TaskScreen({
  tid,
  version,
  act,
  busy,
}: ScreenProps & { tid: string }) {
  const { data, error } = useData<{
    task: RestartTask;
    submissions: Submission[];
  }>(`tasks/${tid}`, version);
  const [text, setText] = useState("");
  const [photoUrl, setPhoto] = useState("");
  const [result, setResult] = useState<Submission | null>(null);
  const [seconds, setSeconds] = useState(720);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(
      () =>
        setSeconds((n) => {
          if (n <= 1) {
            setRunning(false);
            return 0;
          }
          return n - 1;
        }),
      1000,
    );
    return () => clearInterval(t);
  }, [running]);
  if (!data) return <Load error={error} />;
  return (
    <>
      <Heading
        eyebrow="ONE SMALL STEP IS STILL A STEP"
        title={data.task.title}
        description="Give yourself 12 minutes. Explore, try, notice. Perfection isn’t on the rubric."
      />
      <div className="form-layout">
        <section className="white-card form-card">
          <span className="step-label">YOUR CONFIRMED OUTCOME</span>
          <h2>{data.task.outcomes[0]}</h2>
          <div className="rubric">
            <h3>
              <Check size={18} /> What counts as proof
            </h3>
            <p>
              You’ll earn a stamp when your evidence meets all three checks.
            </p>
            {data.task.rubric.map((r, i) => (
              <div key={r}>
                <span>{i + 1}</span>
                {r}
              </div>
            ))}
            <small>
              Rule-based scoring checks written evidence. Photo URLs support
              your note; images are not analyzed.
            </small>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              act(async () => {
                const r = await api<Submission>(`tasks/${tid}/submit`, {
                  text,
                  ...(photoUrl ? { photoUrl } : {}),
                });
                setResult(r);
                setRunning(false);
              });
            }}
          >
            <label>
              Show your small step
              <textarea
                className="large-textarea"
                required
                maxLength={4000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="I tried… The result was… I learned…"
              />
            </label>
            <label>
              Photo URL <span className="optional">optional · HTTPS only</span>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhoto(e.target.value)}
                placeholder="https://…"
              />
            </label>
            <button className="btn primary" disabled={busy}>
              Submit my proof <ArrowRight size={17} />
            </button>
          </form>
          {result && (
            <div
              role="status"
              className={`result ${result.score === 3 ? "passed" : ""}`}
            >
              <strong>
                {result.score === 3
                  ? "A small win. Officially yours."
                  : `${result.score}/3 checks met — you’re getting there.`}
              </strong>
              <p>{result.feedback}</p>
              {result.score === 3 && (
                <Link href="/stamps">
                  See my stamp <Star size={17} />
                </Link>
              )}
            </div>
          )}
          {data.submissions.length > 0 && (
            <div className="submission-history">
              <h3>Your attempts</h3>
              {data.submissions
                .slice()
                .reverse()
                .slice(0, 5)
                .map((s) => (
                  <div key={s.id}>
                    <span>
                      {s.score}/3 checks ·{" "}
                      {new Date(s.createdAt).toLocaleString()}
                    </span>
                    <p>{s.feedback}</p>
                  </div>
                ))}
            </div>
          )}
        </section>
        <aside>
          <div className="timer-card">
            <Clock />
            <span>A LITTLE POCKET OF FOCUS</span>
            <strong>
              {Math.floor(seconds / 60)
                .toString()
                .padStart(2, "0")}
              :{(seconds % 60).toString().padStart(2, "0")}
            </strong>
            <button
              className="btn primary full"
              disabled={seconds === 0}
              onClick={() => setRunning(!running)}
            >
              {running
                ? "Pause for a moment"
                : seconds === 0
                  ? "Your 12 minutes are yours"
                  : "Start my 12 minutes"}
            </button>
            <p>
              This timer is a gentle guide. You can submit whenever you’re
              ready.
            </p>
          </div>
          <div className="support-card">
            <Users />
            <h3>Hit a wall?</h3>
            <p>A friend might see the one thing you’re missing.</p>
            <Link className="text-action" href="/phone-a-friend">
              Ask for a hand <ArrowRight size={17} />
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
function Stamps({ version }: { version: number }) {
  const { data, error } = useData<ProofStamp[]>("stamps", version);
  return (
    <>
      <Heading
        eyebrow="PROOF YOU KEPT GOING"
        title="Small wins, worth collecting."
        description="Not a streak to protect. A collection of moments you found your way forward."
      />
      {!data ? (
        <Load error={error} />
      ) : !data.length ? (
        <div className="stamp-empty">
          <Stamp />
          <h2>Your story is just getting started.</h2>
          <p>
            Complete a restart or a Phone a Friend session to earn your first
            stamp.
          </p>
          <Link href="/home" className="btn primary">
            Find my next small win <ArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <div className="stamps-grid">
          {data.map((s) => (
            <article className="stamp-card" key={s.id}>
              <StampReveal>
                <Stamp kind={s.kind} />
              </StampReveal>
              <h2>{s.title}</h2>
              <p>
                {s.kind === "unstuck"
                  ? "A breakthrough, shared with a friend."
                  : "You showed up and took one real step."}
              </p>
              <span>
                {new Date(s.createdAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <Link
                href={
                  s.kind === "unstuck"
                    ? `/help/${s.sourceId}`
                    : `/task/${s.sourceId}`
                }
              >
                See the story <ArrowUpRight size={15} />
              </Link>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
function Profile({ user, act, busy }: ScreenProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [programme, setProgramme] = useState(user.programme);
  const [topics, setTopics] = useState(user.topics.join(", "));
  const [nearby, setNearby] = useState(user.nearby);
  const [helper, setHelper] = useState(user.helper);
  const [lat, setLat] = useState(user.lat);
  const [lng, setLng] = useState(user.lng);
  const [saved, setSaved] = useState(false);
  return (
    <>
      <Heading
        eyebrow="YOUR CAMPUS, ON YOUR TERMS"
        title="A little about you."
        description="Share what brings you here. Choose how you connect."
      />
      <p>
        <Link className="btn secondary" href="/onboarding">
          Edit learning preferences & strengths <ArrowUpRight size={16} />
        </Link>{" "}
        <Link className="btn secondary" href="/outline">
          My outline / PDF <BookOpen size={16} />
        </Link>
      </p>
      <div className="form-layout">
        <section className="white-card form-card">
          <div className="profile-intro">
            <Avatar name={name} size="large" />
            <div>
              <h2>{name}</h2>
              <p>
                {user.demo ? "Shared demo persona" : "Your learner profile"}
              </p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              act(async () => {
                await api(
                  "profile",
                  {
                    name,
                    programme,
                    topics: topics
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                    nearby,
                    helper,
                    lat,
                    lng,
                  },
                  "PATCH",
                );
                setSaved(true);
              });
            }}
          >
            <label>
              Your name
              <input
                required
                minLength={2}
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Your programme
              <input
                required
                minLength={2}
                maxLength={100}
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
              />
            </label>
            <label>
              Topics you’re learning or can help with
              <input
                maxLength={500}
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="Node.js, Testing, Study planning"
              />
              <small>Separate topics with commas.</small>
            </label>
            <h3>Your approximate area</h3>
            <p>
              Use a neighbourhood centre, never your home address. Coordinates
              are rounded to about 100 metres. The starting area is Yaba, Lagos.
            </p>
            <label>
              Choose a neighbourhood
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    const [a, b] = e.target.value.split(",").map(Number);
                    setLat(a);
                    setLng(b);
                  }
                }}
              >
                <option value="">Choose an approximate area…</option>
                <option value="6.510,3.370">Yaba, Lagos</option>
                <option value="6.500,3.350">Surulere, Lagos</option>
                <option value="6.600,3.350">Ikeja, Lagos</option>
                <option value="6.430,3.420">Victoria Island, Lagos</option>
              </select>
            </label>
            <details className="location-details">
              <summary>Use another approximate area</summary>
              <div className="two-fields">
                <label>
                  Latitude
                  <input
                    type="number"
                    required
                    min={-90}
                    max={90}
                    step="0.001"
                    value={lat}
                    onChange={(e) => setLat(Number(e.target.value))}
                  />
                </label>
                <label>
                  Longitude
                  <input
                    type="number"
                    required
                    min={-180}
                    max={180}
                    step="0.001"
                    value={lng}
                    onChange={(e) => setLng(Number(e.target.value))}
                  />
                </label>
              </div>
            </details>
            <label className="toggle-row">
              <span>
                <strong>Show me on the nearby map</strong>
                <small>Let opted-in learners within ~1.6 km discover me.</small>
              </span>
              <input
                type="checkbox"
                checked={nearby}
                onChange={(e) => setNearby(e.target.checked)}
              />
            </label>
            <label className="toggle-row">
              <span>
                <strong>I’m open to lending a hand</strong>
                <small>Appear as a helper when nearby discovery is on.</small>
              </span>
              <input
                type="checkbox"
                checked={helper}
                onChange={(e) => setHelper(e.target.checked)}
              />
            </label>
            <div className="form-actions">
              <button disabled={busy} className="btn primary">
                Save my preferences <Check size={17} />
              </button>
              {saved && (
                <span className="success-text" role="status">
                  Saved. Your campus, your way.
                </span>
              )}
            </div>
          </form>
        </section>
        <aside className="support-card">
          <ShieldCheck />
          <h3>Privacy is a starting point.</h3>
          <p>
            New accounts begin with discovery and helping turned off. We never
            request exact GPS, even after a request is accepted.
          </p>
          <p>
            You control when you’re visible. Blocking a learner removes
            discovery and access to your shared help session.
          </p>
          <hr />
          <button
            className="btn outline-btn"
            disabled={busy}
            onClick={() =>
              act(async () => {
                await api("auth/logout", {});
                router.push("/login");
              })
            }
          >
            <LogOut size={16} /> Sign out
          </button>
        </aside>
      </div>
    </>
  );
}
