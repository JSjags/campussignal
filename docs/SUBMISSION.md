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
