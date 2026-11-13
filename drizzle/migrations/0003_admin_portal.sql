create policy "media public read" on storage.objects for select to anon, authenticated using (bucket_id = 'media');
create policy "media staff insert" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_staff(auth.uid()));
create policy "media staff update" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_staff(auth.uid()));
create policy "media staff delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_staff(auth.uid()));

create or replace function public.prune_yatra_versions() returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.yatra_versions where yatra_id = new.yatra_id and id not in (
    select id from public.yatra_versions where yatra_id = new.yatra_id order by created_at desc limit 10);
  return new;
end $$;
create trigger yatra_versions_prune after insert on public.yatra_versions for each row execute function public.prune_yatra_versions();

create or replace function public.run_daily_maintenance() returns void language sql security definer set search_path = public as $$
  update public.departures set status = 'completed' where end_date < current_date and status <> 'completed';
  update public.blog_posts set is_published = true where is_published = false and published_at is not null and published_at <= now();
$$;
revoke execute on function public.run_daily_maintenance() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('site-maintenance', '0 * * * *', 'select public.run_daily_maintenance()');