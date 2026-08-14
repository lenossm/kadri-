# Auth flow

## Production owner

1. `/signup` — email / password, full name
2. Verify email (Supabase)
3. `/login`
4. `/onboarding` — company name, country, timezone, currency
5. RPC `create_workspace` inserts workspace + `workspace_members` role `owner`
6. `/app/:slug/dashboard`

## Employee

Owner/Admin: Team → Invite member (email + role + all/selected projects).

If they have no account: `/invite/:token` → create account → `accept_invitation`.

If they already have an account: sign in → accept.

Self-join is not offered. Roles cannot be self-assigned.

One person may belong to several productions. Role is per membership. The account menu shows Switch workspace when there is more than one active membership. The live provider clears previous workspace data before loading the next slug.

## Client

Producer: Project → Invite to portal (or Client).

`/invite/:token?kind=client` → `accept_client_invitation` → `/client`.

Clients are redirected away from `/app/*`. They never use the internal sidebar.

## Session

Supabase persists and refreshes the session. `AuthProvider` restores it on load. Expired sessions send the user to `/login`. Suspended memberships see `/suspended` or a workspace access error. Removed members cannot read workspace rows (RLS + status).

## Demo

`/demo` uses local identities. The Settings role switcher exists only there.
