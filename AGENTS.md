# CampusSignal — build this MVP

Build CampusSignal: a real, usable MVP (not a toy) for working open-university learners (MIVA-first) who stall mid-module.

ONE repo, one Next.js App Router + TypeScript + Tailwind app (UI + API Route Handlers together). Free stack only: deployable on Vercel free, Supabase free (Postgres + Auth magic link + Storage) OR Prisma+SQLite for local-first that still deploys, Leaflet + OpenStreetMap, Zod. AI: AIProvider with (1) FreeRuleProvider DEFAULT — deterministic extract/task/score/help-note with no API key and (2) optional OpenAI via OPENAI_API_KEY. WhatsApp: WhatsAppProvider with (1) InAppCoach DEFAULT (WhatsApp-style chat driving the same events) and (2) TwilioWhatsAppSandbox via TWILIO_* env. Never require paid services to run.

## PRODUCT

- Sign up / magic-link sign in (Supabase Auth). Fallback demo personas if DEMO_LOGIN=1.
- Paste module outline → edit/confirm outcomes (never invent unconfirmed outcomes).
- Stall detection + 12-min restart task with rubric shown before submit → Proof Stamp.
- Map (~1.6km): opted-in peers, desk/buddy pins; approx coords only; distance as "~0.4 mi".
- Phone a Friend: stuck → nearby helpers by topic/programme → request → accept → chat → both complete → UNSTUCK + stamp.
- Coach (in-app WhatsApp UI): stall ping, DONE + paste/photo URL, offer Phone a Friend if stuck.
- Stamps gallery; profile (programme, topics, opt-ins); mobile-first playful inspirational UI (warm green/sky, rounded cards, collectible stamps, custom map markers).
- Privacy: opt-in nearby/help; no exact GPS until accept; report/block stubs.
- No LMS/paywall scraping, no job board.

## DATA

User, ModuleOutline, Outcome, StallState, RestartTask, Submission, ProofStamp, MapPin, HelpRequest, HelpSessionMessage, CoachMessageLog.

## API (Zod-validated)

auth session; outlines/outcomes/confirm→task; home; map pins; help-requests lifecycle + messages; task submit→score→stamp; coach inbound/outbound; Twilio webhook POST /api/whatsapp/twilio.

## SEED

Amaka stalled 6 days on "REST, Auth & Testing a Node endpoint"; Tunde ~0.4mi helper; Chioma ~0.6mi + desk pin; Lagos approx coords; scripted stall ping. `npm run seed`.

## SCREENS

/, /login, /home, /coach, /map, /phone-a-friend, /help/[id], /outline, /task/[id], /stamps, /profile.

## DEMO PATH (zero paid keys)

Login Amaka → stalled home → Coach ping → "stuck" → Phone a Friend → Tunde accept/complete → UNSTUCK + stamp. Alternate: restart submit → stamp.

## DOCUMENTATION (judges score this — first-class)

Update docs as features ship. Never lag the product.

1. README.md — one-liner, problem, tracks→features, constraints table, demo URL/accounts/90s path, screenshots placeholders, mermaid architecture, free-tier setup, scripts, out of scope. Judge-facing tone: never say dummy/fake/mock; say "rule-based AI (no paid keys)" and "Twilio sandbox optional".
2. AGENTS.md — product rules, schema, providers, demo path
3. docs/PRODUCT.md — vision, Amaka, flows
4. docs/JUDGES.md — 1-page pitch, why not a chatbot, risks, 2-week roadmap
5. docs/API.md — endpoints + examples
6. docs/PRIVACY.md — location/PII, opt-in
7. CONTRIBUTING.md — local run + reset seed

## ORDER

Scaffold → db + seed + auth → home/stall/stamps → outline/task → map → Phone a Friend → coach (+ Twilio stub) → polish → docs refresh.

## DONE WHEN

Strangers can sign up (or use demo login) and use map + Phone a Friend + restarts + stamps with no API key. Twilio optional in README. Start now; sensible defaults; don't ask unless blocked.

## Implemented architecture and invariants

