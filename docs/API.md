# API reference

All routes are in the Next.js App Router under `/api`. JSON mutations are Zod-validated; errors are `{ "error": "description" }` with 400/401/403/404/409/500 status as appropriate. Requests require a signed demo cookie or Supabase session unless listed as public. The server validates ownership, request participants, blocks, opt-ins, and distance. UI mutation requests send same-origin JSON.

| Method    | Path                        | Body / response                                                                              |
| --------- | --------------------------- | -------------------------------------------------------------------------------------------- |
| GET       | /auth/config                | Public: `{demo, magic}` capabilities                                                         |
| POST      | /auth/demo                  | Public, gated by DEMO_LOGIN: `{persona:"amaka"\|"tunde"\|"chioma"}`                          |
| POST      | /auth/magic-link            | Public: `{email}`; sends Supabase magic link                                                 |
| POST      | /auth/logout                | Clears session                                                                               |
| GET       | /auth/session               | `{user}` or 401                                                                              |
| GET       | /home                       | User, computed stall, current task, stamps, own requests, visible peers                      |
| GET/PATCH | /profile                    | Read/update name, programme, topics, nearby, helper, lat, lng                                |
| POST      | /onboarding                 | Validated learning preferences, approximate area and opt-ins; saves setup completion         |
| GET/POST  | /outlines                   | Own outlines / create from `{title,text}`; returns extracted source lines                    |
| POST      | /outlines/:id/confirm       | `{outcomes:["Build a REST endpoint"]}`; creates task, idempotent once confirmed              |
| GET       | /tasks/:id                  | Own task, rubric, own submissions                                                            |
| POST      | /tasks/:id/submit           | `{text,photoUrl?}`; score 0–3 and feedback; 3 awards one stamp per task                      |
| GET       | /stamps                     | Own ProofStamp collection                                                                    |
| GET       | /map/pins                   | `{center,enabled,peers,pins}`; approx coordinates and mile labels                            |
| POST      | /map/pins                   | `{kind:"desk"\|"buddy",title}` at profile area; one pin per type per user                    |
| GET       | /help-requests              | Own requests and discoverable nearby helpers                                                 |
| POST      | /help-requests              | `{toId,topic,note}`; reuses any active request to that helper                                |
| GET       | /help-requests/:id          | Participants, viewer ID, messages, status                                                    |
| POST      | /help-requests/:id/accept   | `{}`; invited helper only, pending → accepted                                                |
| POST      | /help-requests/:id/decline  | `{}`; invited helper only, pending → declined                                                |
| POST      | /help-requests/:id/messages | `{text}`; participants only, accepted sessions only                                          |
| POST      | /help-requests/:id/complete | `{}`; adds authenticated participant; both needed for stamps                                 |
| GET       | /coach                      | Own persisted coach log                                                                      |
| POST      | /coach/inbound              | `{text}`; “stuck” or “DONE evidence” handled as shared events                                |
| POST      | /coach/outbound             | Same authenticated conversation adapter; cannot impersonate system messages                  |
| POST      | /safety                     | `{targetId,action:"report"\|"block",reason}`; records report and optionally blocks           |
| POST      | /whatsapp/twilio            | Public form webhook, authenticated with Twilio HMAC signature; optional acknowledgement stub |

`GET /auth/callback?code=...` exchanges a Supabase PKCE code and redirects to `/home`.

## Restart example

```sh
curl -c /tmp/campus-cookie -H 'Content-Type: application/json' \
  -d '{"persona":"amaka"}' http://localhost:3000/api/auth/demo
curl -b /tmp/campus-cookie http://localhost:3000/api/tasks/restart-node
curl -b /tmp/campus-cookie -H 'Content-Type: application/json' \
  -d '{"text":"I built a REST endpoint and the test returned a 200 response with the expected JSON."}' \
  http://localhost:3000/api/tasks/restart-node/submit
```

Success returns the saved submission with `score: 3` and feedback. `/api/stamps` now contains one restart stamp. Repeat submissions do not create duplicate stamps.

## Help example

Amaka posts `{ "toId":"tunde", "topic":"REST APIs", "note":"My endpoint returns 401. I expected 200 after passing a token." }` to `/api/help-requests`. Use the returned ID. Sign in separately as Tunde, accept, send a message, and complete. Amaka completes using her own session. The final request is `completed` and both participants receive exactly one stamp.

## Persistence and limitations

Local Prisma stores a versioned JSON domain aggregate in SQLite. Hosted Supabase uses the equivalent private JSONB row. Updates use compare-and-swap retries to prevent lost writes. This keeps local and free hosted behavior aligned; large deployments should normalize/index individual collections. Chat polls every five seconds. There is no background notification scheduler, distributed rate limiter, or automated moderation worker yet. Do not expose shared demo accounts as private learner accounts.

### Magic-link callback troubleshooting

`GET /auth/callback` exchanges a Supabase PKCE code and preserves `sb_flow_id` when provided by the SDK. Redirects use `NEXT_PUBLIC_APP_URL` so local `127.0.0.1` cookies remain on the same host. Callback failures distinguish missing browser verification state, expired/used links, missing codes, and connectivity failures. Server diagnostics record only the error code/name, never the link or tokens. Request and open the newest link in the same browser/device; do not switch between localhost and 127.0.0.1.

### Account setup

`POST /api/onboarding` saves the authenticated learner’s setup and marks completion. Fields: name, university, programme, level, modules[], topics[], strengths[], goal, studyTime (mornings/afternoons/evenings/weekends/flexible), studyFormat (examples/practice/discussion/reading), area, lat, lng, nearby, helper. All are validated. Coordinates are rounded; discovery requires an area and helping requires a self-reported strength. Existing records remain compatible without these optional profile fields. Helper responses include a readable matchReason and deterministic matchScore, while private preferences are omitted. PDF import has no upload endpoint.
