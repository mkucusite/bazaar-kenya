-- Reliable public view counters for ads and blog posts
create or replace function public.increment_ad_views(target_ad_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ads
  set views_count = coalesce(views_count, 0) + 1
  where id = target_ad_id
    and status = 'active';
end;
$$;

create or replace function public.increment_blog_post_views(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.blog_posts
  set views_count = coalesce(views_count, 0) + 1
  where id = target_post_id
    and is_published = true;
end;
$$;

revoke all on function public.increment_ad_views(uuid) from public;
revoke all on function public.increment_blog_post_views(uuid) from public;

grant execute on function public.increment_ad_views(uuid) to anon, authenticated;
grant execute on function public.increment_blog_post_views(uuid) to anon, authenticated;