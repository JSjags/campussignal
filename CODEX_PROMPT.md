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
