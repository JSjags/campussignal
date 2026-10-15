# Contributing

Use Node.js 22+ and npm. Run `cp .env.example .env`, choose a long random SESSION_SECRET, then:

```sh
npm install
npm run db:push
npm run seed
npm run dev
```

Open [the local app](http://localhost:3000). Keep Supabase and optional provider variables empty for the local demo. Generate a secret with `openssl rand -hex 32`. Use `.env` or exported variables for CLI scripts; they do not load `.env.local` automatically. See the [README environment reference](README.md#environment-reference).

Run `npm test`, `npm run typecheck`, `npm run format:check`, and `npm run build` before contributing. Use `npm run format` to apply formatting. Generated Prisma/PDF assets are handled by installation, build and development scripts.

For API integration checks, seed a disposable local database, start `npm run dev`, then run `npm run test:api` in another terminal. This journey modifies demo records, including blocking Tunde. Ensure the running server has no Supabase configuration; the smoke script’s localhost restriction does not guarantee local storage. Reseed the disposable store afterwards to restore the original demonstration.

`npm run seed` replaces all data in the configured store. This is a deliberate demo reset, not a migration. Check your Supabase environment before running it. `npm run db:push` initializes the local SQLite schema.

Keep documentation synchronized with behavior. Preserve explicit outcome confirmation, visible pre-submission rubrics, opt-in discovery, approximate coordinates, ownership checks, bilateral completion, and stamp idempotency. Never put service credentials in a NEXT_PUBLIC variable. Do not commit `.env`, SQLite databases, or build artifacts.

Domain types and seed data live in lib/domain.ts. Providers live in lib/providers.ts. Auth is in lib/auth.ts. lib/store.ts selects local Prisma/SQLite or hosted Supabase; all mutation functions must be synchronous and free of external side effects because compare-and-swap can retry. External provider calls happen before mutation. The API dispatcher lives in app/api/[...path]/route.ts. UI screens share components/campus-app.tsx.

The root layout owns the persistent shell and session provider. Screen data uses the per-user resource store; invalidate affected keys after mutations instead of reloading the whole app. Preserve native chat/map/task scrolling, all three theme modes and reduced-motion behavior. Follow [the design system](docs/DESIGN.md) for UI work and [the brand guide](docs/BRAND.md) for identity assets.

Keep changes focused and preserve unrelated work in the checkout. Do not commit local environment files, databases, generated workers, OS metadata, or build output. The [demo kit](demo-kit/README.md) is intentional presentation material; keep its walkthrough aligned with the README and release checklist.
