
create extension if not exists pgcrypto;

create type public.app_role as enum ('customer','staff','admin','super_admin');
create type public.yatra_status as enum ('draft','published','archived');
create type public.departure_status as enum ('available','filling_fast','sold_out','closed','completed');
create type public.booking_status as enum ('pending_payment','partially_paid','confirmed','cancellation_requested','cancelled','refunded','completed');
create type public.list_kind as enum ('inclusion','exclusion','carry','note');
create type public.enquiry_status as enum ('new','contacted','converted','closed');

-- profiles & roles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, phone text, email text,
  must_change_password boolean not null default false,
  is_active boolean not null default true,
  preferred_lang text not null default 'hi',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('staff','admin','super_admin'))
$$;
create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','super_admin'))
$$;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin(auth.uid()));
create policy "own roles read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email, new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'customer') on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- settings
create table public.site_settings (
  id int primary key default 1 check (id = 1),
  brand_name_en text not null default 'Tirth Darshan Yatra',
  brand_name_hi text not null default 'तीर्थ दर्शन यात्रा',
  tagline_en text, tagline_hi text,
  logo_url text, favicon_url text,
  phone text, whatsapp text, email text,
  address_en text, address_hi text,
  social jsonb not null default '{}'::jsonb,
  gst_number text, gst_percent numeric not null default 5,
  default_advance_type text not null default 'fixed',
  default_advance_value numeric not null default 5000,
  cancellation_slabs jsonb not null default '[{"min_days":30,"refund_percent":90},{"min_days":15,"refund_percent":50},{"min_days":0,"refund_percent":0}]'::jsonb,
  razorpay_mode text not null default 'test',
  email_sender_name text not null default 'Tirth Darshan Yatra',
  counters jsonb not null default '{"yatras":500,"places":150,"years":15,"yatris":25000}'::jsonb,
  video_url text,
  about_en text, about_hi text,
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "settings public read" on public.site_settings for select using (true);
create policy "settings admin update" on public.site_settings for update to authenticated using (public.is_admin(auth.uid()));

-- generic content tables
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, name_en text not null, name_hi text,
  description_en text, description_hi text, icon text, image_url text,
  sort_order int not null default 0, is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, name_en text not null, name_hi text, state text,
  description_en text, description_hi text, best_time_en text, best_time_hi text,
  significance_en text, significance_hi text, how_to_reach_en text, how_to_reach_hi text,
  nearby_en text, nearby_hi text, image_url text,
  sort_order int not null default 0, is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, title_en text not null, title_hi text,
  excerpt_en text, excerpt_hi text, content_en text, content_hi text,
  cover_image text, category text, author text,
  published_at timestamptz, is_published boolean not null default false,
  meta_title_en text, meta_title_hi text, meta_desc_en text, meta_desc_hi text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null, city_en text, city_hi text, yatra_en text, yatra_hi text,
  quote_en text, quote_hi text, rating int not null default 5, photo_url text,
  sort_order int not null default 0, is_published boolean not null default true, is_sample boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  url text not null, caption_en text, caption_hi text, yatra_id uuid,
  sort_order int not null default 0, is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  group_en text, group_hi text, question_en text not null, question_hi text, answer_en text, answer_hi text,
  sort_order int not null default 0, is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null, role_en text, role_hi text, bio_en text, bio_hi text, photo_url text,
  sort_order int not null default 0, is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.representatives (
  id uuid primary key default gen_random_uuid(),
  name text not null, region_en text, region_hi text, city text, phone text, whatsapp text, photo_url text,
  sort_order int not null default 0, is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title_en text, title_hi text, subtitle_en text, subtitle_hi text, image_url text, cta_link text,
  sort_order int not null default 0, is_published boolean not null default true,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['categories','destinations','blog_posts','testimonials','gallery_images','faqs','team_members','representatives','banners'] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read published" on public.%I for select using (is_published or public.is_staff(auth.uid()))', t);
    execute format('create policy "staff write" on public.%I for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()))', t);
  end loop;
end $$;

-- yatras
create table public.yatras (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_en text not null default '', title_hi text,
  short_desc_en text, short_desc_hi text, overview_en text, overview_hi text,
  highlights_en text[] not null default '{}', highlights_hi text[] not null default '{}',
  starting_city_en text, starting_city_hi text, states text[] not null default '{}',
  duration_days int not null default 1, duration_nights int not null default 0,
  transport text[] not null default '{}', difficulty text not null default 'easy',
  min_age int, senior_friendly boolean not null default false,
  featured boolean not null default false, offer boolean not null default false, offer_ends_at timestamptz,
  status public.yatra_status not null default 'draft',
  original_price numeric, price numeric,
  rating numeric not null default 4.7, review_count int not null default 0, popularity int not null default 0,
  cover_image text, video_url text, brochure_url text, map_embed_url text,
  gst_percent numeric not null default 5, gst_inclusive boolean not null default false,
  advance_type text not null default 'fixed', advance_value numeric not null default 5000,
  cancellation_slabs jsonb,
  meta_title_en text, meta_title_hi text, meta_desc_en text, meta_desc_hi text, og_image text,
  tags text[] not null default '{}',
  is_sample boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger yatras_touch before update on public.yatras for each row execute function public.touch_updated_at();
grant select on public.yatras to anon, authenticated;
grant insert, update, delete on public.yatras to authenticated;
grant all on public.yatras to service_role;
alter table public.yatras enable row level security;
create policy "yatras public read" on public.yatras for select using (status = 'published' or public.is_staff(auth.uid()));
create policy "yatras staff write" on public.yatras for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create or replace function public.yatra_visible(_yatra_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.yatras where id = _yatra_id and status = 'published') or public.is_staff(auth.uid())
$$;

create table public.yatra_categories (yatra_id uuid references public.yatras(id) on delete cascade, category_id uuid references public.categories(id) on delete cascade, primary key (yatra_id, category_id));
create table public.yatra_destinations (yatra_id uuid references public.yatras(id) on delete cascade, destination_id uuid references public.destinations(id) on delete cascade, primary key (yatra_id, destination_id));
create table public.yatra_images (id uuid primary key default gen_random_uuid(), yatra_id uuid not null references public.yatras(id) on delete cascade, url text not null, alt_en text, alt_hi text, sort_order int not null default 0);
create table public.yatra_itinerary_days (id uuid primary key default gen_random_uuid(), yatra_id uuid not null references public.yatras(id) on delete cascade, day_number int not null, title_en text, title_hi text, description_en text, description_hi text, meals text[] not null default '{}', overnight_en text, overnight_hi text, image_url text);
create table public.yatra_pricing (yatra_id uuid primary key references public.yatras(id) on delete cascade, quad numeric, triple numeric, twin numeric, single numeric, child numeric, infant numeric);
create table public.yatra_addons (id uuid primary key default gen_random_uuid(), yatra_id uuid not null references public.yatras(id) on delete cascade, name_en text not null, name_hi text, price numeric not null default 0, per_person boolean not null default true, sort_order int not null default 0);
create table public.yatra_pickup_cities (id uuid primary key default gen_random_uuid(), yatra_id uuid not null references public.yatras(id) on delete cascade, city_en text not null, city_hi text, extra_charge numeric not null default 0, reporting_time text, reporting_place_en text, reporting_place_hi text, sort_order int not null default 0);
create table public.yatra_list_items (id uuid primary key default gen_random_uuid(), yatra_id uuid not null references public.yatras(id) on delete cascade, kind public.list_kind not null, text_en text not null, text_hi text, sort_order int not null default 0);
create table public.yatra_faqs (id uuid primary key default gen_random_uuid(), yatra_id uuid not null references public.yatras(id) on delete cascade, question_en text not null, question_hi text, answer_en text, answer_hi text, sort_order int not null default 0);
create table public.departures (
  id uuid primary key default gen_random_uuid(),
  yatra_id uuid not null references public.yatras(id) on delete cascade,
  start_date date not null, end_date date not null,
  total_seats int not null default 40, booked_seats int not null default 0,
  price_override numeric, status public.departure_status not null default 'available',
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['yatra_categories','yatra_destinations','yatra_images','yatra_itinerary_days','yatra_pricing','yatra_addons','yatra_pickup_cities','yatra_list_items','yatra_faqs','departures'] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "read if yatra visible" on public.%I for select using (public.yatra_visible(yatra_id))', t);
    execute format('create policy "staff write" on public.%I for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()))', t);
  end loop;
end $$;

create table public.yatra_versions (id uuid primary key default gen_random_uuid(), yatra_id uuid not null references public.yatras(id) on delete cascade, snapshot jsonb not null, created_by uuid, created_at timestamptz not null default now());
grant select, insert, delete on public.yatra_versions to authenticated;
grant all on public.yatra_versions to service_role;
alter table public.yatra_versions enable row level security;
create policy "staff versions" on public.yatra_versions for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- seat holds, bookings, payments
create table public.seat_holds (id uuid primary key default gen_random_uuid(), departure_id uuid not null references public.departures(id) on delete cascade, user_id uuid, seats int not null, expires_at timestamptz not null, booking_id uuid, released boolean not null default false, created_at timestamptz not null default now());
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_code text unique not null,
  user_id uuid, yatra_id uuid references public.yatras(id) on delete set null, departure_id uuid references public.departures(id) on delete set null,
  adults int not null default 1, children int not null default 0, infants int not null default 0,
  sharing text not null default 'twin', pickup_city_id uuid,
  contact jsonb not null default '{}'::jsonb,
  base_amount numeric not null default 0, addons_amount numeric not null default 0, pickup_amount numeric not null default 0,
  discount_amount numeric not null default 0, gst_amount numeric not null default 0, total_amount numeric not null default 0,
  amount_paid numeric not null default 0,
  status public.booking_status not null default 'pending_payment',
  payment_option text, coupon_code text, internal_notes text,
  consent boolean not null default false, lang text not null default 'hi',
  is_sample boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger bookings_touch before update on public.bookings for each row execute function public.touch_updated_at();
create table public.booking_travellers (id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade, traveller_type text not null default 'adult', full_name text not null, age int, gender text, mobile text, id_type text, id_number_enc bytea, id_last4 text, medical_condition text, meal_pref text);
create table public.booking_addons (id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade, addon_id uuid, name_en text, name_hi text, price numeric not null default 0, qty int not null default 1);
create table public.payments (id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade, amount numeric not null, method text, razorpay_order_id text, razorpay_payment_id text unique, status text not null default 'created', recorded_by uuid, notes text, created_at timestamptz not null default now());
create table public.refunds (id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade, payment_id uuid, amount numeric not null, razorpay_refund_id text unique, status text not null default 'pending', reason text, created_by uuid, created_at timestamptz not null default now());
create table public.waitlist (id uuid primary key default gen_random_uuid(), departure_id uuid not null references public.departures(id) on delete cascade, user_id uuid, name text not null, mobile text not null, email text, seats int not null default 1, status text not null default 'waiting', offered_until timestamptz, booking_id uuid, created_at timestamptz not null default now());

grant select, insert, update on public.bookings, public.booking_travellers, public.booking_addons, public.waitlist to authenticated;
grant select on public.payments, public.refunds, public.seat_holds to authenticated;
grant insert, update, delete on public.payments, public.refunds, public.seat_holds to authenticated;
grant delete on public.bookings, public.booking_travellers, public.booking_addons, public.waitlist to authenticated;
grant all on public.bookings, public.booking_travellers, public.booking_addons, public.payments, public.refunds, public.seat_holds, public.waitlist to service_role;
alter table public.bookings enable row level security;
alter table public.booking_travellers enable row level security;
alter table public.booking_addons enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;
alter table public.seat_holds enable row level security;
alter table public.waitlist enable row level security;

create policy "own or staff bookings" on public.bookings for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "staff manage bookings" on public.bookings for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "own travellers" on public.booking_travellers for select to authenticated using (exists(select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid()) or public.is_staff(auth.uid()));
create policy "staff travellers" on public.booking_travellers for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "own booking addons" on public.booking_addons for select to authenticated using (exists(select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid()) or public.is_staff(auth.uid()));
create policy "staff booking addons" on public.booking_addons for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "own payments" on public.payments for select to authenticated using (exists(select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid()) or public.is_staff(auth.uid()));
create policy "staff payments" on public.payments for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "own refunds" on public.refunds for select to authenticated using (exists(select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid()) or public.is_staff(auth.uid()));
create policy "admin refunds" on public.refunds for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "own holds" on public.seat_holds for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "staff holds" on public.seat_holds for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "own waitlist" on public.waitlist for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "join waitlist" on public.waitlist for insert to authenticated with check (user_id = auth.uid());
create policy "staff waitlist" on public.waitlist for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- coupons
create table public.coupons (id uuid primary key default gen_random_uuid(), code text unique not null, description_en text, description_hi text, discount_type text not null default 'percent', value numeric not null, min_amount numeric not null default 0, valid_from date, valid_to date, usage_limit int, per_user_limit int, used_count int not null default 0, applicable_yatra_ids uuid[] not null default '{}', applicable_category_ids uuid[] not null default '{}', active boolean not null default true, created_at timestamptz not null default now());
create table public.coupon_redemptions (id uuid primary key default gen_random_uuid(), coupon_id uuid not null references public.coupons(id) on delete cascade, booking_id uuid references public.bookings(id) on delete cascade, user_id uuid, amount numeric not null default 0, created_at timestamptz not null default now());
grant select, insert, update, delete on public.coupons, public.coupon_redemptions to authenticated;
grant all on public.coupons, public.coupon_redemptions to service_role;
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
create policy "staff coupons" on public.coupons for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "staff redemptions" on public.coupon_redemptions for all to authenticated using (public.is_staff(auth.uid()) or user_id = auth.uid()) with check (public.is_staff(auth.uid()));

-- enquiries
create table public.enquiries (id uuid primary key default gen_random_uuid(), name text not null, mobile text not null, email text, yatra_interest text, preferred_month text, message text, source text not null default 'home', yatra_id uuid, status public.enquiry_status not null default 'new', assigned_to uuid, follow_up_date date, notes text, is_sample boolean not null default false, created_at timestamptz not null default now());
grant insert on public.enquiries to anon;
grant select, insert, update, delete on public.enquiries to authenticated;
grant all on public.enquiries to service_role;
alter table public.enquiries enable row level security;
create policy "anyone can enquire" on public.enquiries for insert to anon, authenticated with check (status = 'new' and assigned_to is null and length(name) between 1 and 120 and length(mobile) between 6 and 20);
create policy "staff enquiries" on public.enquiries for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- reviews
create table public.reviews (id uuid primary key default gen_random_uuid(), yatra_id uuid not null references public.yatras(id) on delete cascade, user_id uuid, name text not null, city text, rating int not null default 5, comment text, status text not null default 'pending', reply text, created_at timestamptz not null default now());
grant select on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "approved reviews public" on public.reviews for select using (status = 'approved' or user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "own review insert" on public.reviews for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "staff reviews" on public.reviews for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- wishlist & saved travellers
create table public.wishlist (user_id uuid not null, yatra_id uuid not null references public.yatras(id) on delete cascade, created_at timestamptz not null default now(), primary key (user_id, yatra_id));
create table public.saved_travellers (id uuid primary key default gen_random_uuid(), user_id uuid not null, full_name text not null, age int, gender text, mobile text, id_type text, id_last4 text, meal_pref text, created_at timestamptz not null default now());
grant select, insert, update, delete on public.wishlist, public.saved_travellers to authenticated;
grant all on public.wishlist, public.saved_travellers to service_role;
alter table public.wishlist enable row level security;
alter table public.saved_travellers enable row level security;
create policy "own wishlist" on public.wishlist for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own saved travellers" on public.saved_travellers for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- logs
create table public.email_logs (id uuid primary key default gen_random_uuid(), to_email text not null, subject text, template text, booking_id uuid, status text not null default 'queued', provider_id text, error text, created_at timestamptz not null default now());
create table public.audit_logs (id uuid primary key default gen_random_uuid(), actor_id uuid, action text not null, entity text, entity_id text, details jsonb, created_at timestamptz not null default now());
grant select on public.email_logs to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant all on public.email_logs, public.audit_logs to service_role;
alter table public.email_logs enable row level security;
alter table public.audit_logs enable row level security;
create policy "admin email logs" on public.email_logs for select to authenticated using (public.is_admin(auth.uid()));
create policy "admin audit read" on public.audit_logs for select to authenticated using (public.is_admin(auth.uid()));
create policy "staff audit insert" on public.audit_logs for insert to authenticated with check (public.is_staff(auth.uid()) and actor_id = auth.uid());

-- booking code
create sequence public.booking_code_seq start 100;
create or replace function public.next_booking_code() returns text language sql security definer set search_path = public as $$
  select 'TDY-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.booking_code_seq')::text, 5, '0')
$$;

-- public seats view helper
create or replace function public.departure_seats_left(_departure_id uuid) returns int
language sql stable security definer set search_path = public as $$
  select greatest(0, d.total_seats - d.booked_seats - coalesce((select sum(h.seats) from public.seat_holds h where h.departure_id = d.id and not h.released and h.expires_at > now()),0))::int
  from public.departures d where d.id = _departure_id
$$;

create index on public.departures (start_date);
create index on public.departures (yatra_id);
create index on public.bookings (user_id);
create index on public.yatras (status);
