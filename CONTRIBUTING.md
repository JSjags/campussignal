# Contributing

Use Node.js 22+ and npm. Run `cp .env.example .env`, choose a long random SESSION_SECRET, then:

```sh
npm install
npm run db:push
npm run seed
npm run dev
```

Open http://localhost:3000. Run `npm test`, `npm run typecheck`, and `npm run build` before contributing.

`npm run seed` replaces all data in the configured store. This is a deliberate demo reset, not a migration. Check your Supabase environment before running it. `npm run db:push` initializes the local SQLite schema.

Keep documentation synchronized with behavior. Preserve explicit outcome confirmation, visible pre-submission rubrics, opt-in discovery, approximate coordinates, ownership checks, bilateral completion, and stamp idempotency. Never put service credentials in a NEXT_PUBLIC variable. Do not commit `.env`, SQLite databases, or build artifacts.

Domain types and seed data live in lib/domain.ts. Providers live in lib/providers.ts. Auth is in lib/auth.ts. lib/store.ts selects local Prisma/SQLite or hosted Supabase; all mutation functions must be synchronous and free of external side effects because compare-and-swap can retry. External provider calls happen before mutation. The API dispatcher lives in app/api/[...path]/route.ts. UI screens share components/campus-app.tsx.
