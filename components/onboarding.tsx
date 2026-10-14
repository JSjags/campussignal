"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@/lib/domain";
const split = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
const steps = [
  "Your studies",
  "Your rhythm",
  "Your strengths",
  "Your community",
];
export default function Onboarding({
  user,
  onSaved,
}: {
  user: User;
  onSaved: (u: User) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (step > 0) heading.current?.focus();
  }, [step]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [values, setValues] = useState({
    name: user.name === "New learner" ? "" : user.name,
    university: user.university || "MIVA University",
    programme: user.programme,
    level: user.level || "",
    modules: (user.modules || []).join(", "),
    topics: user.topics.join(", "),
    strengths: (user.strengths || []).join(", "),
    goal: user.goal || "",
    studyTime: user.studyTime || "flexible",
    studyFormat: user.studyFormat || "practice",
    area: user.area || "",
    lat: user.lat,
    lng: user.lng,
    nearby: user.nearby,
    helper: user.helper,
  });
  const field = (
    key:
      | "name"
      | "university"
      | "programme"
      | "level"
      | "modules"
      | "topics"
      | "strengths"
      | "goal"
      | "area",
    label: string,
    required = false,
    maxLength = 100,
  ) => (
    <label>
      {label}
      <input
        value={values[key]}
        required={required}
        minLength={required ? 2 : undefined}
        maxLength={maxLength}
        onChange={(e) => setValues({ ...values, [key]: e.target.value })}
      />
    </label>
  );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          modules: split(values.modules),
          topics: split(values.topics),
          strengths: split(values.strengths),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      onSaved(data);
      router.push(user.onboardingCompletedAt ? "/profile" : "/outline");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to save. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="setup-layout">
      <aside className="setup-intro">
        <span className="eyebrow">MAKE THIS CAMPUS YOURS</span>
        <h1>
          A little about you.
          <br />
          <em>A better place to start.</em>
        </h1>
        <p>
          Your studies, your rhythm, and what you can share. Use these
          preferences to shape your next step.
        </p>
        <ol className="setup-steps">
          {steps.map((title, i) => (
            <li key={title} aria-current={step === i ? "step" : undefined}>
              <span>0{i + 1}</span>
              {title}
              {i < step && <span>✓</span>}
            </li>
          ))}
        </ol>
        <p className="muted">
          Goals and study preferences stay private. Your name, programme, topics
          and strengths are shared only when you opt into nearby discovery.
        </p>
      </aside>
      <section className="white-card form-card setup-form">
        <span className="eyebrow">STEP {step + 1} / 4</span>
        <h2 ref={heading} tabIndex={-1}>
          {steps[step]}
        </h2>
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        <form onSubmit={submit}>
          {step === 0 && (
            <>
              {field("name", "What should we call you?", true, 80)}
              {field("university", "University or learning institution", true)}
              {field("programme", "What are you studying?", true)}
              {field("level", "Level or year (optional)", false, 40)}
              {field(
                "modules",
                "Current modules (comma-separated, optional)",
                false,
                500,
              )}
            </>
          )}
          {step === 1 && (
            <>
              {field(
                "goal",
                "What would you like to make progress on? (optional)",
                false,
                400,
              )}
              {field(
                "topics",
                "Topics you need help with (comma-separated, optional)",
                false,
                500,
              )}
              <label>
                When do you usually study?
                <select
                  value={values.studyTime}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      studyTime: e.target.value as typeof values.studyTime,
                    })
                  }
                >
                  {[
                    "flexible",
                    "mornings",
                    "afternoons",
                    "evenings",
                    "weekends",
                  ].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                How would you like to get started?
                <select
                  value={values.studyFormat}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      studyFormat: e.target.value as typeof values.studyFormat,
                    })
                  }
                >
                  <option value="practice">Try a small practical task</option>
                  <option value="examples">Start with a worked example</option>
                  <option value="discussion">Talk it through</option>
                  <option value="reading">Read and make notes</option>
                </select>
              </label>
              <p>
                These are preferences, not a fixed learning style. Change them
                anytime.
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <p>
                You don’t need to be an expert to help someone take their next
                step.
              </p>
              {field(
                "strengths",
                "Topics you feel comfortable helping with (comma-separated)",
                false,
                500,
              )}
              <p className="muted">
                Strengths are self-reported. We don’t treat them as verified
                qualifications.
              </p>
              <label className="toggle-row">
                <span>Make me available as a helper</span>
                <input
                  type="checkbox"
                  checked={values.helper}
                  onChange={(e) =>
                    setValues({ ...values, helper: e.target.checked })
                  }
                />
              </label>
              <p>
                Helping also needs nearby discovery enabled in the next step.
                You can leave both off.
              </p>
            </>
          )}
          {step === 3 && (
            <>
              <p>
                Choose a neighbourhood centre, never your home address. No GPS
                is collected.
              </p>
              <label>
                Choose an approximate neighbourhood
                <select
                  value=""
                  onChange={(e) => {
                    const [area, lat, lng] = e.target.value.split("|");
                    if (area)
                      setValues({
                        ...values,
                        area,
                        lat: Number(lat),
                        lng: Number(lng),
                      });
                  }}
                >
                  <option value="">Choose an area…</option>
                  <option value="Yaba, Lagos|6.510|3.370">Yaba, Lagos</option>
                  <option value="Surulere, Lagos|6.500|3.350">
                    Surulere, Lagos
                  </option>
                  <option value="Ikeja, Lagos|6.600|3.350">Ikeja, Lagos</option>
                  <option value="Victoria Island, Lagos|6.430|3.420">
                    Victoria Island, Lagos
                  </option>
                </select>
              </label>
              {values.area && <p role="status">Selected area: {values.area}</p>}
              <details>
                <summary>Use another approximate area</summary>
                {field("area", "Neighbourhood name", false)}
                <div className="two-fields">
                  {(["lat", "lng"] as const).map((k) => (
                    <label key={k}>
                      {k === "lat" ? "Latitude" : "Longitude"}
                      <input
                        type="number"
                        step="0.001"
                        min={k === "lat" ? -90 : -180}
                        max={k === "lat" ? 90 : 180}
                        value={values[k]}
                        onChange={(e) =>
                          setValues({ ...values, [k]: Number(e.target.value) })
                        }
                      />
                    </label>
                  ))}
                </div>
              </details>
              <label className="toggle-row">
                <span>Let opted-in learners nearby discover me</span>
                <input
                  type="checkbox"
                  checked={values.nearby}
                  onChange={(e) =>
                    setValues({ ...values, nearby: e.target.checked })
                  }
                />
              </label>
              <p>
                Only approximate locations within 1.6 km are used. You can
                complete setup with discovery off.
              </p>
              <p>
                Next: bring your module objectives or a PDF. You’ll review every
                outcome before creating a restart.
              </p>
            </>
          )}
          <div className="form-actions">
            {step > 0 && (
              <button
                type="button"
                className="btn secondary"
                disabled={busy}
                onClick={() => {
                  setError("");
                  setStep(step - 1);
                }}
              >
                Back
              </button>
            )}
            <button className="btn primary" disabled={busy}>
              {busy
                ? "Saving…"
                : step === 3
                  ? "Complete account setup"
                  : "Continue"}
            </button>
          </div>
        </form>
        {user.onboardingCompletedAt && (
          <Link href="/profile" className="text-action">
            Cancel changes
          </Link>
        )}
      </section>
    </div>
  );
}
