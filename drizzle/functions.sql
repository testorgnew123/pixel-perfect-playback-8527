-- Business-logic SQL functions/triggers that Drizzle's declarative schema push
-- doesn't manage. Pure business logic ported as-is from the old Supabase
-- migrations (0000/0004) — no auth.*/RLS references, so nothing to change.
-- Run once against Neon after `drizzle-kit push`.
--
-- IMPORTANT: `booking_code_seq` is NOT declared in drizzle/schema.ts, so
-- `drizzle-kit push` (esp. with --force) can treat it as an orphaned object
-- and silently drop it on a future push. If booking creation ever starts
-- failing with "relation booking_code_seq does not exist", re-run this file.

create sequence if not exists public.booking_code_seq start 100;

create or replace function public.next_booking_code() returns text language sql as $$
  select 'HSS-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.booking_code_seq')::text, 5, '0')
$$;

create or replace function public.reserve_seats(_departure_id uuid, _seats int) returns boolean
language plpgsql as $$
declare ok int;
begin
  update public.departures set booked_seats = booked_seats + _seats
   where id = _departure_id and status in ('available','filling_fast') and start_date > current_date
     and total_seats - booked_seats >= _seats;
  get diagnostics ok = row_count;
  return ok = 1;
end $$;

create or replace function public.release_seats(_departure_id uuid, _seats int) returns void
language sql as $$
  update public.departures set booked_seats = greatest(0, booked_seats - _seats) where id = _departure_id;
$$;

create or replace function public.sync_departure_status() returns trigger language plpgsql as $$
begin
  if new.status in ('closed','completed') then return new; end if;
  if new.total_seats - new.booked_seats <= 0 then new.status := 'sold_out';
  elsif new.total_seats - new.booked_seats <= greatest(5, new.total_seats / 5) then new.status := 'filling_fast';
  else new.status := 'available'; end if;
  return new;
end $$;
drop trigger if exists departures_sync_status on public.departures;
create trigger departures_sync_status before insert or update of booked_seats, total_seats on public.departures for each row execute function public.sync_departure_status();

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists yatras_touch on public.yatras;
create trigger yatras_touch before update on public.yatras for each row execute function public.touch_updated_at();
drop trigger if exists bookings_touch on public.bookings;
create trigger bookings_touch before update on public.bookings for each row execute function public.touch_updated_at();

create or replace function public.prune_yatra_versions() returns trigger language plpgsql as $$
begin
  delete from public.yatra_versions where yatra_id = new.yatra_id and id not in (
    select id from public.yatra_versions where yatra_id = new.yatra_id order by created_at desc limit 10);
  return new;
end $$;
drop trigger if exists yatra_versions_prune on public.yatra_versions;
create trigger yatra_versions_prune after insert on public.yatra_versions for each row execute function public.prune_yatra_versions();
