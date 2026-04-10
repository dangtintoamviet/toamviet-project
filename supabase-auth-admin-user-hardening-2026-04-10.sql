-- Hardening bổ sung cho cụm auth + admin + user
-- Chạy file này trong Supabase SQL Editor sau các file nâng cấp trước đó.

alter table if exists public.projects
    add column if not exists admin_status text default 'active',
    add column if not exists status_visibility text default 'active',
    add column if not exists hidden boolean default false,
    add column if not exists hidden_at timestamptz,
    add column if not exists hidden_by uuid;

update public.projects
set
    admin_status = case when coalesce(hidden, false) then 'hidden' else coalesce(nullif(trim(admin_status), ''), 'active') end,
    status_visibility = case when coalesce(hidden, false) then 'hidden' else coalesce(nullif(trim(status_visibility), ''), coalesce(nullif(trim(admin_status), ''), 'active')) end
where
    admin_status is null
    or status_visibility is null
    or trim(coalesce(admin_status, '')) = ''
    or trim(coalesce(status_visibility, '')) = '';

create index if not exists idx_profiles_status on public.profiles(status);
create index if not exists idx_profiles_system_role on public.profiles(system_role);
create index if not exists idx_listings_user_status on public.listings(user_id, status);
create index if not exists idx_listings_project_status on public.listings(project_id, status);
create index if not exists idx_projects_slug on public.projects(slug);
create index if not exists idx_projects_admin_status on public.projects(admin_status);
create index if not exists idx_projects_hidden on public.projects(hidden);

do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'projects'
          and column_name = 'hidden'
    ) then
        update public.projects
        set hidden = (coalesce(admin_status, 'active') = 'hidden'),
            hidden_at = case when coalesce(admin_status, 'active') = 'hidden' and hidden_at is null then now() else hidden_at end
        where hidden is distinct from (coalesce(admin_status, 'active') = 'hidden');
    end if;
end $$;
