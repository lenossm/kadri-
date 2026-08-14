# Implementation status

KADRI is a production-company operating system with two isolated modes.

## Demo workspace (sales)

- Route prefix: `/demo`
- Source of truth: `localStorage` key `kadri_demo_workspace`
- Identity: demo role switcher in Settings (owner through viewer)
- Client walkthrough: `/portal/:id`
- Never mixed with live customer rows

## Live workspace (production)

- Auth: Supabase Auth (`/login`, `/signup`, `/forgot-password`, `/reset-password`)
- Data: Supabase Postgres + RLS
- Files: private bucket `kadri-private`
- Internal app: `/app/:workspaceSlug/...`
- Client portal: `/client` (not `workspace_members`)

## What is in place

1. Auth foundation — session restore, password reset, email verification redirect
2. Workspace create RPC — first user becomes Owner
3. Team invitations — employees cannot self-join
4. Central permission engine (`src/permissions/engine.js`) kept in sync with `role_capabilities`
5. RLS on business tables; internal review comments require `review.comment_internal`
6. Project assignments (`project_members`) + All / Selected project access
7. Permission-aware navigation, dashboard, project tabs, payments, team
8. Client portal architecture (`client_portal_users`, `client_project_access`)
9. Activity attributed to the acting person
10. Isolated demo role switcher (removed from live app)

## Verified locally (no Supabase required)

```bash
npm run build
npm test
```

- Production build succeeds
- Permission engine unit checks pass
- Playwright: 11/11 (smoke + role isolation + portal internal-comment exclusion)

## Remaining live wiring (needs a configured Supabase project)

- Copy `.env.example` → `.env`, run SQL migrations in order (`PRODUCTION_SETUP.md`)
- SMTP for invitation emails (Team currently copies an invite link)
- Signed storage downloads in the Review Room for real cuts
- Seeded live E2E users (`owner@test`, `editor-a@test`, …) against RLS — run after env is present
