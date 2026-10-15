"use client";
/* Shared presentational pieces used by the persistent shell and the screens. */
import Link from "next/link";
import { Logo } from "./brand/logo";
import {
  AlertCircle,
  ArrowRight,
  Compass,
  Home,
  MessageCircle,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";
import type { HelpRequest } from "@/lib/domain";

export const nav = [
  { href: "/home", label: "My campus", short: "Home", icon: Home },
  { href: "/coach", label: "Coach", short: "Coach", icon: MessageCircle },
  { href: "/map", label: "Nearby", short: "Nearby", icon: Compass },
  {
    href: "/phone-a-friend",
    label: "Phone a Friend",
    short: "Friends",
    icon: Users,
  },
  { href: "/stamps", label: "Stamps", short: "Stamps", icon: Star },
];
export const firstName = (name: string) => name.split(" ")[0];
export const two = (n: number) => String(n).padStart(2, "0");
export function isActive(path: string, href: string) {
  if (href === "/phone-a-friend")
    return path === href || path.startsWith("/help/");
  if (href === "/home")
    return path === href || path === "/outline" || path.startsWith("/task/");
  return path === href;
}

/* ---------- Small shared presentation pieces ---------- */
export function Brand({ href = "/home" }: { href?: string }) {
  return (
    <Link href={href} className="brand" aria-label="CampusSignal home">
      <Logo variant="full" size={36} decorative />
      <Logo variant="compact" size={36} decorative />
    </Link>
  );
}
export function Avatar({ name, size = "" }: { name: string; size?: string }) {
  const tone = [...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 4 || "";
  return (
    <span
      className={`avatar ${tone ? `tone-${tone}` : ""} ${size}`}
      aria-hidden="true"
    >
      {name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </span>
  );
}
export function Stamp({
  kind = "restart",
  size = "",
  placeholder = false,
}: {
  kind?: string;
  size?: string;
  placeholder?: boolean;
}) {
  const unstuck = kind === "unstuck";
  return (
    <div
      className={`stamp ${unstuck ? "is-unstuck" : ""} ${size} ${placeholder ? "is-placeholder" : ""}`}
      role="img"
      aria-label={
        placeholder
          ? "Empty stamp slot"
          : unstuck
            ? "Unstuck stamp"
            : "Restarted stamp"
      }
    >
      <span className="stamp-ring" aria-hidden="true">
        CAMPUSSIGNAL
      </span>
      {unstuck ? <Users aria-hidden="true" /> : <Zap aria-hidden="true" />}
      <strong aria-hidden="true">{unstuck ? "UNSTUCK" : "RESTARTED"}</strong>
      <span className="stamp-ring" aria-hidden="true">
        ONE SMALL WIN
      </span>
    </div>
  );
}
export function PageHead({
  label,
  title,
  description,
  action,
}: {
  label: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        <span className="label">{label}</span>
        <h1>{title}</h1>
        {description && <p className="lede">{description}</p>}
      </div>
      {action && <div className="page-head-action">{action}</div>}
    </header>
  );
}
export function Loader() {
  return (
    <span className="loader" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}
export function ErrorAlert({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div role="alert" className="alert">
      <AlertCircle size={18} aria-hidden="true" />
      <span>{message}</span>
      {onDismiss && (
        <button
          className="icon-btn"
          aria-label="Dismiss message"
          onClick={onDismiss}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
export function Empty({
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
      <span className="tile is-accent" aria-hidden="true">
        <Sparkles size={20} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {href && (
        <Link className="btn btn-primary" href={href}>
          {label}
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
export function StatusBadge({ status }: { status: HelpRequest["status"] }) {
  const tone =
    status === "pending"
      ? "is-accent"
      : status === "accepted"
        ? "is-cobalt"
        : status === "completed"
          ? "is-mint"
          : "";
  const text =
    status === "pending"
      ? "Waiting"
      : status === "accepted"
        ? "In progress"
        : status === "completed"
          ? "Completed"
          : "Declined";
  return <span className={`badge ${tone}`}>{text}</span>;
}
export function SkipLink() {
  return (
    <a
      className="skip-link"
      href="#main"
      onClick={(e) => {
        e.preventDefault();
        document.getElementById("main")?.focus();
      }}
    >
      Skip to content
    </a>
  );
}
