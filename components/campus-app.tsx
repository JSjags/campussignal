"use client";
import Link from "next/link";
import Onboarding from "./onboarding";
import PdfImport from "./pdf-import";
import { ThemeSwitch } from "./design/theme";
import {
  api,
  useAction,
  useResource,
  useSession,
  useStore,
} from "./data/client";
import {
  Avatar,
  Brand,
  Empty,
  ErrorAlert,
  Loader,
  PageHead,
  SkipLink,
  Stamp,
  StatusBadge,
  firstName,
  two,
} from "./ui";
import { routeKind, shouldFollowNewMessages } from "@/lib/routes";
import { HttpError } from "@/lib/resource-store";
import {
  ConnectionGraphic,
  Dialog,
  Reveal,
  StampLand,
  useLabelId,
} from "./design/motion";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Flag,
  LogOut,
  MapPin as Pin,
  MessageCircle,
  Pause,
  Play,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
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
    <div className="map-placeholder" role="status">
      <Loader /> Loading the map…
    </div>
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

type ScreenProps = { user: User };

/** Renders the screen for the current route inside the persistent shell. */
export default function CampusScreen() {
  const path = usePathname();
  const { user, setUser } = useSession();
  const store = useStore();
  const kind = routeKind(path);
  if (path === "/") return <Landing />;
  if (path === "/login") return <Login />;
  // The shell renders nothing else until a session exists.
  if (!user || kind === "unknown") return null;
  if (kind === "setup")
    return (
      <Onboarding
        user={user}
        onSaved={(u) => {
          setUser(u);
          store?.invalidate(["home", "help-requests", "map/pins"]);
        }}
      />
    );
  return (
    <Reveal className="page">
      <Content path={path} user={user} />
    </Reveal>
  );
}
function Content({ path, user }: { path: string; user: User }) {
  if (path === "/home") return <Dashboard user={user} />;
  if (path === "/coach") return <Coach user={user} />;
  if (path === "/map") return <MapScreen user={user} />;
  if (path === "/phone-a-friend") return <Friends user={user} />;
  if (path.startsWith("/help/"))
    return <HelpScreen user={user} rid={path.split("/")[2]} />;
  if (path === "/outline") return <Outline user={user} />;
  if (path.startsWith("/task/"))
    return <TaskScreen user={user} tid={path.split("/")[2]} />;
  if (path === "/stamps") return <Stamps />;
  return <Profile user={user} />;
}
/** First load for a section: a local placeholder, never a full-page spinner. */
function Load({ error, onRetry }: { error?: string; onRetry?: () => void }) {
  if (error)
    return (
      <div className="section-error">
        <ErrorAlert message={error} />
        {onRetry && (
          <button className="btn btn-sm" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    );
  return (
    <div className="loading-block" role="status">
      <Loader /> Loading…
    </div>
  );
}
/**
 * Background refresh state for content that is already on screen: a quiet
 * failure note (cached content stays) instead of replacing the section.
 */
function StaleNote({
  error,
  onRetry,
}: {
  error?: string;
  onRetry: () => void;
}) {
  if (!error) return null;
  return (
    <p className="stale-note" role="status">
      <AlertCircle size={15} aria-hidden="true" />
      <span>Couldn’t refresh just now. Showing the last update.</span>
      <button className="text-link" onClick={onRetry}>
        Retry
      </button>
    </p>
  );
}
/**
 * Chat history scrolling: follow new messages only when the learner just sent
 * one or is already near the bottom. Otherwise keep their reading position and
 * offer a "New messages" button. Never moves focus.
 */
function useChatScroll(count: number) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRef(0);
  const sentByMe = useRef(false);
  const [unseen, setUnseen] = useState(false);
  const distance = () => {
    const n = ref.current;
    return n ? n.scrollHeight - n.scrollTop - n.clientHeight : 0;
  };
  // Measure before the browser paints the new messages.
  const wasNearBottom = useRef(true);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || count === seen.current) return;
    const initial = seen.current === 0;
    const grew = count > seen.current;
    seen.current = count;
    if (
      shouldFollowNewMessages({
        initial,
        sentByMe: sentByMe.current,
        distanceFromBottom: wasNearBottom.current ? 0 : Infinity,
      })
    ) {
      node.scrollTop = node.scrollHeight;
      setUnseen(false);
    } else if (grew) setUnseen(true);
    sentByMe.current = false;
  }, [count]);
  const onScroll = () => {
    wasNearBottom.current = shouldFollowNewMessages({
      initial: false,
      sentByMe: false,
      distanceFromBottom: distance(),
    });
    if (wasNearBottom.current) setUnseen(false);
  };
  const jump = () => {
    const node = ref.current;
    if (node) node.scrollTo({ top: node.scrollHeight });
    setUnseen(false);
  };
  return {
    ref,
    onScroll,
    unseen,
    jump,
    markSent: () => {
      sentByMe.current = true;
    },
  };
}
function NewMessages({
  show,
  onClick,
}: {
  show: boolean;
  onClick: () => void;
}) {
  if (!show) return null;
  return (
    <button className="btn btn-sm new-messages" onClick={onClick}>
      <ArrowDown size={15} aria-hidden="true" /> New messages
    </button>
  );
}

