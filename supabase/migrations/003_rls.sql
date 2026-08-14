-- Row Level Security. Hiding UI is not enough; these policies are the real gate.

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.role_capabilities enable row level security;
alter table public.clients enable row level security;
alter table public.client_portal_users enable row level security;
alter table public.client_project_access enable row level security;
alter table public.client_invitations enable row level security;
alter table public.projects enable row level security;
alter table public.project_financials enable row level security;
alter table public.project_members enable row level security;
alter table public.inquiries enable row level security;
alter table public.ideas enable row level security;
alter table public.review_versions enable row level security;
alter table public.review_comments enable row level security;
alter table public.invoices enable row level security;
alter table public.delivery_items enable row level security;
alter table public.activity_events enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles read" on public.profiles for select using (
  id = auth.uid()
  or exists (
    select 1 from public.workspace_members a
    join public.workspace_members b on a.workspace_id = b.workspace_id
    where a.user_id = auth.uid() and b.user_id = profiles.id and a.status = 'active'
  )
);
create policy "profiles update self" on public.profiles for update using (id = auth.uid());

create policy "workspaces member read" on public.workspaces for select using (public.is_workspace_member(id));
create policy "workspaces settings" on public.workspaces for update using (public.has_capability(id, 'workspace.settings.manage'));

create policy "members read" on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy "members manage" on public.workspace_members for all using (public.has_capability(workspace_id, 'team.manage'));

create policy "invites manage" on public.workspace_invitations for all using (public.has_capability(workspace_id, 'team.manage'));
create policy "invites by email" on public.workspace_invitations for select using (
  public.has_capability(workspace_id, 'team.view')
  or lower(email) = lower((select email from public.profiles where id = auth.uid()))
);

create policy "role caps" on public.role_capabilities for select using (auth.uid() is not null);

create policy "clients read" on public.clients for select using (
  public.has_capability(workspace_id, 'client.view') or public.has_capability(workspace_id, 'finance.view')
);
create policy "clients write" on public.clients for all using (public.has_capability(workspace_id, 'client.manage'));

create policy "client users" on public.client_portal_users for select using (user_id = auth.uid());
create policy "client users insert" on public.client_portal_users for insert with check (user_id = auth.uid());

create policy "client access read" on public.client_project_access for select using (
  public.is_workspace_member(workspace_id)
  or exists (select 1 from public.client_portal_users u where u.id = client_user_id and u.user_id = auth.uid())
);
create policy "client access manage" on public.client_project_access for all using (public.has_capability(workspace_id, 'client.invite'));
create policy "client invites" on public.client_invitations for all using (public.has_capability(workspace_id, 'client.invite'));

create policy "projects read" on public.projects for select using (
  public.can_access_project(id) or public.is_client_on_project(id)
);
create policy "projects insert" on public.projects for insert with check (public.has_capability(workspace_id, 'project.create'));
create policy "projects update" on public.projects for update using (
  public.can_access_project(id) and public.has_capability(workspace_id, 'project.edit')
);

create policy "financials read" on public.project_financials for select using (
  public.has_capability(workspace_id, 'finance.view') or public.has_capability(workspace_id, 'project.view_financials')
);
create policy "financials write" on public.project_financials for all using (public.has_capability(workspace_id, 'finance.edit'));

create policy "pm read" on public.project_members for select using (public.can_access_project(project_id) or public.is_workspace_member(workspace_id));
create policy "pm write" on public.project_members for all using (public.has_capability(workspace_id, 'project.assign_members'));

create policy "inquiries read" on public.inquiries for select using (public.has_capability(workspace_id, 'inquiry.view'));
create policy "inquiries write" on public.inquiries for all using (public.has_capability(workspace_id, 'inquiry.manage'));

create policy "ideas read" on public.ideas for select using (
  public.has_capability(workspace_id, 'idea.view') and (project_id is null or public.can_access_project(project_id))
);
create policy "ideas write" on public.ideas for all using (public.has_capability(workspace_id, 'idea.manage'));

create policy "reviews read" on public.review_versions for select using (
  (public.can_access_project(project_id) and public.has_capability(workspace_id, 'review.view'))
  or (published_to_client and public.client_can(project_id, 'review.view'))
);
create policy "reviews write" on public.review_versions for all using (
  public.can_access_project(project_id)
  and (public.has_capability(workspace_id, 'review.upload') or public.has_capability(workspace_id, 'review.publish'))
);

create policy "comments read" on public.review_comments for select using (
  (
    visibility = 'internal'
    and public.has_capability(workspace_id, 'review.comment_internal')
    and public.can_access_project((select project_id from public.review_versions v where v.id = review_id))
  )
  or (
    visibility = 'client'
    and (
      public.can_access_project((select project_id from public.review_versions v where v.id = review_id))
      or public.client_can((select project_id from public.review_versions v where v.id = review_id), 'review.view')
    )
  )
);
create policy "comments insert" on public.review_comments for insert with check (
  author_id = auth.uid()
  and (
    (visibility = 'internal' and public.has_capability(workspace_id, 'review.comment_internal'))
    or (
      visibility = 'client' and (
        public.has_capability(workspace_id, 'review.comment_internal')
        or public.client_can((select project_id from public.review_versions v where v.id = review_id), 'review.comment')
      )
    )
  )
);

create policy "invoices read" on public.invoices for select using (
  public.has_capability(workspace_id, 'payment.view')
  or public.has_capability(workspace_id, 'finance.view')
  or public.client_can(project_id, 'invoice.view')
);
create policy "invoices write" on public.invoices for all using (
  public.has_capability(workspace_id, 'payment.manage') or public.has_capability(workspace_id, 'finance.edit')
);

create policy "delivery read" on public.delivery_items for select using (
  (public.has_capability(workspace_id, 'delivery.view') and (project_id is null or public.can_access_project(project_id)))
  or (visibility = 'client' and public.client_can(project_id, 'deliverable.download'))
);
create policy "delivery write" on public.delivery_items for all using (public.has_capability(workspace_id, 'delivery.manage'));

create policy "activity read" on public.activity_events for select using (
  public.is_workspace_member(workspace_id)
  and (
    visibility = 'internal'
    or (visibility = 'finance' and public.has_capability(workspace_id, 'finance.view'))
    or (visibility = 'client' and public.is_client_on_project(project_id))
  )
);
create policy "activity insert" on public.activity_events for insert with check (public.is_workspace_member(workspace_id));

create policy "notifications self" on public.notifications for select using (user_id = auth.uid());
create policy "notifications update" on public.notifications for update using (user_id = auth.uid());

create policy "audit read" on public.audit_logs for select using (public.has_capability(workspace_id, 'audit.view'));
create policy "audit insert" on public.audit_logs for insert with check (public.is_workspace_member(workspace_id));

grant usage on schema public to anon, authenticated;
grant select on public.role_capabilities to authenticated;
grant execute on function public.create_workspace(text, text, text, text) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.accept_client_invitation(text) to authenticated;
