# CampusSignal — the next small win

**For working open-university learners, the hard part is often restarting.** CampusSignal turns a six-day stall into a 12-minute action, connects learners to nearby help, and makes progress visible through Proof Stamps. MIVA is our starting community.

## A 90-second story

Open the app, choose Amaka, see her six-day stall, and open My coach. Send “stuck”. Phone a Friend shows Tunde around 0.4 miles away. Send a request. Switch to Tunde, open Phone a Friend, accept, chat, and mark complete. Switch back to Amaka and complete. Both receive an UNSTUCK stamp. For a shorter path, submit written evidence against Amaka’s restart rubric and earn The comeback.

## Why this is more than a chatbot

The core is a consent-based workflow: source outline → learner-confirmed outcome → bounded task → visible rubric → submitted proof → persistent stamp. Peer help has an accountable request/accept/chat/both-complete lifecycle. Chat is one entry point into those same actions. No paid AI key is necessary.

| Track            | Working feature                                                         |
| ---------------- | ----------------------------------------------------------------------- |
| Learner success  | Stall signal, 12-minute restart, explicit rubric                        |
| Human connection | Approximate nearby map, topic/programme filter, bilateral completion    |
| Accessible AI    | Deterministic extraction/scoring by default; optional OpenAI help notes |
| Trust            | Discovery/help opt-ins, ownership checks, blocks, approximate location  |

## Built with Codex: inspect the evidence

The [Codex build record](BUILD_WITH_CODEX.md) links the original product brief, repository agent instructions, implementation and tests. It records the documentation/cleanup work and validation observed in this Codex conversation: 22 passing unit tests, TypeScript, formatting, production build and a local API journey against an isolated database. Earlier code authorship is not inferred from filenames or commit subjects. A direct conversation link or development recording remains to be attached for judges who need interaction evidence.

## Honest risks

Rule-based scoring measures engagement, not correctness. The app needs enough opted-in learners in one neighbourhood to be useful. Public demo accounts share state. The aggregate persistence model is suitable for this small MVP, not an unbounded campus. Reports need an operator workflow before broad launch. OpenStreetMap needs network access; the nearby list still provides useful information. Twilio sandbox is optional and the inbound webhook is an authenticated acknowledgement stub, not a linked production WhatsApp account.

## Two-week roadmap

Week 1: pilot with 10–20 MIVA learners; measure first restart completion, helper response time, and opt-in comfort; improve rubrics with learner feedback; add account export/deletion and an operator report queue.

Week 2: split the aggregate into indexed relational tables, add request expiry and notification preferences, introduce authenticated Storage uploads, and test linked Twilio sandbox conversations with explicit consent. No LMS scraping or job board.