/* ---------- Home ---------- */
function Dashboard({ user }: ScreenProps) {
  const { data, error, reload } = useResource<HomeData>("home");
  if (!data) return <Load error={error} onRetry={reload} />;
  const pending = data.requests.filter(
    (r) => r.toId === user.id && r.status === "pending",
  );
  const stalled = data.stall?.status === "stalled";
  const restartHref = data.task ? `/task/${data.task.id}` : "/outline";
  const latest = data.stamps.at(-1);
  return (
    <>
      {pending.length > 0 && (
        <Link
          className="incoming-banner card-link"
          href={`/help/${pending[0].id}`}
        >
          <span className="tile" aria-hidden="true">
            <MessageCircle size={20} />
          </span>
          <span>
            <strong>Someone could use your help.</strong>
            <small>
              {pending.length} pending request{pending.length === 1 ? "" : "s"}{" "}
              · open to respond
            </small>
          </span>
          <ArrowRight size={20} aria-hidden="true" />
        </Link>
      )}
      <PageHead
        label="My campus"
        title={`Hey ${firstName(user.name)}, one small win today.`}
        description="Life gets busy. Your learning is still right here, ready when you are."
      />
      <section className="plan-strip" aria-label="Your learning plan">
        <span className="label">Your plan</span>
        <p>
          <strong>{user.goal || "Make room for one small win."}</strong>{" "}
          {user.modules?.length
            ? `Studying ${user.modules.join(", ")}.`
            : "Add your current modules to personalise your campus."}{" "}
          Study time: {user.studyTime || "flexible"} · Start with{" "}
          {user.studyFormat || "practice"}.
        </p>
        <Link className="text-link" href="/onboarding">
          Edit preferences <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </section>
      <div className="dash-grid">
        <div className="dash-main">
          <section
            className="card restart-card"
            aria-labelledby="restart-title"
          >
            <div className="restart-copy">
              <span className={`badge ${stalled ? "is-coral" : "is-mint"}`}>
                {stalled
                  ? `${data.stall!.days} days since your last step`
                  : data.stall?.status === "unstuck"
                    ? "Unstuck, together"
                    : "Momentum building"}
              </span>
              <h2 id="restart-title">
                A 12-minute restart.
                <br />
                One real step.
              </h2>
              <p>
                You don’t need a free afternoon. Pick up one confirmed outcome
                and show a little evidence.
              </p>
              <div className="form-actions">
                <Link href={restartHref} className="btn btn-primary">
                  {data.task ? "Start my restart" : "Create my first restart"}
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link href="/outline" className="text-link">
                  Add a module <Plus size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="restart-clock" aria-hidden="true">
              <span className="label">Focus</span>
              <strong>12:00</strong>
              <span className="restart-clock-bar">
                <i />
              </span>
            </div>
          </section>
          <section
            className="card is-flat focus-card"
            aria-labelledby="focus-title"
          >
            <div className="card-head">
              <span className="tile is-accent" aria-hidden="true">
                <BookOpen size={20} />
              </span>
              <div>
                <span className="label">Current focus</span>
                <h3 id="focus-title">
                  {data.task?.outlineId === "node"
                    ? "REST, Auth & Testing a Node endpoint"
                    : data.task?.title || "A new chapter is waiting"}
                </h3>
              </div>
            </div>
            <p className="focus-outcome">
              {data.task?.outcomes[0] ||
                "Paste your module outline and confirm one outcome to begin."}
            </p>
            <div className="focus-foot">
              <small>{user.programme}</small>
              <Link className="text-link" href={restartHref}>
                Take the next step <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </section>
          <div className="section-title">
            <h2>Better with a little company</h2>
          </div>
          <div className="duo-grid">
            <Link className="card card-link action-card" href="/phone-a-friend">
              <span className="tile is-cobalt" aria-hidden="true">
                <Users size={20} />
              </span>
              <h3>Phone a Friend</h3>
              <p>A fresh pair of eyes on the thing you’re stuck on.</p>
              <span className="action-cta">
                Find your person <ArrowUpRight size={18} aria-hidden="true" />
              </span>
            </Link>
            <Link className="card card-link action-card" href="/map">
              <span className="tile is-mint" aria-hidden="true">
                <Compass size={20} />
              </span>
              <h3>Nearby</h3>
              <p>Study buddies and quiet desks in your approximate area.</p>
              <span className="action-cta">
                Explore nearby <ArrowUpRight size={18} aria-hidden="true" />
              </span>
            </Link>
          </div>
        </div>
        <aside className="dash-side" aria-label="Your support">
          <section className="card is-flat">
            <div className="card-head">
              <span className="tile" aria-hidden="true">
                <Sparkles size={20} />
              </span>
              <h3>A nudge from your coach</h3>
            </div>
            <blockquote className="coach-quote">
              {stalled
                ? `Hey ${firstName(user.name)}, picking up where you left off counts as progress. What’s one tiny thing we can tackle today?`
                : "A small step today is something to be proud of. Want to find your next one?"}
            </blockquote>
            <Link className="btn btn-block" href="/coach">
              Talk to my coach <MessageCircle size={17} aria-hidden="true" />
            </Link>
          </section>
          <section className="card is-flat stamp-summary">
            <div className="stamp-summary-art">
              {latest ? (
                <Stamp kind={latest.kind} size="is-sm" />
              ) : (
                <Stamp placeholder size="is-sm" />
              )}
            </div>
            <div>
              <span className="label">Stamps</span>
              <h3>
                {data.stamps.length
                  ? `${data.stamps.length} win${data.stamps.length === 1 ? "" : "s"} worth keeping`
                  : "Your first stamp is waiting"}
              </h3>
              <Link className="text-link" href="/stamps">
                See collection <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </section>
          <section className="card is-flat">
            <div className="card-head">
              <h3>Around your corner</h3>
              <span className="badge">~1 mi</span>
            </div>
            {data.peers.length ? (
              <ul className="peer-list">
                {data.peers.slice(0, 3).map((p) => (
                  <li key={p.id}>
                    <Link href="/phone-a-friend" className="peer-row">
                      <Avatar name={p.name} size="is-sm" />
                      <span>
                        <strong>{firstName(p.name)}</strong>
                        <small>
                          {p.topics[0] ?? "Open to study"} · {p.distance}
                        </small>
                      </span>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                Opt into nearby discovery in your{" "}
                <Link href="/profile">profile</Link> to find your people.
              </p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}

/* ---------- Landing ---------- */
function Landing() {
  return (
    <div className="landing">
      <SkipLink />
      <header className="landing-header">
        <Brand href="/" />
        <div className="landing-header-actions">
          <ThemeSwitch />
          <Link className="btn btn-sm" href="/login">
            Sign in
          </Link>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="label">
              For learners with a whole life to live
            </span>
            <h1 id="hero-title">
              Your degree. Your people. <mark>Your next small win.</mark>
            </h1>
            <p className="lede">
              When life interrupts your learning, find your way back: a
              12-minute restart, a nearby friend, and a little proof that you’re
              moving forward.
            </p>
            <div className="form-actions">
              <Link href="/login" className="btn btn-primary">
                Find your momentum <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a href="#how" className="btn">
                How it works <ArrowDown size={17} aria-hidden="true" />
              </a>
            </div>
            <small>
              MIVA-first. Open to every working learner. Free to start.
            </small>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="card hero-timer">
              <span className="label">Restart</span>
              <strong>12:00</strong>
              <span>One outcome. One doable task.</span>
            </div>
            <div className="card hero-connect">
              <ConnectionGraphic connected label="You" peerLabel="Tunde" />
              <span className="label">~0.4 mi · approximate</span>
            </div>
            <div className="hero-stamps">
              <Stamp />
              <Stamp kind="unstuck" />
            </div>
          </div>
        </section>
        <section id="how" className="how" aria-labelledby="how-title">
          <div className="section-title">
            <span className="label">How it works</span>
            <h2 id="how-title">Three small moves back to momentum.</h2>
          </div>
          <ol className="how-steps">
            {[
              [
                Clock,
                "Restart in 12 minutes",
                "Paste your module objectives or import a PDF, confirm the outcomes yourself, then take one doable step.",
                "is-accent",
              ],
              [
                Users,
                "Phone a Friend nearby",
                "Find an opted-in learner who can help with your topic. Request, chat, and finish together.",
                "is-cobalt",
              ],
              [
                Star,
                "Collect proof",
                "Every restart and every shared breakthrough earns a stamp you can hold onto.",
                "is-mint",
              ],
            ].map(([Icon, title, desc, tone], i) => {
              const I = Icon as typeof Clock;
              return (
                <li key={String(title)} className="card is-flat how-step">
                  <span className="num">{two(i + 1)}</span>
                  <span className={`tile ${tone}`} aria-hidden="true">
                    <I size={20} />
                  </span>
                  <h3>{String(title)}</h3>
                  <p>{String(desc)}</p>
                </li>
              );
            })}
          </ol>
        </section>
        <section className="privacy-band" aria-labelledby="privacy-title">
          <span className="tile is-mint" aria-hidden="true">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h2 id="privacy-title">Your neighbourhood, not your doorstep.</h2>
            <p>
              Nearby discovery and helping are off until you turn them on.
              Locations are rounded to about 100 metres, and exact GPS is never
              collected.
            </p>
          </div>
          <Link href="/login" className="btn btn-primary">
            Come on in <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      </main>
      <footer className="landing-footer">
        Made for the days life gets in the way.
      </footer>
    </div>
  );
}

/* ---------- Login ---------- */
function Login() {
  const router = useRouter();
  const { refresh } = useSession();
  const { run: act, busy, error } = useAction();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [data, setData] = useState<{ demo: boolean; magic: boolean }>();
  const [linkError, setLinkError] = useState("");
  useEffect(() => {
    setLinkError(
      new URLSearchParams(window.location.search).get("error") || "",
    );
    let live = true;
    api<{ demo: boolean; magic: boolean }>("auth/config")
      .then((d) => live && setData(d))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return (
    <div className="login-page">
      <SkipLink />
      <header className="landing-header">
        <Brand href="/" />
        <ThemeSwitch />
      </header>
      <main id="main" tabIndex={-1} className="login-main">
        <div className="login-card">
          <span className="label">There’s room for you here</span>
          <h1>A fresh start, anytime.</h1>
          <p>Sign in to pick up your learning where you left it.</p>
          {(error || linkError) && <ErrorAlert message={error || linkError} />}
          <form
            className="form"
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
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <button
              className="btn btn-primary btn-block"
              disabled={busy || !data?.magic}
            >
              Send me a magic link <ArrowRight size={17} aria-hidden="true" />
            </button>
            {sent && (
              <p role="status" className="alert is-success">
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>Check your inbox. Your sign-in link is on its way.</span>
              </p>
            )}
            {data && !data.magic && (
              <small>
                Email sign-in is not available on this deployment yet.
              </small>
            )}
          </form>
          {data?.demo && (
            <>
              <div className="divider">
                <span>or explore a demo learner</span>
              </div>
              <ul className="persona-list">
                {[
                  ["amaka", "Amaka Okafor", "A learner finding her momentum"],
                  ["tunde", "Tunde Adeyemi", "A helping hand with Node.js"],
                  ["chioma", "Chioma Eze", "Testing buddy & study desk host"],
                ].map(([persona, name, desc]) => (
                  <li key={persona}>
                    <button
                      className="persona"
                      disabled={busy}
                      onClick={() =>
                        act(async () => {
                          await api("auth/demo", { persona });
                          // New identity: reload the session (which swaps the
                          // per-user cache) before entering the app.
                          await refresh();
                          router.push("/home");
                        })
                      }
                    >
                      <Avatar name={name} />
                      <span>
                        <strong>{name}</strong>
                        <small>{desc}</small>
                      </span>
                      <ArrowRight size={17} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              <small className="demo-note">
                Shared demo learners, no email needed. Switch between them to
                try both sides of Phone a Friend.
              </small>
            </>
          )}
          <p className="privacy-caption">
            <ShieldCheck size={15} aria-hidden="true" /> Your location is yours
            to share.
          </p>
        </div>
      </main>
    </div>
  );
}

/* ---------- Coach ---------- */
function Coach({ user }: ScreenProps) {
  const store = useStore();
  const { run: act, busy, error: actionError } = useAction();
  const { data: home } = useResource<HomeData>("home");
  const { data, error, reload } = useResource<CoachMessageLog[]>("coach");
  const [message, setMessage] = useState("");
  const history = useChatScroll(data?.length ?? 0);
  const send = (value: string) =>
    act(async () => {
      await api("coach/inbound", { text: value });
      // Clear only what was sent; anything typed meanwhile is kept.
      setMessage((m) => (m === value ? "" : m));
      history.markSent();
      // Only DONE submissions can change the restart, stall or stamps.
      const affected = /^done\b/i.test(value.trim())
        ? ["coach", "home", "stamps"]
        : ["coach"];
      await store?.invalidate(
        (k) => affected.includes(k) || k.startsWith("tasks/"),
      );
    });
  return (
    <>
      <PageHead
        label="Coach"
        title="Someone in your corner."
        description="No lectures, no catching up. Just a nudge toward your next small step."
      />
      {actionError && <ErrorAlert message={actionError} />}
      <div className="chat-layout">
        <section className="chat-panel" aria-label="Coach conversation">
          <div className="chat-header">
            <span className="tile is-accent" aria-hidden="true">
              <Sparkles size={20} />
            </span>
            <div>
              <h2>Campus Coach</h2>
              <small>Rule-based guidance · replies instantly</small>
            </div>
          </div>
          <div className="chat-history-wrap">
            <div
              className="chat-history"
              ref={history.ref}
              onScroll={history.onScroll}
              tabIndex={0}
              role="log"
              aria-label="Messages"
              aria-live="polite"
              data-lenis-prevent
            >
              {!data ? (
                <Load error={error} onRetry={reload} />
              ) : data.length === 0 ? (
                <Empty
                  title={`Hey ${firstName(user.name)}`}
                  text="Tell me where you’re at. Try “stuck”, or create a restart from your outline."
                />
              ) : (
                data.map((m) => (
                  <div
                    key={m.id}
                    className={`bubble ${m.role === "user" ? "is-mine" : ""}`}
                  >
                    <p>{m.text}</p>
                    <small>
                      {m.role === "coach" ? "Coach" : "You"} ·{" "}
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                ))
              )}
            </div>
            <NewMessages show={history.unseen} onClick={history.jump} />
          </div>
          {data && <StaleNote error={error} onRetry={reload} />}
          <div className="quick-replies" aria-label="Quick replies">
            <button
              className="btn btn-sm"
              disabled={busy}
              onClick={() => send("I’m stuck")}
            >
              I’m stuck
            </button>
            <button
              className="btn btn-sm"
              disabled={busy}
              onClick={() => send("Make a plan")}
            >
              Make a plan
            </button>
            <button
              className="btn btn-sm"
              disabled={busy}
              onClick={() => send("Practice question")}
            >
              Practice prompt
            </button>
            <Link className="btn btn-sm" href="/phone-a-friend">
              Find a friend <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <Link className="btn btn-sm" href="/outline">
              Add objectives / PDF
            </Link>
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
              className="icon-btn is-primary"
              disabled={busy || !message.trim()}
              aria-label="Send message"
            >
              <Send size={18} aria-hidden="true" />
            </button>
          </form>
        </section>
        <aside className="side-stack" aria-label="How to submit progress">
          <section className="card is-flat">
            <h3>Progress, in your own words.</h3>
            {home?.task && (
              <div className="mini-rubric">
                <span className="label">Your restart rubric</span>
                <ol>
                  {home.task.rubric.map((r, i) => (
                    <li key={r}>
                      <span className="num">{i + 1}</span>
                      {r}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <p>
              Read the rubric before submitting. When you’re ready, send{" "}
              <strong>DONE</strong> followed by what you tried and what
              happened.
            </p>
            <p>
              Want to share a photo URL? Add it on the restart page alongside
              your written evidence.
            </p>
            <Link href="/home" className="text-link">
              Open my restart <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </section>
          <p className="side-note">
            <ShieldCheck size={16} aria-hidden="true" />
            Coach messages are private to your account. Demo learners share
            their demo history.
          </p>
        </aside>
      </div>
    </>
  );
}

/* ---------- Nearby map ---------- */
function MapScreen(_: ScreenProps) {
  const store = useStore();
  const { run: act, busy, error: actionError } = useAction();
  const { data, error, reload } = useResource<MapData>("map/pins");
  const [kind, setKind] = useState<"desk" | "buddy">("desk");
  const [title, setTitle] = useState("");
  if (!data) return <Load error={error} onRetry={reload} />;
  return (
    <>
      <PageHead
        label="Nearby"
        title="Your people are closer than you think."
        description="Study buddies, helping hands and quiet desks in your approximate area."
        action={
          <span className="badge is-mint">
            <Pin size={14} aria-hidden="true" /> Within ~1 mile
          </span>
        }
      />
      {!data.enabled ? (
        <Empty
          title="Let your campus find you"
          text="Nearby discovery is off. Choose an approximate area and opt in from your profile."
          href="/profile"
          label="Set my preferences"
        />
      ) : (
        <div className="map-layout">
          <section className="map-panel" aria-label="Nearby map">
            <NearbyMap {...data} />
            <div className="map-legend">
              <span>
                <i className="legend-swatch is-you" aria-hidden="true" /> You
              </span>
              <span>
                <i className="legend-swatch is-peer" aria-hidden="true" />{" "}
                Learners
              </span>
              <span>
                <i className="legend-swatch is-desk" aria-hidden="true" /> Study
                spots
              </span>
              <span>
                <ShieldCheck size={15} aria-hidden="true" /> Approximate only
              </span>
            </div>
          </section>
          <div className="side-stack">
            <section className="card is-flat">
              <h3>Around your corner</h3>
              {data.peers.length ? (
                <ul className="peer-list">
                  {data.peers.map((p) => (
                    <li key={p.id}>
                      <Link
                        href="/phone-a-friend"
                        className="peer-row"
                        aria-label={`Connect with ${p.name}`}
                      >
                        <Avatar name={p.name} size="is-sm" />
                        <span>
                          <strong>{firstName(p.name)}</strong>
                          <small>
                            {p.topics[0] ?? "Open to study"} · {p.distance}
                          </small>
                        </span>
                        <ArrowUpRight size={16} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No opted-in learners in this area yet.</p>
              )}
              {data.pins.length > 0 && (
                <ul className="spot-list">
                  {data.pins.map((p) => (
                    <li key={p.id}>
                      <span className="tile is-mint" aria-hidden="true">
                        <BookOpen size={17} />
                      </span>
                      <span>
                        <strong>{p.title}</strong>
                        <small>
                          {p.kind === "desk" ? "Study desk" : "Buddy spot"} ·
                          community shared
                        </small>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="card is-flat">
              <h3>Share a study spot</h3>
              <p>Add a desk or buddy pin in your approximate area.</p>
              <form
                className="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  act(async () => {
                    await api("map/pins", { kind, title });
                    setTitle("");
                    await store?.invalidate(["map/pins"]);
                  });
                }}
              >
                {actionError && <ErrorAlert message={actionError} />}
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
                <button disabled={busy} className="btn btn-primary btn-block">
                  <Plus size={16} aria-hidden="true" /> Share a pin
                </button>
              </form>
            </section>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Phone a Friend ---------- */
function Friends({ user }: ScreenProps) {
  const store = useStore();
  const { run: act, busy } = useAction();
  // Poll for new requests and status changes while this screen is open.
  const { data, error, reload } = useResource<{
    requests: HelpRequest[];
    peers: Peer[];
  }>("help-requests", { poll: 10000 });
  const router = useRouter();
  const titleId = useLabelId("request-title");
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
    <div className="friends">
      <section className="friends-hero" aria-labelledby="friends-title">
        <div>
          <span className="label">Phone a Friend</span>
          <h1 id="friends-title">
            A fresh perspective, closer than you think.
          </h1>
          <p className="lede">
            Bring the problem you’re sitting with. Find a learner who can help
            you see it differently.
          </p>
          <a className="btn" href="#find-a-friend">
            Find your person <ArrowDown size={16} aria-hidden="true" />
          </a>
        </div>
        <div className="card is-flat friends-visual">
          <ConnectionGraphic />
          <p className="friends-count">
            <span className="dot" aria-hidden="true" />
            {data
              ? `${data.peers.length} ${data.peers.length === 1 ? "learner" : "learners"} open to helping within 1.6 km`
              : "Finding nearby learners…"}
          </p>
        </div>
      </section>
      <ol className="process" aria-label="How peer support works">
        <li>
          <span className="num">01</span>
          <strong>Share where you’re stuck.</strong>
        </li>
        <li>
          <span className="num">02</span>
          <strong>Work through it together.</strong>
        </li>
        <li>
          <span className="num">03</span>
          <strong>Both finish. Both earn a stamp.</strong>
        </li>
      </ol>
      <section
        className="discovery"
        id="find-a-friend"
        aria-labelledby="discovery-title"
      >
        <div className="discovery-head">
          <h2 id="discovery-title">
            Find your kind of help{" "}
            <span className="badge">
              {data ? two(peers.length) : "—"}
              <span className="sr-only"> matches</span>
            </span>
          </h2>
          <label className="search-field">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Search a topic, name or programme</span>
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Topic, name or programme"
            />
            {filter && (
              <button
                type="button"
                className="search-clear"
                aria-label="Clear search"
                onClick={() => setFilter("")}
              >
                <X size={16} />
              </button>
            )}
          </label>
        </div>
        <div className="chip-row" role="group" aria-label="Filter by topic">
          <button
            className="chip"
            aria-pressed={!filter}
            onClick={() => setFilter("")}
          >
            All topics
          </button>
          {topics.map((t) => (
            <button
              key={t}
              className="chip"
              aria-pressed={filter === t}
              onClick={() => setFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {!data ? (
          <Load error={error} onRetry={reload} />
        ) : (
          <>
            <StaleNote error={error} onRetry={reload} />
            <ul className="friend-grid">
              {peers.map((p) => (
                <li key={p.id} className="card is-flat friend-card">
                  <div className="friend-identity">
                    <Avatar name={p.name} size="is-lg" />
                    <div>
                      <h3>{p.name}</h3>
                      <small>{p.programme}</small>
                    </div>
                  </div>
                  <span className="badge is-mint friend-open">
                    <Check size={13} aria-hidden="true" /> Open to help
                  </span>
                  <div className="friend-strengths">
                    <span className="label">Self-reported strengths</span>
                    {p.matchReason && <p>{p.matchReason}</p>}
                    <div className="tag-list">
                      {(p.strengths?.length ? p.strengths : p.topics).map(
                        (t) => (
                          <span className="tag" key={t}>
                            {t}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="friend-foot">
                    <span className="friend-distance">
                      <Pin size={15} aria-hidden="true" />
                      {p.distance} away
                    </span>
                    <button
                      className="btn btn-cobalt"
                      disabled={busy}
                      onClick={() => {
                        setSelected(p);
                        setTopic(
                          p.strengths?.[0] || p.topics[0] || "Study planning",
                        );
                        setRequestError("");
                      }}
                    >
                      Ask {firstName(p.name)}
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
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
        <p className="side-note">
          <ShieldCheck size={15} aria-hidden="true" />
          Your neighbourhood, not your doorstep. Locations stay approximate.
        </p>
      </section>
      <section className="connections" aria-labelledby="connections-title">
        <div className="section-title">
          <h2 id="connections-title">Your conversations</h2>
          <span className="badge">{two(data?.requests.length ?? 0)}</span>
        </div>
        {data && data.requests.length > 0 ? (
          <ul className="request-list">
            {data.requests.map((r) => (
              <li key={r.id}>
                <Link className="request-row" href={`/help/${r.id}`}>
                  <span className="tile is-cobalt" aria-hidden="true">
                    <MessageCircle size={18} />
                  </span>
                  <span className="request-text">
                    <strong>{r.topic}</strong>
                    <small>
                      {r.fromId === user.id
                        ? "You asked for a hand"
                        : "A learner requested your help"}{" "}
                      · {new Date(r.createdAt).toLocaleDateString()}
                    </small>
                  </span>
                  <StatusBadge status={r.status} />
                  <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          data && (
            <p className="empty-line">
              <MessageCircle size={18} aria-hidden="true" /> No conversations
              yet. Your next connection starts with a request.
            </p>
          )
        )}
      </section>
      {selected && (
        <Dialog onClose={() => setSelected(null)} labelledBy={titleId}>
          <button
            className="icon-btn close-button"
            aria-label="Close request"
            onClick={() => setSelected(null)}
          >
            <X size={18} />
          </button>
          <div className="dialog-head">
            <Avatar name={selected.name} size="is-lg" />
            <div>
              <span className="label">Start a conversation</span>
              <h2 id={titleId}>Ask {firstName(selected.name)} for a hand</h2>
            </div>
          </div>
          <p>Share what you tried and where it stopped making sense.</p>
          {requestError && <ErrorAlert message={requestError} />}
          <form
            className="form"
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
                  void store?.invalidate(["help-requests", "home"]);
                  router.push(`/help/${r.id}`);
                } catch (e) {
                  if (e instanceof HttpError && e.status === 401) throw e;
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
            <button disabled={busy} className="btn btn-primary btn-block">
              {busy ? "Sending…" : "Send request"}{" "}
              <ArrowUpRight size={17} aria-hidden="true" />
            </button>
          </form>
        </Dialog>
      )}
    </div>
  );
}

/* ---------- Help session ---------- */
function HelpScreen({ user, rid }: ScreenProps & { rid: string }) {
  const router = useRouter();
  const store = useStore();
  const { run: act, busy, error: actionError } = useAction();
  const key = `help-requests/${rid}`;
  // Poll the conversation while it is open; paused in hidden tabs.
  const { data, error, reload } = useResource<HelpData>(key, { poll: 5000 });
  /** Apply a lifecycle response, then refresh only what it affects. */
  const respond = (action: "accept" | "decline" | "complete") =>
    act(async () => {
      const r = await api<HelpRequest>(`${key}/${action}`, {});
      store?.set<HelpData>(key, (prev) => (prev ? { ...prev, ...r } : prev!));
      const affected = ["help-requests", "home", key];
      if (r.status === "completed") affected.push("stamps");
      await store?.invalidate(affected);
    });
  const [message, setMessage] = useState("");
  const [report, setReport] = useState(false);
  const [reason, setReason] = useState("");
  const firstStatus = useRef<HelpRequest["status"] | null>(null);
  if (data && firstStatus.current === null) firstStatus.current = data.status;
  const history = useChatScroll(data?.messages.length ?? 0);
  if (!data) return <Load error={error} onRetry={reload} />;
  const peer = data.participants.find((p) => p.id !== user.id)!;
  const justCompleted =
    data.status === "completed" && firstStatus.current !== "completed";
  return (
    <>
      <PageHead
        label="Help session"
        title={data.topic}
        description={`Figuring it out together with ${peer.name}.`}
        action={<StatusBadge status={data.status} />}
      />
      <StaleNote error={error} onRetry={reload} />
      {actionError && <ErrorAlert message={actionError} />}
      <div className="chat-layout">
        <section
          className="chat-panel"
          aria-label={`Conversation with ${peer.name}`}
        >
          <div className="chat-header">
            <Avatar name={peer.name} />
            <div>
              <h2>{peer.name}</h2>
              <small>Location stays approximate</small>
            </div>
          </div>
          <div className="session-status" aria-live="polite">
            {data.status === "pending" ? (
              data.toId === user.id ? (
                <>
                  <p>
                    <strong>{firstName(peer.name)} could use a hand.</strong>{" "}
                    Ready to join?
                  </p>
                  <div className="form-actions">
                    <button
                      className="btn btn-primary"
                      disabled={busy}
                      onClick={() => respond("accept")}
                    >
                      <Check size={17} aria-hidden="true" /> Accept request
                    </button>
                    <button
                      className="btn"
                      disabled={busy}
                      onClick={() => respond("decline")}
                    >
                      Not right now
                    </button>
                  </div>
                </>
              ) : (
                <p>
                  <Clock size={16} aria-hidden="true" /> Your request is on its
                  way. Waiting for {firstName(peer.name)} to accept.
                </p>
              )
            ) : data.status === "completed" ? (
              <div className="completion">
                <div className="completion-art">
                  <ConnectionGraphic
                    connected
                    label="You"
                    peerLabel={firstName(peer.name)}
                  />
                  <StampLand stampKey={`help-${rid}`} force={justCompleted}>
                    <Stamp kind="unstuck" size="is-sm" />
                  </StampLand>
                </div>
                <div>
                  <h3>You did it, together.</h3>
                  <p>Both of you marked this complete.</p>
                  <Link className="text-link" href="/stamps">
                    See your UNSTUCK stamp{" "}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
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
                    : "When you’re both done, you’ll each earn a stamp."}
                </p>
                <button
                  className="btn btn-primary"
                  disabled={busy || data.completedBy.includes(user.id)}
                  onClick={() => respond("complete")}
                >
                  <Check size={17} aria-hidden="true" />
                  {data.completedBy.includes(user.id)
                    ? "Marked complete"
                    : "I’m done — mark complete"}
                </button>
              </>
            )}
          </div>
          <div className="chat-history-wrap">
            <div
              className="chat-history"
              ref={history.ref}
              onScroll={history.onScroll}
              tabIndex={0}
              role="log"
              aria-label="Messages"
              data-lenis-prevent
            >
              {data.messages.length === 0 && (
                <p className="empty-line">No messages yet.</p>
              )}
              {data.messages.map((m) => (
                <div
                  className={`bubble ${m.userId === user.id ? "is-mine" : ""}`}
                  key={m.id}
                >
                  <p>{m.text}</p>
                  <small>
                    {m.userId === user.id ? "You" : firstName(peer.name)} ·{" "}
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </div>
              ))}
            </div>
            <NewMessages show={history.unseen} onClick={history.jump} />
          </div>
          {data.status === "accepted" && (
            <form
              className="chat-compose"
              onSubmit={(e) => {
                e.preventDefault();
                const text = message;
                act(async () => {
                  await api(`${key}/messages`, { text });
                  // Keep anything typed while the message was sending.
                  setMessage((m) => (m === text ? "" : m));
                  history.markSent();
                  await store?.invalidate([key]);
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
                disabled={busy || !message.trim()}
                className="icon-btn is-primary"
                aria-label="Send message"
              >
                <Send size={18} aria-hidden="true" />
              </button>
            </form>
          )}
        </section>
        <aside className="side-stack" aria-label="Session guidance">
          <section className="card is-flat">
            <h3>Good help starts small.</h3>
            <p>
              Share what you tried, what you expected, and what actually
              happened. Keep personal details private.
            </p>
            {user.demo && (
              <div className="alert is-info">
                <Sparkles size={18} aria-hidden="true" />
                <span>
                  <strong>Trying the demo?</strong> Switch to{" "}
                  {firstName(peer.name)} from the top bar, open this request
                  under Phone a Friend, and respond. Switch back to complete
                  both sides.
                </span>
              </div>
            )}
          </section>
          <section className="card is-flat">
            <button
              className="btn btn-ghost"
              aria-expanded={report}
              onClick={() => setReport(!report)}
            >
              <Flag size={16} aria-hidden="true" /> Report or block
            </button>
            {report && (
              <form
                className="form report-form"
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
                  Reports are recorded. There is no staffed moderation service
                  yet.
                </small>
                <div className="form-actions">
                  <button className="btn" disabled={busy}>
                    Record report
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={busy}
                    onClick={() =>
                      act(async () => {
                        await api("safety", {
                          targetId: peer.id,
                          action: "block",
                          reason: reason || "Blocked by learner",
                        });
                        // Client navigation; then refresh what blocking changes.
                        router.push("/phone-a-friend");
                        void store?.invalidate((k) => k !== key);
                      })
                    }
                  >
                    Block learner
                  </button>
                </div>
              </form>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}

/* ---------- Outline / PDF import / outcome confirmation ---------- */
function Stepper({ current }: { current: number }) {
  const steps = ["Your outline", "Confirm outcomes", "Your restart"];
  return (
    <ol className="stepper" aria-label="Progress">
      {steps.map((s, i) => (
        <li key={s} aria-current={i === current ? "step" : undefined}>
          <span
            className={`num ${i < current ? "is-done" : i === current ? "is-current" : ""}`}
          >
            {i < current ? <Check size={15} aria-label="Done" /> : two(i + 1)}
          </span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}
function Outline(_: ScreenProps) {
  const router = useRouter();
  const store = useStore();
  const { run: act, busy, error: actionError } = useAction();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [outline, setOutline] = useState<
    (ModuleOutline & { outcomes: Outcome[] }) | null
  >(null);
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (outline) stepHeading.current?.focus();
  }, [outline]);
  return (
    <>
      <PageHead
        label="Module outline"
        title="What are you learning?"
        description="Bring your outline. You choose the outcomes; we help you find a manageable place to begin."
      />
      <Stepper current={outline ? 1 : 0} />
      <div className="work-layout">
        <section className="card work-card">
          {actionError && <ErrorAlert message={actionError} />}
          {!outline ? (
            <form
              className="form"
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
              <div>
                <span className="label">Step 01</span>
                <h2>Start with what’s already there.</h2>
              </div>
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
                Paste or review your module objectives
                <span className="hint">One outcome per line works best.</span>
                <textarea
                  className="is-large"
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
              <div className="form-actions">
                <button disabled={busy} className="btn btn-primary">
                  {busy ? "Finding outcomes…" : "Find my outcomes"}{" "}
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>
            </form>
          ) : (
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                act(async () => {
                  const task = await api<RestartTask>(
                    `outlines/${outline.id}/confirm`,
                    { outcomes },
                  );
                  void store?.invalidate(["home"]);
                  router.push(`/task/${task.id}`);
                });
              }}
            >
              <div>
                <span className="label">Step 02 · Your say, always</span>
                <h2 ref={stepHeading} tabIndex={-1}>
                  Make these outcomes yours.
                </h2>
              </div>
              <p>
                These lines were taken from your text. Edit or remove anything
                that isn’t a learning outcome. Your first outcome becomes your
                restart.
              </p>
              {outcomes.length === 0 && (
                <div className="alert is-warning">
                  <AlertCircle size={18} aria-hidden="true" />
                  <span>
                    No outcomes left. Add at least one outcome to continue.
                  </span>
                </div>
              )}
              <ol className="outcome-list">
                {outcomes.map((o, i) => (
                  <li className="outcome-edit" key={i}>
                    <span className="num" aria-hidden="true">
                      {i + 1}
                    </span>
                    <label>
                      <span className="sr-only">Outcome {i + 1}</span>
                      <textarea
                        required
                        minLength={5}
                        maxLength={400}
                        value={o}
                        aria-label={`Outcome ${i + 1}`}
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
                      className="icon-btn"
                      aria-label={`Remove outcome ${i + 1}`}
                      onClick={() =>
                        setOutcomes(outcomes.filter((_, n) => n !== i))
                      }
                    >
                      <X size={17} />
                    </button>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                className="btn btn-sm add-outcome"
                disabled={outcomes.length >= 12}
                onClick={() => setOutcomes([...outcomes, ""])}
              >
                <Plus size={16} aria-hidden="true" /> Add an outcome
              </button>
              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  disabled={busy || !outcomes.length}
                >
                  Confirm & create my restart{" "}
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>
            </form>
          )}
        </section>
        <aside className="side-stack">
          <section className="card is-flat">
            <span className="tile is-mint" aria-hidden="true">
              <ShieldCheck size={20} />
            </span>
            <h3>No invented outcomes.</h3>
            <p>
              Outcomes come only from the text you provide. You review and
              confirm every one before a task is created.
            </p>
          </section>
          <section className="card is-flat">
            <span className="tile is-accent" aria-hidden="true">
              <Clock size={20} />
            </span>
            <h3>Make space for 12 minutes.</h3>
            <p>
              We’ll pick your first confirmed outcome, show a simple rubric, and
              ask for a little evidence of progress.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}

/* ---------- Restart task ---------- */
type TaskData = { task: RestartTask; submissions: Submission[] };
function TaskScreen({ tid }: ScreenProps & { tid: string }) {
  const store = useStore();
  const { run: act, busy, error: actionError } = useAction();
  const key = `tasks/${tid}`;
  const { data, error, reload } = useResource<TaskData>(key);
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
  if (!data) return <Load error={error} onRetry={reload} />;
  const clock = `${two(Math.floor(seconds / 60))}:${two(seconds % 60)}`;
  return (
    <>
      <PageHead
        label="Restart · 12 minutes"
        title={data.task.title}
        description="Explore, try, notice. Perfection isn’t on the rubric."
      />
      <div className="work-layout">
        <section className="card work-card">
          {actionError && <ErrorAlert message={actionError} />}
          <span className="label">Your confirmed outcome</span>
          <h2 className="task-outcome">{data.task.outcomes[0]}</h2>
          <div className="rubric">
            <h3>
              <Check size={18} aria-hidden="true" /> What counts as proof
            </h3>
            <p>
              You’ll earn a stamp when your evidence meets all three checks.
            </p>
            <ol>
              {data.task.rubric.map((r, i) => (
                <li key={r}>
                  <span className="num">{i + 1}</span>
                  <span>{r}</span>
                </li>
              ))}
            </ol>
            <small>
              Scoring checks your written evidence. Photo URLs support your
              note; images are not analyzed.
            </small>
          </div>
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              act(async () => {
                const r = await api<Submission>(`tasks/${tid}/submit`, {
                  text,
                  ...(photoUrl ? { photoUrl } : {}),
                });
                setResult(r);
                setRunning(false);
                // Add the attempt from the response; refresh only what a
                // passing submission changes.
                store?.set<TaskData>(key, (prev) =>
                  prev
                    ? { ...prev, submissions: [...prev.submissions, r] }
                    : prev!,
                );
                if (r.score === 3) void store?.invalidate(["home", "stamps"]);
              });
            }}
          >
            <label>
              Show your small step
              <span className="hint">
                What did you try, what happened, and what did you learn?
              </span>
              <textarea
                className="is-large"
                required
                maxLength={4000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="I tried… The result was… I learned…"
              />
            </label>
            <label>
              <span>
                Photo URL{" "}
                <span className="optional">optional · HTTPS only</span>
              </span>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhoto(e.target.value)}
                placeholder="https://…"
              />
            </label>
            <div className="form-actions">
              <button className="btn btn-primary" disabled={busy}>
                {busy ? "Checking…" : "Submit my proof"}{" "}
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
          </form>
          {result && (
            <div
              role="status"
              className={`result ${result.score === 3 ? "is-passed" : ""}`}
            >
              {result.score === 3 && (
                <StampLand stampKey={`task-${tid}`} force>
                  <Stamp size="is-sm" />
                </StampLand>
              )}
              <div>
                <strong>
                  {result.score === 3
                    ? "A small win. Officially yours."
                    : `${result.score}/3 checks met — you’re getting there.`}
                </strong>
                <p>{result.feedback}</p>
                {result.score === 3 && (
                  <Link className="text-link" href="/stamps">
                    See my stamp <Star size={16} aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>
          )}
          {data.submissions.length > 0 && (
            <div className="history">
              <h3>Your attempts</h3>
              <ul>
                {data.submissions
                  .slice()
                  .reverse()
                  .slice(0, 5)
                  .map((s) => (
                    <li key={s.id}>
                      <span
                        className={`badge ${s.score === 3 ? "is-mint" : ""}`}
                      >
                        {s.score}/3 checks
                      </span>
                      <small>{new Date(s.createdAt).toLocaleString()}</small>
                      <p>{s.feedback}</p>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </section>
        <aside className="side-stack">
          <section className="card timer-card" aria-label="Focus timer">
            <span className="label">A pocket of focus</span>
            <strong className="timer" aria-live="off">
              {clock}
            </strong>
            <span className="sr-only" role="status">
              {seconds === 0
                ? "Twelve minutes complete."
                : running
                  ? "Timer running."
                  : "Timer paused."}
            </span>
            <span className="timer-bar" aria-hidden="true">
              <i style={{ transform: `scaleX(${seconds / 720})` }} />
            </span>
            <button
              className="btn btn-primary btn-block"
              disabled={seconds === 0}
              aria-pressed={running}
              onClick={() => setRunning(!running)}
            >
              {running ? (
                <Pause size={17} aria-hidden="true" />
              ) : (
                <Play size={17} aria-hidden="true" />
              )}
              {running
                ? "Pause"
                : seconds === 0
                  ? "Your 12 minutes are done"
                  : seconds < 720
                    ? "Resume"
                    : "Start my 12 minutes"}
            </button>
            <small>A gentle guide. Submit whenever you’re ready.</small>
          </section>
          <section className="card is-flat">
            <span className="tile is-cobalt" aria-hidden="true">
              <Users size={20} />
            </span>
            <h3>Hit a wall?</h3>
            <p>A friend might see the one thing you’re missing.</p>
            <Link className="text-link" href="/phone-a-friend">
              Ask for a hand <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}

/* ---------- Stamps ---------- */
function Stamps() {
  const { data, error, reload } = useResource<ProofStamp[]>("stamps");
  return (
    <>
      <PageHead
        label="Stamps"
        title="Small wins, worth collecting."
        description="Not a streak to protect. A collection of moments you found your way forward."
        action={
          data && data.length > 0 ? (
            <span className="badge is-accent">
              {two(data.length)} collected
            </span>
          ) : undefined
        }
      />
      {!data ? (
        <Load error={error} onRetry={reload} />
      ) : !data.length ? (
        <div className="card is-flat stamp-empty">
          <Stamp placeholder />
          <div>
            <h2>Your collection starts with one step.</h2>
            <p>
              Complete a restart or a Phone a Friend session to earn your first
              stamp.
            </p>
            <Link href="/home" className="btn btn-primary">
              Find my next small win <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : (
        <ul className="stamp-grid">
          {data.map((s, i) => (
            <li className="card is-flat stamp-card" key={s.id}>
              <span className="stamp-no">No. {two(i + 1)}</span>
              <StampLand stampKey={s.id} createdAt={s.createdAt}>
                <Stamp kind={s.kind} />
              </StampLand>
              <h2>{s.title}</h2>
              <p>
                {s.kind === "unstuck"
                  ? "A breakthrough, shared with a friend."
                  : "You showed up and took one real step."}
              </p>
              <small>
                {new Date(s.createdAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </small>
              <Link
                className="text-link"
                href={
                  s.kind === "unstuck"
                    ? `/help/${s.sourceId}`
                    : `/task/${s.sourceId}`
                }
              >
                See the story <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ---------- Profile ---------- */
function Profile({ user }: ScreenProps) {
  const router = useRouter();
  const store = useStore();
  const { setUser, signOut } = useSession();
  const { run: act, busy, error: actionError } = useAction();
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
      <PageHead
        label="Profile & privacy"
        title="A little about you."
        description="Share what brings you here. Choose how you connect."
      />
      <div className="quick-links">
        <Link className="btn btn-sm" href="/onboarding">
          Learning preferences & strengths{" "}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
        <Link className="btn btn-sm" href="/outline">
          My outline / PDF <BookOpen size={16} aria-hidden="true" />
        </Link>
      </div>
      <div className="work-layout">
        <section className="card work-card">
          {actionError && <ErrorAlert message={actionError} />}
          <div className="profile-intro">
            <Avatar name={name} size="is-lg" />
            <div>
              <h2>{name}</h2>
              <small>
                {user.demo ? "Shared demo learner" : "Your learner profile"}
              </small>
            </div>
          </div>
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              setSaved(false);
              act(async () => {
                const updated = await api<User>(
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
                // Update the shell from the saved profile and refresh only the
                // data that depends on consent, location or topics.
                setUser(updated);
                void store?.invalidate(["home", "map/pins", "help-requests"]);
                setSaved(true);
              });
            }}
          >
            <fieldset className="form-section">
              <legend>
                <span className="num">01</span> About you
              </legend>
              <label>
                Your name
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
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
                <span className="hint">Separate topics with commas.</span>
                <input
                  maxLength={500}
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="Node.js, Testing, Study planning"
                />
              </label>
            </fieldset>
            <fieldset className="form-section">
              <legend>
                <span className="num">02</span> Your approximate area
              </legend>
              <p>
                Use a neighbourhood centre, never your home address. Coordinates
                are rounded to about 100 metres. The starting area is Yaba,
                Lagos.
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
              <details className="disclosure">
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
            </fieldset>
            <fieldset className="form-section">
              <legend>
                <span className="num">03</span> Discovery & helping
              </legend>
              <label className="toggle-row">
                <span>
                  <strong>Show me on the nearby map</strong>
                  <small>
                    Let opted-in learners within ~1.6 km discover me.
                  </small>
                </span>
                <span className="toggle-state" aria-hidden="true">
                  {nearby ? "ON" : "OFF"}
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
                <span className="toggle-state" aria-hidden="true">
                  {helper ? "ON" : "OFF"}
                </span>
                <input
                  type="checkbox"
                  checked={helper}
                  onChange={(e) => setHelper(e.target.checked)}
                />
              </label>
            </fieldset>
            <div className="form-actions">
              <button disabled={busy} className="btn btn-primary">
                {busy ? "Saving…" : "Save my preferences"}{" "}
                <Check size={17} aria-hidden="true" />
              </button>
              {saved && (
                <span className="status-line" role="status">
                  <CheckCircle2 size={18} aria-hidden="true" /> Saved. Your
                  campus, your way.
                </span>
              )}
            </div>
          </form>
        </section>
        <aside className="side-stack">
          <section className="card is-flat">
            <span className="tile is-mint" aria-hidden="true">
              <ShieldCheck size={20} />
            </span>
            <h3>Privacy is a starting point.</h3>
            <p>
              New accounts begin with discovery and helping turned off. We never
              request exact GPS, even after a request is accepted.
            </p>
            <p>
              You control when you’re visible. Blocking a learner removes
              discovery and access to your shared help session.
            </p>
          </section>
          <button
            className="btn btn-block"
            disabled={busy}
            onClick={() =>
              act(async () => {
                await api("auth/logout", {});
                signOut(); // drops the session and this user's cached data
                router.push("/login");
              })
            }
          >
            <LogOut size={16} aria-hidden="true" /> Sign out
          </button>
        </aside>
      </div>
    </>
  );
}
