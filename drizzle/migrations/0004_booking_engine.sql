alter table public.booking_travellers add column if not exists id_number_cipher text;
comment on column public.booking_travellers.id_number_enc is 'DEPRECATED: replaced by id_number_cipher';
alter table public.bookings add column if not exists created_by uuid;
alter table public.bookings add column if not exists cancelled_at timestamptz;
alter table public.bookings add column if not exists refund_amount numeric not null default 0;

-- atomic seat reservation (server only)
create or replace function public.reserve_seats(_departure_id uuid, _seats int) returns boolean
language plpgsql security definer set search_path = public as $$
declare ok int;
begin
  update public.departures set booked_seats = booked_seats + _seats
   where id = _departure_id and status in ('available','filling_fast') and start_date > current_date
     and total_seats - booked_seats >= _seats;
  get diagnostics ok = row_count;
  return ok = 1;
end $$;
create or replace function public.release_seats(_departure_id uuid, _seats int) returns void
language sql security definer set search_path = public as $$
  update public.departures set booked_seats = greatest(0, booked_seats - _seats) where id = _departure_id;
$$;
revoke execute on function public.reserve_seats(uuid,int) from public, anon, authenticated;
revoke execute on function public.release_seats(uuid,int) from public, anon, authenticated;
grant execute on function public.reserve_seats(uuid,int) to service_role;
grant execute on function public.release_seats(uuid,int) to service_role;

-- keep departure status in sync with seats
create or replace function public.sync_departure_status() returns trigger language plpgsql as $$
begin
  if new.status in ('closed','completed') then return new; end if;
  if new.total_seats - new.booked_seats <= 0 then new.status := 'sold_out';
  elsif new.total_seats - new.booked_seats <= greatest(5, new.total_seats / 5) then new.status := 'filling_fast';
  else new.status := 'available'; end if;
  return new;
end $$;
create trigger departures_sync_status before insert or update of booked_seats, total_seats on public.departures for each row execute function public.sync_departure_status();

-- traveller details (ID, medical) only for owner and admins; staff use the masked manifest
drop policy "own travellers" on public.booking_travellers;
drop policy "staff travellers" on public.booking_travellers;
create policy "own or admin travellers" on public.booking_travellers for select to authenticated using (exists(select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid()) or public.is_admin(auth.uid()));
create policy "admin travellers write" on public.booking_travellers for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
revoke select (id_number_cipher, id_number_enc) on public.booking_travellers from authenticated;