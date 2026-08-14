-- Capabilities, RPCs, RLS

truncate public.role_capabilities;
insert into public.role_capabilities (role, capability) values
  ('owner','*'),
  ('admin','dashboard.view'),
  ('admin','inquiry.view'),('admin','inquiry.manage'),
  ('admin','project.view'),('admin','project.create'),('admin','project.edit'),
  ('admin','project.assign_members'),('admin','project.change_stage'),
  ('admin','review.view'),('admin','review.upload'),('admin','review.publish'),
  ('admin','review.comment_internal'),('admin','review.approve'),
  ('admin','client.view'),('admin','client.manage'),('admin','client.invite'),
  ('admin','idea.view'),('admin','idea.manage'),
  ('admin','delivery.view'),('admin','delivery.manage'),
  ('admin','team.view'),('admin','team.manage'),
  ('admin','workspace.settings.manage'),('admin','audit.view'),
  ('admin','note.internal.view'),
  ('producer','dashboard.view'),
  ('producer','inquiry.view'),('producer','inquiry.manage'),
  ('producer','project.view'),('producer','project.create'),('producer','project.edit'),
  ('producer','project.assign_members'),('producer','project.change_stage'),
  ('producer','review.view'),('producer','review.upload'),('producer','review.publish'),
  ('producer','review.comment_internal'),('producer','review.approve'),
  ('producer','client.view'),('producer','client.manage'),('producer','client.invite'),
  ('producer','idea.view'),('producer','idea.manage'),
  ('producer','delivery.view'),('producer','delivery.manage'),
  ('producer','team.view'),('producer','note.internal.view'),
  ('production_manager','dashboard.view'),
  ('production_manager','project.view'),('production_manager','project.edit'),
  ('production_manager','project.change_stage'),
  ('production_manager','review.view'),('production_manager','review.comment_internal'),
  ('production_manager','idea.view'),('production_manager','delivery.view'),
  ('production_manager','note.internal.view'),
  ('editor','dashboard.view'),
  ('editor','project.view'),
  ('editor','review.view'),('editor','review.upload'),('editor','review.comment_internal'),
  ('editor','idea.view'),('editor','delivery.view'),
  ('editor','note.internal.view'),
  ('finance','dashboard.view'),
  ('finance','client.view'),
  ('finance','finance.view'),('finance','finance.edit'),
  ('finance','finance.view_internal_cost'),('finance','finance.view_margin'),
  ('finance','payment.view'),('finance','payment.manage'),
  ('finance','project.view_financials'),
  ('viewer','dashboard.view'),
  ('viewer','project.view'),
  ('viewer','review.view');

create or replace function public.is_workspace_member(wid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = wid and m.user_id = auth.uid() and m.status = 'active'
  );
$$;

create or replace function public.has_capability(wid uuid, cap text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = wid and m.user_id = auth.uid() and m.status = 'active'
      and (
        cap = any (m.extra_permissions)
        or exists (
          select 1 from public.role_capabilities rc
          where rc.role = m.role and (rc.capability = cap or rc.capability = '*')
        )
      )
  );
$$;

create or replace function public.can_access_project(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.projects p
    join public.workspace_members m on m.workspace_id = p.workspace_id and m.user_id = auth.uid() and m.status = 'active'
    where p.id = pid
      and (
        m.project_access = 'all'
        or exists (select 1 from public.project_members pm where pm.project_id = p.id and pm.user_id = auth.uid())
      )
  );
$$;

create or replace function public.is_client_on_project(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.client_project_access a
    join public.client_portal_users u on u.id = a.client_user_id
    where a.project_id = pid and u.user_id = auth.uid() and a.status = 'active'
  );
$$;

