# Submission handoff

Live demo: [CampusSignal](https://campussignallive.vercel.app). Production demo login and canonical callback origin verified. Real email delivery and sign-in still need a successful inbox test.

## What to show

CampusSignal helps working university learners restart with one confirmed learning outcome, a 12-minute task, nearby peer support, and a collectible proof stamp. The free rule-based coach uses confirmed objectives and learning preferences; no paid API key is required.

### Three-minute walkthrough

1. Choose Amaka. Open Learning preferences to show the four setup steps: studies, rhythm, strengths, and approximate community. For a fresh real account, setup opens automatically. Optional preferences and discovery can remain off.
2. Open Add a module. Paste two objectives or select a text-based PDF (5 MB / 40 pages maximum). Review extracted text, edit the outcomes, and explicitly confirm them.
3. Open Coach and choose Make a plan. The plan uses the confirmed outcome and saved study preference. Practice prompt provides a reflection exercise, not an official exam question.
4. Submit evidence: “I built a REST endpoint and the test returned a 200 response with the expected JSON.” Collect the restart stamp.
5. Open Phone a Friend, request Tunde, switch to Tunde, accept and chat, mark complete, then switch to Amaka and complete. Both receive UNSTUCK.

Do not enter private material into shared demo personas.

## Codex attribution and build evidence

The README introduces the project as built with Codex assistance and links the [Codex build record](BUILD_WITH_CODEX.md). That record connects the original brief, agent instructions, source and tests to the work observed in the development conversation. Before submitting, share the intended source revision and attach a reviewed Codex conversation link or development recording if interaction evidence is required. No public conversation link or recording is attached yet. A claim in a README, an `AGENTS.md` file or passing tests alone does not establish code authorship.

## Deploy today

1. Create an empty private GitHub repository and push this project. Never include `.env`, database files, or `.next`.
2. Import that repository into Vercel as a Next.js project. Use Node 22 and the existing `npm run build` command. The build generates the local PDF worker asset.
3. Add the Supabase project URL, publishable key in `NEXT_PUBLIC_SUPABASE_ANON_KEY`, server secret in `SUPABASE_SERVICE_ROLE_KEY`, a strong `SESSION_SECRET`, `DEMO_LOGIN=1` for the judging demo, and `DATABASE_URL=file:./dev.db` for Prisma generation. Runtime persistence uses Supabase.
4. Set `NEXT_PUBLIC_APP_URL` to the HTTPS deployment origin. If it was not known on first deploy, set it after deployment and redeploy.
5. In Supabase Auth, change Site URL to the deployed HTTPS origin and add its `/auth/callback` URL. Keep local callbacks for development if needed.
6. Test public demo login, module confirmation, restart submission, map discovery, and both sides of a help session. Separately verify email delivery and callback with a real account. Supabase default email delivery is restricted; public email signup needs custom SMTP.
7. Add the verified public URL to README and the submission form. Do not run `npm run seed` against existing learner data.

## Explicit limits

- Email login code is integrated, but user-reported delivery/callback problems still require a successful real-inbox test. Demo access is the reliable judging fallback.
- PDF extraction runs locally, supports selectable text, and imports at most 15,000 characters. No OCR, file storage, image analysis, or automatic academic correctness checking.
- The coach is deterministic, not a general-purpose language model. It provides plans and reflection prompts, not invented explanations or verified answers.
- Location stays approximate. Strengths are self-reported; suggestions are topic/programme matches, not verified expertise.
- Reports are recorded without a staffed moderation workflow. Account export/deletion, notifications outside the app, and larger-scale relational storage remain follow-up work.
- Dependency audit currently reports transitive PostCSS and Prisma tooling advisories. Review and patch these before broad production launch; do not force a framework major upgrade during submission without regression testing.

## Validation

Production build and type checking, domain/privacy/onboarding/matching tests, and the local API smoke journey are the release checks. Browser checks cover onboarding completion, PDF extraction and confirmation, themes, responsive layout, and coach preferences. Hosted two-user verification follows deployment.

Repository validation on 15 October 2026: all 22 unit tests passed, TypeScript checking (including unused locals/parameters) passed, the production build passed, and `npm run format:check` passed. The API smoke journey passed against a production server bound to localhost with a separate temporary SQLite database and external providers disabled. Existing local/hosted learner data was not reset. Local links in the updated README, contributor guide, API reference and demo-kit index were also checked.

These checks do not verify current hosted availability, real-inbox email delivery, or browser rendering. Complete those checks separately before submission. The [README](../README.md) contains setup, environment reference, screen-by-screen usage, troubleshooting and the repeatable demo; the [demo kit](../demo-kit/README.md) links the presentation materials.
