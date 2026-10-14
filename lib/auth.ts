import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { mutate, readState } from "./store";
import { now } from "./domain";
function secret() {
  const value = process.env.SESSION_SECRET;
  if (
    !value ||
    value.length < 32 ||
    (process.env.VERCEL && value.startsWith("local-development"))
  )
    throw new Error("Configure a secure SESSION_SECRET (32+ characters).");
  return value;
}
function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}
export async function demoSession(userId: string) {
  const c = await cookies();
  const payload = Buffer.from(
    JSON.stringify({ userId, expires: Date.now() + 86400000 }),
  ).toString("base64url");
  c.set("campus_demo", `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });
}
export async function supaAuth() {
  const c = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => c.getAll(),
        setAll: (items) => {
          for (const item of items) c.set(item.name, item.value, item.options);
        },
      },
    },
  );
}
export async function currentUser() {
  const raw = (await cookies()).get("campus_demo")?.value;
  if (raw && process.env.DEMO_LOGIN === "1") {
    try {
      const [payload, sig] = raw.split(".");
      const expected = sign(payload);
      if (
        sig.length === expected.length &&
        timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
      ) {
        const parsed = JSON.parse(Buffer.from(payload, "base64url").toString());
        if (parsed.expires > Date.now())
          return (
            (await readState()).users.find(
              (u) => u.id === parsed.userId && u.demo,
            ) ?? null
          );
      }
    } catch {
      /* Invalid or expired cookie. */
    }
  }
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const client = await supaAuth();
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    if (user && !error) {
      let profile = (await readState()).users.find((u) => u.id === user.id);
      if (!profile)
        profile = await mutate((s) => {
          const existing = s.users.find((u) => u.id === user.id);
          if (existing) return existing;
          const u = {
            id: user.id,
            name: "New learner",
            programme: "",
            topics: [],
            nearby: false,
            helper: false,
            lat: 6.51,
            lng: 3.37,
            blocked: [],
          };
          s.users.push(u);
          s.stalls.push({
            userId: u.id,
            lastActivity: now(),
            status: "active",
          });
          return u;
        });
      return profile;
    }
  }
  return null;
}
