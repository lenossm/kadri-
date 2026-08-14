# Permissions

Authorization has three layers. A workspace role is never enough on its own.

## 1. Workspace role

Stored on `workspace_members.role`, not on `users`.

| Role | Typical access |
| --- | --- |
| owner | Everything, including destructive workspace actions |
| admin | Operational control. Cannot transfer ownership or delete the workspace |
| producer | Inquiries, projects, pipeline, reviews, clients, delivery. Finance is not automatic |
| production_manager | Execution: stages, schedule, assigned production work |
| editor | Assigned projects only. Reviews and tasks. No ledger, no Team |
| finance | Invoices, payments, client billing context. No review room by default |
| viewer | Read-only on permitted projects |

Client is **not** an internal role. Clients live in `client_portal_users`.

Frontend helper: `can('project.view_financials')` from `src/permissions/engine.js`.

Hiding a button is UX. Postgres RLS is the gate.

## 2. Project access

`workspace_members.project_access`:

- `all` — every project in the workspace (typical owner / admin / head producer / finance)
- `selected` — only rows in `project_members` (typical editor, viewer, freelance producer)

Project role (`Lead Editor`) is display/assignment context. It cannot escalate workspace capabilities.

## 3. Content visibility

Inside an allowed project, fields still split:

| Visibility | Who |
| --- | --- |
| Client-facing | Shared reviews, client comments, final deliverables |
| Internal | Production notes, internal review comments |
| Finance only | Budget, invoices, margin (`project_financials`, `invoices`) |
| Owner/Admin only | Audit log, workspace delete, ownership transfer |

Review comments use `visibility = internal | client`. Clients cannot insert `internal`. Clients cannot `select` internal rows.

## Client permissions

Separate flags on `client_project_access`:

- project.view
- review.view / comment / approve
- deliverable.download
- invoice.view

A client never receives internal capabilities.

## Starting matrix

See the product brief. Defaults live in `ROLE_CAPS` and SQL `role_capabilities`. Additional checkboxes on Team → Member are explicit overrides (`extra_permissions`), not a random feature matrix.
