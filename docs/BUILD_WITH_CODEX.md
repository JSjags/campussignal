# Building CampusSignal with Codex

CampusSignal is developed with Codex assistance. The human supplies the learner problem, product constraints and feedback; Codex works in the repository to inspect implementation, make changes and run checks. This page makes the available evidence inspectable and states where the record is incomplete.

## From product brief to implementation

The [original build brief](../CODEX_PROMPT.md) asks for a usable MIVA-first MVP: confirmed outcomes, 12-minute restarts, approximate peer discovery, bilateral help completion and stamps, with no paid services required. It also defines entities, routes, seed personas, documentation and the intended demonstration.

The current [AGENTS.md](../AGENTS.md) adds implementation invariants: private per-user data, synchronous retryable store mutations, consent-filtered nearby discovery, explicit outcome confirmation and independent help-session completion. Its current location rule is stricter than the original brief: exact GPS is never collected or released, including after acceptance. The brief records the original request; current code, instructions and privacy documentation describe the implemented behavior.

| Inspect                                                                                                              | What it establishes                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [Original brief](../CODEX_PROMPT.md)                                                                                 | The requested product, constraints and acceptance criteria. A prompt alone does not prove execution.                             |
| [Agent instructions](../AGENTS.md)                                                                                   | The repository rules supplied to the coding agent.                                                                               |
| [Design skill](../.agents/skills/campussignal-design/SKILL.md) and [Motion skill](../.agents/skills/motion/SKILL.md) | Project-local guidance available for interface and animation work; their presence does not prove they were used in every change. |
| [Domain](../lib/domain.ts), [learning logic](../lib/learning.ts), [providers](../lib/providers.ts)                   | The inspectable implementation of the learner workflows and free default providers.                                              |
| [API route](../app/api/[...path]/route.ts), [store](../lib/store.ts)                                                 | Validation, authorization and persistence implementation.                                                                        |
| [Domain tests](../lib/domain.test.ts), [learning tests](../lib/learning.test.ts), [API journey](../scripts/smoke.ts) | Executable checks of product behavior. Passing checks establish behavior, not who authored the code.                             |

## Observed work in this Codex conversation

### 15 October 2026 — documentation and cleanup

The user requested:

> continue working on this project and updating the readme.md with everything needed to be known about the project, how to use it, what the demo is about. I want the project cleaned up too

Codex inspected the existing implementation, scripts, environment example, docs and working-tree changes, then:

- Expanded the README with setup, environment variables, screen usage, demo journeys, architecture, maintenance and troubleshooting.
- Updated the contributor guide and API reference, and added a demo-kit index.
- Removed three unused icon imports from `components/campus-app.tsx`.
- Added `npm run format:check` and ignored macOS `.DS_Store` metadata.
- Ran the unit tests, TypeScript checks, formatting checks and production build.
- Created and seeded a separate temporary SQLite database, started a localhost-only production server with external providers disabled, and ran the complete API smoke journey.
- Stopped the test server and recorded the verification in the [release handoff](SUBMISSION.md#validation).

Recorded results: **22 unit tests passed**, TypeScript passed including unused-local/parameter checks, formatting passed, production build passed, and the API smoke journey passed. Existing local and hosted learner stores were not reset. These are results from that run, not a guarantee about future revisions or hosted availability.

The follow-up request asked for a stronger product pitch and visible evidence of Codex use. Codex revised the README opening, added its judge entry point and Codex attribution, and created this evidence index. This is a documentation account of observed work; it is not an independently signed provenance record.

Earlier application and design changes were already present when this cleanup began. This conversation does not establish their individual authorship, a percentage of AI-written code, or that the entire app was generated in a single session.

## What Git history shows

The local history inspected during this pass includes:

- [`6758b3c` — Build CampusSignal submission MVP](https://github.com/JSjags/campussignal/commit/6758b3c4cca29f348617d420290504b2f11a4a20).
- [`40d6fd5` — Document verified production demo URL](https://github.com/JSjags/campussignal/commit/40d6fd50169cb42b7a7f537d95a52c21b038ead7).

These links use the configured Git remote; access depends on repository visibility. The commit subjects do not independently identify Codex usage. Review the commit introducing this build record for the accompanying application, documentation and validation updates. Judge access requires sharing or publishing the intended source revision.

## How a judge can review it

1. Run the [90-second learner journey](../README.md#demo-accounts-and-90-second-path). Confirm that the invited helper accepts and both participants complete independently.
2. Compare the original brief and current agent rules with the source/test pointers above.
3. Follow the local setup and run `npm test`, `npm run typecheck`, `npm run format:check`, and `npm run build`.
4. For integration verification, use a disposable local store and follow the [API smoke instructions](../README.md#validation). That journey changes data; it is not a read-only check.
5. Review a supplied Codex conversation or development recording if direct evidence of the interaction is required.

## Direct interaction evidence still to attach

No public Codex chat link, development recording or session screenshots are included in this repository yet. To strengthen the submission, the owner can provide a reviewed conversation link or a short recording showing the project open in Codex, a real request, the resulting diff, and validation output. A separate short product recording can show Amaka and Tunde completing the help journey.

Review material before sharing: exclude secrets, environment-file contents and private learner information. Link the reviewed evidence from this page and the submission form when it exists. Do not label a reconstructed prompt, retrospective build note or staged screenshot as an original session transcript.

## Development assistance and runtime AI

Codex helps develop the software. The application’s default `FreeRuleProvider` extracts source lines, creates a task from confirmed outcomes and checks written evidence against transparent rules. `InAppCoach` provides the default conversation path. Optional OpenAI help-note enrichment is a separate runtime integration. A judge can run the core product without an OpenAI key.
