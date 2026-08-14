# Production setup

## 1. Supabase project

Create a project. Copy URL and anon key into `.env`:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never commit the real `.env`.

## 2. SQL

In the SQL editor, run in order:

1. `supabase/migrations/001_init.sql`
2. `supabase/migrations/002_functions.sql`
3. `supabase/migrations/003_rls.sql`
4. `supabase/migrations/004_storage.sql`

Enable email confirmations. Set the Site URL to the KADRI origin. Add redirect URLs for `/login` and `/reset-password`.

## 3. Auth emails

Configure SMTP if you want invitation mail. Until then, Team copies an invite link.

## 4. Frontend

```bash
npm install
npm run build
npm run preview
```

Vercel already rewrites SPA routes to `index.html`.

## 5. Isolation check (required)

With two workspaces, confirm:

- A member of A cannot `select` B’s projects by UUID
- An editor cannot `select` `project_financials` / `invoices`
- A client cannot `select` `review_comments` where `visibility = 'internal'`
- A suspended member’s session cannot read workspace rows

Frontend hiding is not this test.
