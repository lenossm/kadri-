-- KADRI production schema. Run in the Supabase SQL editor.
-- Isolated from the localStorage demo.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  avatar_url text,
  job_title text,
  phone text,
  timezone text default 'Asia/Tbilisi',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_url text,
  country text default 'GE',
  timezone text default 'Asia/Tbilisi',
  currency text default 'GEL',
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner','admin','producer','production_manager','editor','finance','viewer')),
  status text not null default 'active' check (status in ('active','suspended','removed')),
  project_access text not null default 'selected' check (project_access in ('all','selected')),
  extra_permissions text[] not null default '{}',
  job_title text,
  invited_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null,
  role text not null,
  project_access text not null default 'selected',
  extra_permissions text[] not null default '{}',
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'pending' check (status in ('pending','accepted','expired','cancelled')),
  invited_by uuid references public.profiles (id),
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create table if not exists public.role_capabilities (
  role text not null,
  capability text not null,
  primary key (role, capability)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  contact text,
  email text,
  phone text,
  last_active date,
  created_at timestamptz not null default now()
);

create table if not exists public.client_portal_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  inquiry_id uuid,
  title text not null,
  type text,
  location text,
  stage text not null default 'Brief',
  status text not null default 'Planning',
  due date,
  start_date date,
  shoot_date date,
  owner_name text,
  progress int not null default 0,
  brief text,
  objective text,
  deliverables text[],
  direction text,
  format text,
  crew text,
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.client_project_access (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  client_user_id uuid not null references public.client_portal_users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  status text not null default 'active' check (status in ('active','revoked','pending')),
  can_view_project boolean not null default true,
  can_view_review boolean not null default true,
  can_comment boolean not null default true,
  can_approve boolean not null default true,
  can_download boolean not null default false,
  can_view_invoice boolean not null default false,
  invited_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (project_id, client_user_id)
);

create table if not exists public.client_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  email text not null,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'pending',
  permissions jsonb not null default '{}',
  invited_by uuid references public.profiles (id),
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create table if not exists public.project_financials (
  project_id uuid primary key references public.projects (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  budget numeric,
  internal_cost numeric,
  margin numeric,
  client_budget numeric
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  project_role text not null default 'Member',
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles (id),
  unique (project_id, user_id)
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid references public.clients (id),
  company text not null,
  person text,
  email text,
  phone text,
  project_name text,
  type text,
  budget text,
  timeline text,
  message text,
  status text not null default 'New',
  source text,
  created_at date default current_date,
  created_by uuid references public.profiles (id)
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  title text not null,
  body text,
  type text,
  tags text[],
  pinned boolean not null default false,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.review_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  version text not null,
  status text not null default 'Awaiting Review',
  due date,
  submitted_at date,
  media_path text,
  poster_path text,
  published_to_client boolean not null default false,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.review_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  review_id uuid not null references public.review_versions (id) on delete cascade,
  author_id uuid references public.profiles (id),
  author_name text,
  time_seconds numeric not null default 0,
  text text not null,
  visibility text not null default 'internal' check (visibility in ('internal','client')),
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  invoice text not null,
  amount numeric not null default 0,
  issued date,
  due date,
  status text not null default 'Draft',
  created_by uuid references public.profiles (id)
);

create table if not exists public.delivery_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  public_title text,
  category text,
  destination text,
  planned date,
  status text not null default 'Scheduled',
  featured boolean not null default false,
  visibility text not null default 'internal' check (visibility in ('internal','client')),
  created_by uuid references public.profiles (id)
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid,
  actor_id uuid references public.profiles (id),
  actor_name text,
  text text not null,
  visibility text not null default 'internal' check (visibility in ('internal','finance','client')),
  at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  actor_name text,
  action text not null,
  meta jsonb not null default '{}',
  at timestamptz not null default now()
);
