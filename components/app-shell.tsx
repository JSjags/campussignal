"use client";
/*
 * Persistent application chrome. Rendered from the root layout, so the sidebar,
 * top bar, theme controls and mobile nav stay mounted while only the page
 * content (the route's children) changes. The session is checked once here,
 * not on every navigation.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Settings, ShieldCheck } from "lucide-react";
import { ThemeSwitch } from "./design/theme";
import { SessionProvider, useSession } from "./data/client";
import {
  Avatar,
  Brand,
  firstName,
  isActive,
  Loader,
  nav,
  SkipLink,
  two,
} from "./ui";
import { routeKind } from "@/lib/routes";
import type { User } from "@/lib/domain";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}

const needsSetup = (u: User) => !u.demo && !u.onboardingCompletedAt;

function FullLoading() {
  return (
    <div className="full-loading" role="status">
      <Loader />
      <p>Finding your signal…</p>
    </div>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { status, user } = useSession();
  const kind = routeKind(path);
  const gated = kind === "app" || kind === "setup";
  // Redirects follow session changes; they never re-fetch the session.
  useEffect(() => {
    if (!gated) return;
    if (status === "anon") router.replace("/login");
    else if (user && kind === "app" && needsSetup(user))
      router.replace("/onboarding");
  }, [gated, kind, status, user, router]);

  if (!gated) return <>{children}</>;
  if (!user || (kind === "app" && needsSetup(user))) return <FullLoading />;
  if (kind === "setup")
    return (
      <div className="setup-page">
        <SkipLink />
        <header className="setup-header">
          <Brand />
          <ThemeSwitch />
        </header>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
      </div>
    );
  return (
    <div className="app-shell">
      <SkipLink />
      <aside className="sidebar" aria-label="Main">
        <Brand />
        <nav className="side-nav" aria-label="Primary">
          {nav.map(({ href, label, icon: Icon }, i) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(path, href) ? "page" : undefined}
            >
              <span className="side-nav-num" aria-hidden="true">
                {two(i + 1)}
              </span>
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <p className="sidebar-note">
            <strong>Just the next little thing.</strong> You don’t have to do it
            all today.
          </p>
          <Link
            className="profile-link"
            href="/profile"
            aria-current={path === "/profile" ? "page" : undefined}
          >
            <Avatar name={user.name} size="is-sm" />
            <span>
              <strong>{firstName(user.name)}</strong>
              <small>{user.demo ? "Demo learner" : "Profile & privacy"}</small>
            </span>
            <Settings size={17} aria-hidden="true" />
          </Link>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <div className="topbar-brand">
            <Brand />
          </div>
          <span className="topbar-context">
            <span className="dot" aria-hidden="true" />
            {user.university || "Your open campus"}
          </span>
          <div className="topbar-actions">
            <ThemeSwitch />
            {user.demo && (
              <Link
                href="/login"
                className="btn btn-sm persona-switch"
                aria-label="Switch persona"
              >
                Switch<span className="hide-narrow"> persona</span>
              </Link>
            )}
            <Link
              href="/profile"
              className="topbar-avatar"
              aria-label="Open profile"
            >
              <Avatar name={user.name} size="is-sm" />
            </Link>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <footer className="app-footer">
          <ShieldCheck size={15} aria-hidden="true" />
          Private by choice. Locations always stay approximate.
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Primary">
        {nav.map(({ href, short, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(path, href) ? "page" : undefined}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{short}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