create or replace function public.client_can(pid uuid, perm text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.client_project_access a
    join public.client_portal_users u on u.id = a.client_user_id
    where a.project_id = pid and u.user_id = auth.uid() and a.status = 'active'
      and (
        (perm = 'project.view' and a.can_view_project)
        or (perm = 'review.view' and a.can_view_review)
        or (perm = 'review.comment' and a.can_comment)
        or (perm = 'review.approve' and a.can_approve)
        or (perm = 'deliverable.download' and a.can_download)
        or (perm = 'invoice.view' and a.can_view_invoice)
      )
  );
$$;

create or replace function public.create_workspace(p_name text, p_country text default 'GE', p_timezone text default 'Asia/Tbilisi', p_currency text default 'GEL')
returns public.workspaces language plpgsql security definer set search_path = public as $$
declare ws public.workspaces; s text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  s := trim(both '-' from regexp_replace(lower(coalesce(p_name,'workspace')), '[^a-z0-9]+', '-', 'g'));
  if s in ('app','demo','login','signup','portal','client','dashboard','projects','team','settings','admin') then
    s := s || '-studio';
  end if;
  if exists (select 1 from public.workspaces where slug = s) then
    s := s || '-' || substr(gen_random_uuid()::text, 1, 4);
  end if;
  insert into public.workspaces (name, slug, country, timezone, currency, created_by)
  values (p_name, s, p_country, p_timezone, p_currency, auth.uid()) returning * into ws;
  insert into public.workspace_members (workspace_id, user_id, role, status, project_access)
  values (ws.id, auth.uid(), 'owner', 'active', 'all');
  insert into public.audit_logs (workspace_id, actor_id, action) values (ws.id, auth.uid(), 'workspace.created');
  return ws;
end;
$$;

create or replace function public.accept_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare inv public.workspace_invitations; access text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into inv from public.workspace_invitations where token = p_token and status = 'pending' and expires_at > now();
  if inv.id is null then raise exception 'Invitation invalid or expired'; end if;
  access := case when inv.role in ('owner','admin','producer','finance') then 'all' else coalesce(inv.project_access, 'selected') end;
  insert into public.workspace_members (workspace_id, user_id, role, status, project_access, extra_permissions, invited_by)
  values (inv.workspace_id, auth.uid(), inv.role, 'active', access, inv.extra_permissions, inv.invited_by)
  on conflict (workspace_id, user_id) do update set role = excluded.role, status = 'active', project_access = excluded.project_access;
  update public.workspace_invitations set status = 'accepted' where id = inv.id;
  insert into public.audit_logs (workspace_id, actor_id, action, meta)
  values (inv.workspace_id, auth.uid(), 'member.joined', jsonb_build_object('role', inv.role));
  return inv.workspace_id;
end;
$$;

create or replace function public.accept_client_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare inv public.client_invitations; cu uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into inv from public.client_invitations where token = p_token and status = 'pending' and expires_at > now();
  if inv.id is null then raise exception 'Invitation invalid or expired'; end if;
  insert into public.client_portal_users (user_id, display_name)
  values (auth.uid(), coalesce((select full_name from public.profiles where id = auth.uid()), ''))
  on conflict (user_id) do update set display_name = excluded.display_name
  returning id into cu;
  if cu is null then select id into cu from public.client_portal_users where user_id = auth.uid(); end if;
  insert into public.client_project_access (
    workspace_id, project_id, client_user_id, status,
    can_view_project, can_view_review, can_comment, can_approve, can_download, can_view_invoice, invited_by
  ) values (
    inv.workspace_id, inv.project_id, cu, 'active',
    coalesce((inv.permissions->>'project')::boolean, true),
    coalesce((inv.permissions->>'review')::boolean, true),
    coalesce((inv.permissions->>'comment')::boolean, true),
    coalesce((inv.permissions->>'approve')::boolean, true),
    coalesce((inv.permissions->>'download')::boolean, false),
    coalesce((inv.permissions->>'invoice')::boolean, false),
    inv.invited_by
  ) on conflict (project_id, client_user_id) do update set status = 'active';
  update public.client_invitations set status = 'accepted' where id = inv.id;
  return inv.project_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
