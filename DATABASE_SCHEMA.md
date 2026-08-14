# Database schema

Run `supabase/migrations/001_init.sql`, `002_functions.sql`, `003_rls.sql`, `004_storage.sql` in order.

Every business table includes `workspace_id` except identity tables (`profiles`, `client_portal_users`).

## Identity

- `profiles` — one row per Auth user
- `workspaces` — a production company
- `workspace_members` — role, status, project_access, extra_permissions
- `workspace_invitations` — employee invites (token, expiry)

## Clients (not employees)

- `clients` — production’s client directory
- `client_portal_users` — Auth users who use the portal
- `client_project_access` — per-project portal flags
- `client_invitations`

## Production

- `projects`, `project_members`, `inquiries`, `ideas`
- `review_versions`, `review_comments` (`visibility`)
- `project_financials` — sensitive money, separate from `projects`
- `invoices`, `delivery_items`
- `activity_events`, `notifications`, `audit_logs`

## Integrity

Cross-workspace references are blocked by `workspace_id` on child rows plus RLS (`is_workspace_member`, `can_access_project`, `client_can`).

A project in workspace A cannot read a client from workspace B: client rows are filtered by the same `workspace_id`.

## Storage

Bucket `kadri-private`, path `workspaces/{workspaceId}/projects/{projectId}/...`.
