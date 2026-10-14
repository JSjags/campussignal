-- Private aggregate with optimistic version checks; all access through authenticated API.
create table if not exists public.campus_state (
 id text primary key,
 version integer not null default 0,
 data jsonb not null
);
alter table public.campus_state enable row level security;
revoke all on public.campus_state from anon, authenticated;
grant all on public.campus_state to service_role;
-- No client policies: the service key lives on the server only.