- One Next.js 15 App Router application. UI screens share `components/campus-app.tsx`; API routes use `app/api/[...path]/route.ts` with Zod parsing and server-side authorization.
- `lib/domain.ts` defines all requested entities and deterministic Lagos seed fixtures. `lib/store.ts` persists one typed domain aggregate through Prisma/SQLite locally or a private RLS-protected Supabase JSONB row on hosted deployments. Mutation callbacks may retry: keep them synchronous and free of external effects.
- `FreeRuleProvider` remains the default. `OpenAIProvider` optionally enriches help notes only and falls back on provider failure. Outcomes are source-derived and must be explicitly confirmed. Never claim images were analyzed.
- `InAppCoach` is the complete default conversation path. The optional Twilio webhook verifies signatures and acknowledges inbound messages; phone/account linking is deliberately not implemented.
- Demo identity is an expiring signed cookie gated by DEMO_LOGIN=1. Supabase real users begin with both opt-ins off. Never return private collections to other users.
- Approximate coordinates are rounded at write time. Nearby discovery requires reciprocal opt-in, a radius <=1.6 km, and no block in either direction. Do not collect exact GPS.
- Help requests are pending → accepted/declined → completed. Only the invited helper accepts; only the two participants chat/complete. Both complete independently before either stamp is issued. Stamp issuance is idempotent.
- Demo: Amaka → coach stuck → Tunde request → switch to Tunde → accept/chat/complete → switch back to Amaka → complete → UNSTUCK stamp. Restart submission is the alternate path.
- `npm run seed` replaces all configured data. Never use it on a live learner dataset. Use `npm test`, `npm run typecheck`, and `npm run build` for validation; keep all docs current.

## Client data and navigation

- **Persistent shell:** the shell (sidebar, top bar, theme controls, mobile nav) lives in the root layout via `components/app-shell.tsx`. `app/[[...screen]]/page.tsx` renders only the screen (`components/campus-app.tsx`). Never key the shell or `<main>` by path, and never use `window.location` for internal routes.
- **Session:** `components/data/client.tsx` loads the session once, then reloads it only after sign-in or persona switch (`refresh`). Profile and onboarding saves use `setUser`; sign-out uses `signOut`; any API 401 expires it.
- **Cache:** screen data uses `useResource(key)` backed by `lib/resource-store.ts`, one store per signed-in user. A new user id disposes the store, so cached content cannot cross accounts. It works stale-while-revalidate, discards older responses, and dedupes requests.
- **Polling:** use `useResource(key, { poll })`. Polls never overlap, stop on unmount and pause in hidden tabs.
- **Mutations:** use `useAction()` for local busy and error state. Afterwards, apply the server response with `store.set` and `store.invalidate([...])` only the affected keys. There is no global refresh counter.
- **Chat histories:** use `useChatScroll`. It follows new messages only after sending or when already near the bottom; otherwise it shows "New messages". Clear an input only if it still holds the text that was sent.

## UI design

Follow `docs/DESIGN.md` and `.agents/skills/campussignal-design/SKILL.md` for UI changes. The visual system is rounded neubrutalism: semantic tokens in `app/theme.css` (shared primitives) and screen layouts in `app/globals.css`, with no raw colours in components. Preserve all three appearance modes and respect reduced motion. One route-aware Lenis controller (`components/design/smooth-scroll.tsx`) smooths `/`, `/onboarding`, `/home`, `/outline`, `/stamps` and `/profile`; coach, help chat, map, Phone a Friend and task routes stay native. Consult the project Motion skill when changing animations. Brand identity ("The Opening" symbol, custom CampusSignal wordmark, favicons) is documented in `docs/BRAND.md`; render it with `components/brand/logo.tsx`, never as typed text.

## Submission features

New real users are routed to `/onboarding` until setup is saved. `lib/learning.ts` validates preferences, ranks consent-filtered helpers, and provides rule-based coach replies. Nearby profiles use an explicit public-field allowlist: never expose private goals, modules, schedule, or setup status. PDF.js imports text in-browser only, up to 5 MB / 40 pages / 15,000 characters; generated worker is copied by `scripts/pdf-worker.mjs` during build/dev. Always require outcome confirmation. See docs/SUBMISSION.md for the release checklist and honest remaining limits.
