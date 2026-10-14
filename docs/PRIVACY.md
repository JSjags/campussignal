# Privacy and learner safety

## Data and location

Profiles contain a name, programme, topic list, opt-ins, blocked-user IDs, and approximate coordinates. No browser GPS permission is requested. Coordinates entered in the profile are rounded to three decimal places (roughly 100 m) before storage. Use a neighbourhood centre, not a home address. Exact coordinates are never collected or released, including after acceptance.

Nearby discovery is reciprocal: the viewer and discovered peer must opt in. Helpers additionally opt into helping. Server-side distance filtering limits results to 1.6 km; the UI labels distances as approximate miles. Pins disappear from discovery when their owner opts out. Blocking applies in both directions to discovery and help-session API access.

Outlines, evidence, coach logs, stamps, requests, and chat messages are stored persistently. Only owners can read their tasks, outlines, stamps, submissions, and coach messages. Only the two participants can read a help session. Messages are not end-to-end encrypted. Hosted traffic should use HTTPS.

## Authentication and storage

Demo cookies are signed, HTTP-only, SameSite=Lax, expire after 24 hours, and use Secure in production. Demo access is explicitly gated by DEMO_LOGIN=1. Shared personas are public demonstration accounts: never put sensitive information in them. Set DEMO_LOGIN=0 for a private deployment.

Supabase Auth handles real email identities through PKCE magic links. The hosted campus_state table has RLS enabled and grants no access to browser clients. The service-role key is server-only. Application routes authorize every read and write. Concurrent writes use version-based compare-and-swap. Local SQLite stores the same typed domain aggregate.

Photo URLs are references, not uploads; the app does not fetch or analyze their contents. Do not paste private access tokens or sensitive photos. The optional OpenAI provider receives only a requested help topic, not full chat/profile/location data. With no API key, processing stays within the application. Map tiles come from OpenStreetMap, whose servers receive normal browser network metadata.

## Reports and retention

Blocking immediately restricts discovery and session access. Reports are recorded for operator review but there is no staffed moderation service or emergency response. No automatic deletion schedule or self-service export exists in this MVP. Operators must honor deletion/export requests by removing the relevant profile and associated records from the private aggregate. Local demo reset replaces all local records; never run it against a live dataset.

## Learning preferences and PDFs

University, level, modules, goals, study time and study-format preferences support account setup and contextual guidance. Goals, modules, study preferences and onboarding status are excluded from nearby peer responses. Public peer fields are explicitly allowlisted; strengths are self-reported and visible only within opted-in discovery. PDF parsing occurs in the browser with a locally served worker. Files are not uploaded; only reviewed text submitted by the learner is stored as an outline.
