import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { currentUser, demoSession, supaAuth } from "@/lib/auth";
import { mutate, readState } from "@/lib/store";
import { completeHelp, id, now, State, User, visiblePeers } from "@/lib/domain";
import { ai, coach } from "@/lib/providers";
import { saveLearning, helperSuggestions, coachReply } from "@/lib/learning";
import { isAllowedOrigin } from "@/lib/origin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
function fail(status: number, message: string): never {
  throw new HttpError(status, message);
}
const text = z.string().trim().min(1).max(4000);
const photo = z
  .string()
  .url()
  .max(2000)
  .refine((v) => v.startsWith("https://"), "Use an HTTPS photo URL")
  .optional();
function taskFor(s: State, uid: string, tid: string) {
  return (
    s.tasks.find((t) => t.id === tid && t.userId === uid) ??
    fail(404, "Task not found.")
  );
}
function requestFor(s: State, uid: string, rid: string) {
  const r =
    s.requests.find((r) => r.id === rid && [r.fromId, r.toId].includes(uid)) ??
    fail(404, "Request not found.");
  const a = s.users.find((u) => u.id === r.fromId)!;
  const b = s.users.find((u) => u.id === r.toId)!;
  if (a.blocked.includes(b.id) || b.blocked.includes(a.id))
    fail(403, "This connection is blocked.");
  return r;
}
function submit(
  s: State,
  u: User,
  tid: string,
  evidence: string,
  photoUrl?: string,
) {
  const task = taskFor(s, u.id, tid);
  const result = ai.score(task, evidence);
  const submission = {
    id: id(),
    userId: u.id,
    taskId: tid,
    text: evidence,
    photoUrl,
    ...result,
    createdAt: now(),
  };
  s.submissions.push(submission);
  if (result.score === 3) {
    if (!s.stamps.some((x) => x.userId === u.id && x.sourceId === tid))
      s.stamps.push({
        id: id(),
        userId: u.id,
        kind: "restart",
        title: "The comeback",
        sourceId: tid,
        createdAt: now(),
      });
    const stall = s.stalls.find((x) => x.userId === u.id);
    if (stall) {
      stall.status = "active";
      stall.lastActivity = now();
    }
  }
  return submission;
}
async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  try {
    const parts = (await ctx.params).path;
    const path = parts.join("/");
    const method = req.method;
    if (path === "whatsapp/twilio" && method === "POST") {
      if (!process.env.TWILIO_AUTH_TOKEN)
        return NextResponse.json(
          {
            error:
              "Twilio sandbox optional; not configured. Use the in-app coach.",
          },
          { status: 503 },
        );
      const form = await req.formData();
      const params = Object.fromEntries(
        [...form].map(([k, v]) => [k, String(v)]),
      );
      const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/twilio`;
      const expected = createHmac("sha1", process.env.TWILIO_AUTH_TOKEN)
        .update(
          url +
            Object.keys(params)
              .sort()
              .map((k) => k + params[k])
              .join(""),
        )
        .digest("base64");
      const sig = req.headers.get("x-twilio-signature") || "";
      if (
        sig.length !== expected.length ||
        !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
      )
        fail(403, "Invalid Twilio signature.");
      z.object({ Body: text, From: z.string().startsWith("whatsapp:") }).parse(
        params,
      );
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>CampusSignal received your message. Open the in-app coach to submit evidence or connect with a friend. Phone-to-account linking is not enabled in this MVP.</Message></Response>',
        { headers: { "Content-Type": "text/xml" } },
      );
    }
    if (method !== "GET") {
      const origin = req.headers.get("origin");
      if (
        !isAllowedOrigin(
          origin,
          req.nextUrl.href,
          req.headers.get("host"),
          process.env.NEXT_PUBLIC_APP_URL,
        )
      )
        fail(403, "Invalid request origin.");
    }
    if (path === "auth/config" && method === "GET")
      return NextResponse.json({
        demo: process.env.DEMO_LOGIN === "1",
        magic: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      });
    if (path === "auth/demo" && method === "POST") {
      if (process.env.DEMO_LOGIN !== "1") fail(403, "Demo login is disabled.");
      const { persona } = z
        .object({ persona: z.enum(["amaka", "tunde", "chioma"]) })
        .parse(await req.json());
      await demoSession(persona);
      return NextResponse.json({ ok: true });
    }
    if (path === "auth/magic-link" && method === "POST") {
      const { email } = z
        .object({ email: z.string().email().max(254) })
        .parse(await req.json());
      if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        fail(503, "Magic links need Supabase setup. Use a demo persona below.");
      const { error } = await (
        await supaAuth()
      ).auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/auth/callback`,
        },
      });
      if (error) fail(400, error.message);
      return NextResponse.json({
        ok: true,
        message: "Check your email for a sign-in link.",
      });
    }
    if (path === "auth/logout" && method === "POST") {
      (await cookies()).delete("campus_demo");
      if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        await (await supaAuth()).auth.signOut();
      return NextResponse.json({ ok: true });
    }
    const u = await currentUser();
    if (!u) fail(401, "Please sign in to continue.");
    if (method === "GET") {
      const s = await readState();
      if (path === "auth/session") return NextResponse.json({ user: u });
      if (path === "home") {
        const stall = s.stalls.find((x) => x.userId === u.id);
        const days = stall
          ? Math.floor((Date.now() - Date.parse(stall.lastActivity)) / 86400000)
          : 0;
        return NextResponse.json({
          user: u,
          stall: stall
            ? { ...stall, days, status: days >= 3 ? "stalled" : stall.status }
            : null,
          task: s.tasks.filter((t) => t.userId === u.id).at(-1),
          stamps: s.stamps.filter((x) => x.userId === u.id),
          requests: s.requests.filter((r) => [r.fromId, r.toId].includes(u.id)),
          peers: helperSuggestions(s, u),
        });
      }
      if (path === "profile") return NextResponse.json(u);
      if (path === "stamps")
        return NextResponse.json(s.stamps.filter((x) => x.userId === u.id));
      if (path === "map/pins") {
        const peers = visiblePeers(s, u);
        return NextResponse.json({
          center: { lat: u.lat, lng: u.lng },
          enabled: u.nearby,
          peers,
          pins: s.pins.filter(
            (p) =>
              peers.some((peer) => peer.id === p.userId) ||
              (u.nearby && p.userId === u.id),
          ),
        });
      }
      if (path === "help-requests")
        return NextResponse.json({
          requests: s.requests.filter(
            (r) =>
              [r.fromId, r.toId].includes(u.id) &&
              !u.blocked.includes(r.fromId) &&
              !u.blocked.includes(r.toId),
          ),
          peers: helperSuggestions(s, u),
        });
      if (parts[0] === "help-requests" && parts[1]) {
        const r = requestFor(s, u.id, parts[1]);
        return NextResponse.json({
          ...r,
          participants: s.users
            .filter((p) => [r.fromId, r.toId].includes(p.id))
            .map((p) => ({ id: p.id, name: p.name })),
          messages: s.messages.filter((m) => m.requestId === r.id),
          viewerId: u.id,
        });
      }
      if (path === "coach")
        return NextResponse.json(s.coach.filter((m) => m.userId === u.id));
      if (parts[0] === "tasks" && parts[1])
        return NextResponse.json({
          task: taskFor(s, u.id, parts[1]),
          submissions: s.submissions.filter(
            (x) => x.userId === u.id && x.taskId === parts[1],
          ),
        });
      if (path === "outlines")
        return NextResponse.json(
          s.outlines
            .filter((o) => o.userId === u.id)
            .map((o) => ({
              ...o,
              outcomes: s.outcomes.filter((x) => x.outlineId === o.id),
            })),
        );
      fail(404, "Endpoint not found.");
    }
    if (method !== "POST" && method !== "PATCH")
      fail(405, "Method not allowed.");
    const body = await req.json();
    if (path === "onboarding") {
      return NextResponse.json(
        await mutate((s) => saveLearning(s, u.id, body)),
      );
    }
    if (path === "profile") {
      const data = z
        .object({
          name: z.string().trim().min(2).max(80),
          programme: z.string().trim().min(2).max(100),
          topics: z.array(z.string().trim().min(1).max(50)).max(12),
          nearby: z.boolean(),
          helper: z.boolean(),
          lat: z.number().min(-90).max(90),
          lng: z.number().min(-180).max(180),
        })
        .parse(body);
      return NextResponse.json(
        await mutate((s) => {
          const profile = s.users.find((x) => x.id === u.id)!;
          Object.assign(profile, data, {
            lat: Math.round(data.lat * 1000) / 1000,
            lng: Math.round(data.lng * 1000) / 1000,
          });
          return profile;
        }),
      );
    }
    if (path === "map/pins") {
      const data = z
        .object({
          kind: z.enum(["desk", "buddy"]),
          title: z.string().trim().min(3).max(80),
        })
        .parse(body);
      if (!u.nearby)
        fail(400, "Opt into nearby discovery in your profile first.");
      return NextResponse.json(
        await mutate((s) => {
          const pin = {
            id: id(),
            userId: u.id,
            ...data,
            lat: u.lat,
            lng: u.lng,
          };
          s.pins = s.pins.filter(
            (p) => p.userId !== u.id || p.kind !== data.kind,
          );
          s.pins.push(pin);
          return pin;
        }),
        { status: 201 },
      );
    }
    if (path === "outlines") {
      const data = z
        .object({
          title: z.string().trim().min(3).max(180),
          text: z.string().trim().min(10).max(15000),
        })
        .parse(body);
      return NextResponse.json(
        await mutate((s) => {
          const outline = { id: id(), userId: u.id, ...data, confirmed: false };
          s.outlines.push(outline);
          const outcomes = ai
            .extract(data.text)
            .map((t) => ({ id: id(), outlineId: outline.id, text: t }));
          s.outcomes.push(...outcomes);
          return { ...outline, outcomes };
        }),
        { status: 201 },
      );
    }
    if (parts[0] === "outlines" && parts[2] === "confirm") {
      const { outcomes } = z
        .object({
          outcomes: z.array(z.string().trim().min(5).max(400)).min(1).max(12),
        })
        .parse(body);
      return NextResponse.json(
        await mutate((s) => {
          const o =
            s.outlines.find((o) => o.id === parts[1] && o.userId === u.id) ??
            fail(404, "Outline not found.");
          if (o.confirmed) return s.tasks.find((t) => t.outlineId === o.id)!;
          o.confirmed = true;
          s.outcomes = s.outcomes.filter((x) => x.outlineId !== o.id);
          s.outcomes.push(
            ...outcomes.map((text) => ({ id: id(), outlineId: o.id, text })),
          );
          const task = {
            id: id(),
            userId: u.id,
            outlineId: o.id,
            outcomes: [outcomes[0]],
            minutes: 12,
            ...ai.task([outcomes[0]]),
          };
          s.tasks.push(task);
          return task;
        }),
      );
    }
    if (parts[0] === "tasks" && parts[2] === "submit") {
      const data = z.object({ text, photoUrl: photo }).parse(body);
      return NextResponse.json(
        await mutate((s) => submit(s, u, parts[1], data.text, data.photoUrl)),
      );
    }
    if (path === "help-requests") {
      const data = z
        .object({
          toId: z.string(),
          topic: z.string().trim().min(2).max(100),
          note: text,
        })
        .parse(body);
      const note = await ai.helpNote(data.topic);
      return NextResponse.json(
        await mutate((s) => {
          const me = s.users.find((x) => x.id === u.id)!;
          const peer =
            visiblePeers(s, me).find((p) => p.id === data.toId && p.helper) ??
            fail(400, "This helper is no longer available nearby.");
          const existing = s.requests.find(
            (r) =>
              r.fromId === u.id &&
              r.toId === peer.id &&
              ["pending", "accepted"].includes(r.status),
          );
          if (existing) return existing;
          const r = {
            id: id(),
            fromId: u.id,
            ...data,
            status: "pending" as const,
            completedBy: [],
            createdAt: now(),
          };
          s.requests.push(r);
          s.messages.push({
            id: id(),
            requestId: r.id,
            userId: u.id,
            text: `${data.note}\n\nCoach note: ${note}`,
            createdAt: now(),
          });
          return r;
        }),
        { status: 201 },
      );
    }
    if (parts[0] === "help-requests" && parts[1]) {
      const action = parts[2];
      const data =
        action === "messages"
          ? z.object({ text }).parse(body)
          : z.object({}).parse(body);
      return NextResponse.json(
        await mutate((s) => {
          const r = requestFor(s, u.id, parts[1]);
          if (action === "accept" || action === "decline") {
            if (r.toId !== u.id)
              fail(403, "Only the invited helper can respond.");
            if (r.status !== "pending")
              fail(409, "This request has already been answered.");
            r.status = action === "accept" ? "accepted" : "declined";
          } else if (action === "complete") {
            if (r.status !== "accepted" && r.status !== "completed")
              fail(409, "Accept this request before completing it.");
            completeHelp(s, r, u.id);
          } else if (action === "messages") {
            if (r.status !== "accepted")
              fail(
                409,
                "Chat is available while the accepted session is active.",
              );
            s.messages.push({
              id: id(),
              requestId: r.id,
              userId: u.id,
              text: (data as { text: string }).text,
              createdAt: now(),
            });
          } else fail(404, "Unknown action.");
          return r;
        }),
      );
    }
    if (path === "coach/inbound" || path === "coach/outbound") {
      const data = z.object({ text }).parse(body);
      const result = await mutate((s) => {
        s.coach.push({
          id: id(),
          userId: u.id,
          role: "user",
          text: data.text,
          createdAt: now(),
        });
        let reply = coachReply(
          s,
          s.users.find((x) => x.id === u.id)!,
          data.text,
        );
        if (/^done\b/i.test(data.text)) {
          const task = s.tasks.filter((t) => t.userId === u.id).at(-1);
          if (task) {
            const evidence = data.text.replace(/^done\s*/i, "");
            reply = evidence
              ? submit(s, u, task.id, evidence).feedback
              : "Paste your evidence after DONE. Tell me what you did and what happened. You can also attach a photo URL on the restart page.";
          } else
            reply =
              "First paste an outline and confirm an outcome so we can create your restart.";
        }
        return { reply };
      });
      await coach.send(u.id, result.reply);
      return NextResponse.json(result);
    }
    if (path === "safety") {
      const data = z
        .object({
          targetId: z.string(),
          action: z.enum(["block", "report"]),
          reason: z.string().trim().min(3).max(500),
        })
        .parse(body);
      return NextResponse.json(
        await mutate((s) => {
          if (
            data.targetId === u.id ||
            !s.users.some((x) => x.id === data.targetId)
          )
            fail(400, "Choose another learner.");
          if (data.action === "block") {
            const me = s.users.find((x) => x.id === u.id)!;
            if (!me.blocked.includes(data.targetId))
              me.blocked.push(data.targetId);
          }
          s.reports.push({
            id: id(),
            userId: u.id,
            targetId: data.targetId,
            reason: data.reason,
          });
          return {
            ok: true,
            message:
              data.action === "block"
                ? "Learner blocked."
                : "Report recorded. This MVP has no staffed moderation service.",
          };
        }),
      );
    }
    fail(404, "Endpoint not found.");
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        {
          error: error.issues
            .map((x) => `${x.path.join(".")}: ${x.message}`)
            .join("; "),
        },
        { status: 400 },
      );
    if (error instanceof HttpError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    if (error instanceof SyntaxError)
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 },
      );
    console.error(error);
    return NextResponse.json(
      {
        error:
          "Unable to complete this request. Please retry or check server configuration.",
      },
      { status: 500 },
    );
  }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
