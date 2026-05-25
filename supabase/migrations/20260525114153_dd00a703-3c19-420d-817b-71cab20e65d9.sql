alter table public.blog_posts
  add column if not exists meta_title text,
  add column if not exists meta_description text;

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do update set public = true;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public can view blog images'
  ) then
    create policy "Public can view blog images"
    on storage.objects
    for select
    using (bucket_id = 'blog-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can upload blog images'
  ) then
    create policy "Admins can upload blog images"
    on storage.objects
    for insert
    with check (bucket_id = 'blog-images' and public.has_role(auth.uid(), 'admin'::public.app_role));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can update blog images'
  ) then
    create policy "Admins can update blog images"
    on storage.objects
    for update
    using (bucket_id = 'blog-images' and public.has_role(auth.uid(), 'admin'::public.app_role))
    with check (bucket_id = 'blog-images' and public.has_role(auth.uid(), 'admin'::public.app_role));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can delete blog images'
  ) then
    create policy "Admins can delete blog images"
    on storage.objects
    for delete
    using (bucket_id = 'blog-images' and public.has_role(auth.uid(), 'admin'::public.app_role));
  end if;
end $$;

create or replace function public.apply_banner_promotion(target_banner_id uuid, paid_amount numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if paid_amount < 500 then
    raise exception 'Minimum banner boost amount is KSh 500';
  end if;

  update public.banner_campaigns
  set promotion_amount = coalesce(promotion_amount, 0) + paid_amount,
      promoted_until = greatest(coalesce(promoted_until, now()), now()) + interval '30 days',
      updated_at = now()
  where id = target_banner_id;
end;
$$;