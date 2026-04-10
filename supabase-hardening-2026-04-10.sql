-- ToamViet hardening patch - 2026-04-10
-- Áp dụng file này trong Supabase SQL Editor để bật quyền xóa tin/ảnh
-- và siết thêm quyền xóa file theo owner path.

alter table public.listings enable row level security;
alter table public.listing_images enable row level security;

create policy if not exists "listings owner or admin delete"
on public.listings for delete
to authenticated
using (auth.uid() = user_id or public.is_admin_user());

create policy if not exists "listing images owner or admin delete"
on public.listing_images for delete
to authenticated
using (
  exists (
    select 1 from public.listings l
    where l.id = listing_id
      and (l.user_id = auth.uid() or public.is_admin_user())
  )
);

create policy if not exists "listing images owner or admin storage delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'listing-images'
  and (
    (storage.foldername(name))[1] = ('user-' || auth.uid()::text)
    or public.is_admin_user()
  )
);

create policy if not exists "profile avatars owner or admin storage delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (
    (storage.foldername(name))[1] = ('user-' || auth.uid()::text)
    or public.is_admin_user()
  )
);
