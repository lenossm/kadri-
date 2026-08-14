-- Private production assets. Run after 001–003.
-- Do not make this bucket public.

insert into storage.buckets (id, name, public)
values ('kadri-private', 'kadri-private', false)
on conflict (id) do update set public = false;

-- Paths: workspaces/{workspaceId}/projects/{projectId}/...
create policy "kadri private read"
on storage.objects for select
using (
  bucket_id = 'kadri-private'
  and public.is_workspace_member((split_part(name, '/', 2))::uuid)
);

create policy "kadri private write"
on storage.objects for insert
with check (
  bucket_id = 'kadri-private'
  and public.is_workspace_member((split_part(name, '/', 2))::uuid)
);
