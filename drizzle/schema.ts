import { pgTable, pgEnum, text, timestamp, boolean, uuid, integer, numeric, jsonb, date, unique, primaryKey } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

// better-auth-managed tables (field names match its Drizzle-adapter snake_case
// convention). `user` carries the old `profiles` columns as additional fields —
// see auth.server.ts's `user.additionalFields`.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  phone: text("phone"),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  preferredLang: text("preferred_lang").notNull().default("hi"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// App-owned: staff/admin role grants. A user can hold more than one role
// (e.g. every account also gets "customer"); assertStaff/assertSuper-style
// checks look for membership, same pattern as the old Supabase RLS helpers.
export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // "customer" | "staff" | "admin" | "super_admin"
  },
  (t) => [unique().on(t.userId, t.role)],
);

// ---------------------------------------------------------------------------
// Business schema (ported from the Supabase migrations under drizzle/migrations/).
// RLS policies and auth.users FKs are dropped — authorization now happens in
// server-fn code (assertStaff/assertSuper, same pattern already used for money
// paths). "User-ish" columns (user_id/created_by/actor_id/etc.) are plain text
// to match better-auth's string ids; none had a real FK to auth.users originally.
//
// Column keys here are snake_case (matching the DB name) rather than idiomatic
// camelCase, on purpose: dozens of existing components destructure query
// results as `y.title_en`, `dep.start_date`, etc., and the generic admin CRUD
// (CrudPage.tsx) reads/writes columns by that same name dynamically. Matching
// it avoids reshaping every query result and keeps that generic path working
// unchanged.
// ---------------------------------------------------------------------------

export const yatraStatus = pgEnum("yatra_status", ["draft", "published", "archived"]);
export const departureStatus = pgEnum("departure_status", ["available", "filling_fast", "sold_out", "closed", "completed"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending_payment", "partially_paid", "confirmed", "cancellation_requested", "cancelled", "refunded", "completed"]);
export const listKind = pgEnum("list_kind", ["inclusion", "exclusion", "carry", "note"]);
export const enquiryStatus = pgEnum("enquiry_status", ["new", "contacted", "converted", "closed"]);

export const site_settings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  brand_name_en: text("brand_name_en").notNull().default("Hari Shiv Shankar Tirth Yatra"),
  brand_name_hi: text("brand_name_hi").notNull().default("हरि शिव शंकर तीर्थ यात्रा"),
  tagline_en: text("tagline_en"),
  tagline_hi: text("tagline_hi"),
  logo_url: text("logo_url"),
  favicon_url: text("favicon_url"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  address_en: text("address_en"),
  address_hi: text("address_hi"),
  social: jsonb("social").notNull().default({}),
  gst_number: text("gst_number"),
  gst_percent: numeric("gst_percent").notNull().default("5"),
  default_advance_type: text("default_advance_type").notNull().default("fixed"),
  default_advance_value: numeric("default_advance_value").notNull().default("5000"),
  cancellation_slabs: jsonb("cancellation_slabs").notNull().default([{ min_days: 30, refund_percent: 90 }, { min_days: 15, refund_percent: 50 }, { min_days: 0, refund_percent: 0 }]),
  razorpay_mode: text("razorpay_mode").notNull().default("test"),
  email_sender_name: text("email_sender_name").notNull().default("Hari Shiv Shankar Tirth Yatra"),
  counters: jsonb("counters").notNull().default({ yatras: 500, places: 150, years: 15, yatris: 25000 }),
  video_url: text("video_url"),
  about_en: text("about_en"),
  about_hi: text("about_hi"),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name_en: text("name_en").notNull(),
  name_hi: text("name_hi"),
  description_en: text("description_en"),
  description_hi: text("description_hi"),
  icon: text("icon"),
  image_url: text("image_url"),
  sort_order: integer("sort_order").notNull().default(0),
  is_published: boolean("is_published").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const destinations = pgTable("destinations", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name_en: text("name_en").notNull(),
  name_hi: text("name_hi"),
  state: text("state"),
  description_en: text("description_en"),
  description_hi: text("description_hi"),
  best_time_en: text("best_time_en"),
  best_time_hi: text("best_time_hi"),
  significance_en: text("significance_en"),
  significance_hi: text("significance_hi"),
  how_to_reach_en: text("how_to_reach_en"),
  how_to_reach_hi: text("how_to_reach_hi"),
  nearby_en: text("nearby_en"),
  nearby_hi: text("nearby_hi"),
  image_url: text("image_url"),
  sort_order: integer("sort_order").notNull().default(0),
  is_published: boolean("is_published").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const blog_posts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title_en: text("title_en").notNull(),
  title_hi: text("title_hi"),
  excerpt_en: text("excerpt_en"),
  excerpt_hi: text("excerpt_hi"),
  content_en: text("content_en"),
  content_hi: text("content_hi"),
  cover_image: text("cover_image"),
  category: text("category"),
  author: text("author"),
  published_at: timestamp("published_at", { withTimezone: true }),
  is_published: boolean("is_published").notNull().default(false),
  meta_title_en: text("meta_title_en"),
  meta_title_hi: text("meta_title_hi"),
  meta_desc_en: text("meta_desc_en"),
  meta_desc_hi: text("meta_desc_hi"),
  is_sample: boolean("is_sample").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const testimonials = pgTable("testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  city_en: text("city_en"),
  city_hi: text("city_hi"),
  yatra_en: text("yatra_en"),
  yatra_hi: text("yatra_hi"),
  quote_en: text("quote_en"),
  quote_hi: text("quote_hi"),
  rating: integer("rating").notNull().default(5),
  photo_url: text("photo_url"),
  sort_order: integer("sort_order").notNull().default(0),
  is_published: boolean("is_published").notNull().default(true),
  is_sample: boolean("is_sample").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const gallery_images = pgTable("gallery_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  caption_en: text("caption_en"),
  caption_hi: text("caption_hi"),
  yatra_id: uuid("yatra_id"),
  sort_order: integer("sort_order").notNull().default(0),
  is_published: boolean("is_published").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  group_en: text("group_en"),
  group_hi: text("group_hi"),
  question_en: text("question_en").notNull(),
  question_hi: text("question_hi"),
  answer_en: text("answer_en"),
  answer_hi: text("answer_hi"),
  sort_order: integer("sort_order").notNull().default(0),
  is_published: boolean("is_published").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const team_members = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  role_en: text("role_en"),
  role_hi: text("role_hi"),
  bio_en: text("bio_en"),
  bio_hi: text("bio_hi"),
  photo_url: text("photo_url"),
  sort_order: integer("sort_order").notNull().default(0),
  is_published: boolean("is_published").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const representatives = pgTable("representatives", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  region_en: text("region_en"),
  region_hi: text("region_hi"),
  city: text("city"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  photo_url: text("photo_url"),
  sort_order: integer("sort_order").notNull().default(0),
  is_published: boolean("is_published").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const banners = pgTable("banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  title_en: text("title_en"),
  title_hi: text("title_hi"),
  subtitle_en: text("subtitle_en"),
  subtitle_hi: text("subtitle_hi"),
  image_url: text("image_url"),
  cta_link: text("cta_link"),
  sort_order: integer("sort_order").notNull().default(0),
  is_published: boolean("is_published").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const yatras = pgTable("yatras", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title_en: text("title_en").notNull().default(""),
  title_hi: text("title_hi"),
  short_desc_en: text("short_desc_en"),
  short_desc_hi: text("short_desc_hi"),
  overview_en: text("overview_en"),
  overview_hi: text("overview_hi"),
  highlights_en: text("highlights_en").array().notNull().default(sql`'{}'::text[]`),
  highlights_hi: text("highlights_hi").array().notNull().default(sql`'{}'::text[]`),
  starting_city_en: text("starting_city_en"),
  starting_city_hi: text("starting_city_hi"),
  states: text("states").array().notNull().default(sql`'{}'::text[]`),
  duration_days: integer("duration_days").notNull().default(1),
  duration_nights: integer("duration_nights").notNull().default(0),
  transport: text("transport").array().notNull().default(sql`'{}'::text[]`),
  difficulty: text("difficulty").notNull().default("easy"),
  min_age: integer("min_age"),
  senior_friendly: boolean("senior_friendly").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  offer: boolean("offer").notNull().default(false),
  offer_ends_at: timestamp("offer_ends_at", { withTimezone: true }),
  status: yatraStatus("status").notNull().default("draft"),
  original_price: numeric("original_price"),
  price: numeric("price"),
  rating: numeric("rating").notNull().default("4.7"),
  review_count: integer("review_count").notNull().default(0),
  popularity: integer("popularity").notNull().default(0),
  cover_image: text("cover_image"),
  video_url: text("video_url"),
  brochure_url: text("brochure_url"),
  map_embed_url: text("map_embed_url"),
  gst_percent: numeric("gst_percent").notNull().default("5"),
  gst_inclusive: boolean("gst_inclusive").notNull().default(false),
  advance_type: text("advance_type").notNull().default("fixed"),
  advance_value: numeric("advance_value").notNull().default("5000"),
  cancellation_slabs: jsonb("cancellation_slabs"),
  meta_title_en: text("meta_title_en"),
  meta_title_hi: text("meta_title_hi"),
  meta_desc_en: text("meta_desc_en"),
  meta_desc_hi: text("meta_desc_hi"),
  og_image: text("og_image"),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  is_sample: boolean("is_sample").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const yatra_categories = pgTable("yatra_categories", {
  yatra_id: uuid("yatra_id").notNull().references(() => yatras.id, { onDelete: "cascade" }),
  category_id: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.yatra_id, t.category_id] })]);

export const yatra_destinations = pgTable("yatra_destinations", {
  yatra_id: uuid("yatra_id").notNull().references(() => yatras.id, { onDelete: "cascade" }),
  destination_id: uuid("destination_id").notNull().references(() => destinations.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.yatra_id, t.destination_id] })]);

export const yatra_images = pgTable("yatra_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  yatra_id: uuid("yatra_id").notNull().references(() => yatras.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt_en: text("alt_en"),
  alt_hi: text("alt_hi"),
  sort_order: integer("sort_order").notNull().default(0),
});

export const yatra_itinerary_days = pgTable("yatra_itinerary_days", {
  id: uuid("id").primaryKey().defaultRandom(),
  yatra_id: uuid("yatra_id").notNull().references(() => yatras.id, { onDelete: "cascade" }),
  day_number: integer("day_number").notNull(),
  title_en: text("title_en"),
  title_hi: text("title_hi"),
  description_en: text("description_en"),
  description_hi: text("description_hi"),
  meals: text("meals").array().notNull().default(sql`'{}'::text[]`),
  overnight_en: text("overnight_en"),
  overnight_hi: text("overnight_hi"),
  image_url: text("image_url"),
});

export const yatra_pricing = pgTable("yatra_pricing", {
  yatra_id: uuid("yatra_id").primaryKey().references(() => yatras.id, { onDelete: "cascade" }),
  quad: numeric("quad"),
  triple: numeric("triple"),
  twin: numeric("twin"),
  single: numeric("single"),
  child: numeric("child"),
  infant: numeric("infant"),
});

export const yatra_addons = pgTable("yatra_addons", {
  id: uuid("id").primaryKey().defaultRandom(),
  yatra_id: uuid("yatra_id").notNull().references(() => yatras.id, { onDelete: "cascade" }),
  name_en: text("name_en").notNull(),
  name_hi: text("name_hi"),
  price: numeric("price").notNull().default("0"),
  per_person: boolean("per_person").notNull().default(true),
  sort_order: integer("sort_order").notNull().default(0),
});

export const yatra_pickup_cities = pgTable("yatra_pickup_cities", {
  id: uuid("id").primaryKey().defaultRandom(),
  yatra_id: uuid("yatra_id").notNull().references(() => yatras.id, { onDelete: "cascade" }),
  city_en: text("city_en").notNull(),
  city_hi: text("city_hi"),
  extra_charge: numeric("extra_charge").notNull().default("0"),
  reporting_time: text("reporting_time"),
  reporting_place_en: text("reporting_place_en"),
  reporting_place_hi: text("reporting_place_hi"),
  sort_order: integer("sort_order").notNull().default(0),
});

export const yatra_list_items = pgTable("yatra_list_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  yatra_id: uuid("yatra_id").notNull().references(() => yatras.id, { onDelete: "cascade" }),
  kind: listKind("kind").notNull(),
  text_en: text("text_en").notNull(),
  text_hi: text("text_hi"),
  sort_order: integer("sort_order").notNull().default(0),
});

export const yatra_faqs = pgTable("yatra_faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  yatra_id: uuid("yatra_id").notNull().references(() => yatras.id, { onDelete: "cascade" }),
  question_en: text("question_en").notNull(),
  question_hi: text("question_hi"),
  answer_en: text("answer_en"),
  answer_hi: text("answer_hi"),
  sort_order: integer("sort_order").notNull().default(0),
});

export const departures = pgTable("departures", {
  id: uuid("id").primaryKey().defaultRandom(),
  yatra_id: uuid("yatra_id").notNull().references(() => yatras.id, { onDelete: "cascade" }),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  total_seats: integer("total_seats").notNull().default(40),
  booked_seats: integer("booked_seats").notNull().default(0),
  price_override: numeric("price_override"),
  status: departureStatus("status").notNull().default("available"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const yatra_versions = pgTable("yatra_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  yatra_id: uuid("yatra_id").notNull().references(() => yatras.id, { onDelete: "cascade" }),
  snapshot: jsonb("snapshot").notNull(),
  created_by: text("created_by"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const seat_holds = pgTable("seat_holds", {
  id: uuid("id").primaryKey().defaultRandom(),
  departure_id: uuid("departure_id").notNull().references(() => departures.id, { onDelete: "cascade" }),
  user_id: text("user_id"),
  seats: integer("seats").notNull(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  booking_id: uuid("booking_id"),
  released: boolean("released").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  booking_code: text("booking_code").notNull().unique(),
  user_id: text("user_id"),
  created_by: text("created_by"),
  yatra_id: uuid("yatra_id").references(() => yatras.id, { onDelete: "set null" }),
  departure_id: uuid("departure_id").references(() => departures.id, { onDelete: "set null" }),
  adults: integer("adults").notNull().default(1),
  children: integer("children").notNull().default(0),
  infants: integer("infants").notNull().default(0),
  sharing: text("sharing").notNull().default("twin"),
  pickup_city_id: uuid("pickup_city_id"),
  contact: jsonb("contact").notNull().default({}),
  base_amount: numeric("base_amount").notNull().default("0"),
  addons_amount: numeric("addons_amount").notNull().default("0"),
  pickup_amount: numeric("pickup_amount").notNull().default("0"),
  discount_amount: numeric("discount_amount").notNull().default("0"),
  gst_amount: numeric("gst_amount").notNull().default("0"),
  total_amount: numeric("total_amount").notNull().default("0"),
  amount_paid: numeric("amount_paid").notNull().default("0"),
  status: bookingStatusEnum("status").notNull().default("pending_payment"),
  payment_option: text("payment_option"),
  coupon_code: text("coupon_code"),
  internal_notes: text("internal_notes"),
  consent: boolean("consent").notNull().default(false),
  lang: text("lang").notNull().default("hi"),
  is_sample: boolean("is_sample").notNull().default(false),
  cancelled_at: timestamp("cancelled_at", { withTimezone: true }),
  refund_amount: numeric("refund_amount").notNull().default("0"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const booking_travellers = pgTable("booking_travellers", {
  id: uuid("id").primaryKey().defaultRandom(),
  booking_id: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  traveller_type: text("traveller_type").notNull().default("adult"),
  full_name: text("full_name").notNull(),
  age: integer("age"),
  gender: text("gender"),
  mobile: text("mobile"),
  id_type: text("id_type"),
  id_last4: text("id_last4"),
  medical_condition: text("medical_condition"),
  meal_pref: text("meal_pref"),
  id_number_cipher: text("id_number_cipher"),
});

export const booking_addons = pgTable("booking_addons", {
  id: uuid("id").primaryKey().defaultRandom(),
  booking_id: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  addon_id: uuid("addon_id"),
  name_en: text("name_en"),
  name_hi: text("name_hi"),
  price: numeric("price").notNull().default("0"),
  qty: integer("qty").notNull().default(1),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  booking_id: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  amount: numeric("amount").notNull(),
  method: text("method"),
  razorpay_order_id: text("razorpay_order_id"),
  razorpay_payment_id: text("razorpay_payment_id").unique(),
  status: text("status").notNull().default("created"),
  recorded_by: text("recorded_by"),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const refunds = pgTable("refunds", {
  id: uuid("id").primaryKey().defaultRandom(),
  booking_id: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  payment_id: uuid("payment_id"),
  amount: numeric("amount").notNull(),
  razorpay_refund_id: text("razorpay_refund_id").unique(),
  status: text("status").notNull().default("pending"),
  reason: text("reason"),
  created_by: text("created_by"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  departure_id: uuid("departure_id").notNull().references(() => departures.id, { onDelete: "cascade" }),
  user_id: text("user_id"),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  email: text("email"),
  seats: integer("seats").notNull().default(1),
  status: text("status").notNull().default("waiting"),
  offered_until: timestamp("offered_until", { withTimezone: true }),
  booking_id: uuid("booking_id"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  description_en: text("description_en"),
  description_hi: text("description_hi"),
  discount_type: text("discount_type").notNull().default("percent"),
  value: numeric("value").notNull(),
  min_amount: numeric("min_amount").notNull().default("0"),
  valid_from: date("valid_from"),
  valid_to: date("valid_to"),
  usage_limit: integer("usage_limit"),
  per_user_limit: integer("per_user_limit"),
  used_count: integer("used_count").notNull().default(0),
  applicable_yatra_ids: uuid("applicable_yatra_ids").array().notNull().default(sql`'{}'::uuid[]`),
  applicable_category_ids: uuid("applicable_category_ids").array().notNull().default(sql`'{}'::uuid[]`),
  active: boolean("active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const coupon_redemptions = pgTable("coupon_redemptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  coupon_id: uuid("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  booking_id: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
  user_id: text("user_id"),
  amount: numeric("amount").notNull().default("0"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const enquiries = pgTable("enquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  email: text("email"),
  yatra_interest: text("yatra_interest"),
  preferred_month: text("preferred_month"),
  message: text("message"),
  source: text("source").notNull().default("home"),
  yatra_id: uuid("yatra_id"),
  status: enquiryStatus("status").notNull().default("new"),
  assigned_to: text("assigned_to"),
  follow_up_date: date("follow_up_date"),
  notes: text("notes"),
  is_sample: boolean("is_sample").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  yatra_id: uuid("yatra_id").notNull().references(() => yatras.id, { onDelete: "cascade" }),
  user_id: text("user_id"),
  name: text("name").notNull(),
  city: text("city"),
  rating: integer("rating").notNull().default(5),
  comment: text("comment"),
  status: text("status").notNull().default("pending"),
  reply: text("reply"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const wishlist = pgTable("wishlist", {
  user_id: text("user_id").notNull(),
  yatra_id: uuid("yatra_id").notNull().references(() => yatras.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.user_id, t.yatra_id] })]);

export const saved_travellers = pgTable("saved_travellers", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id").notNull(),
  full_name: text("full_name").notNull(),
  age: integer("age"),
  gender: text("gender"),
  mobile: text("mobile"),
  id_type: text("id_type"),
  id_last4: text("id_last4"),
  meal_pref: text("meal_pref"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const email_logs = pgTable("email_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  to_email: text("to_email").notNull(),
  subject: text("subject"),
  template: text("template"),
  booking_id: uuid("booking_id"),
  status: text("status").notNull().default("queued"),
  provider_id: text("provider_id"),
  error: text("error"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const audit_logs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actor_id: text("actor_id"),
  action: text("action").notNull(),
  entity: text("entity"),
  entity_id: text("entity_id"),
  details: jsonb("details"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations — relation keys match the old Postgrest embedded-select names
// (e.g. `y.yatra_images`, `dep.yatra`) so query code reads like a direct
// translation of the original Supabase calls.
// ---------------------------------------------------------------------------

export const yatrasRelations = relations(yatras, ({ many, one }) => ({
  yatra_images: many(yatra_images),
  yatra_itinerary_days: many(yatra_itinerary_days),
  yatra_pricing: one(yatra_pricing, { fields: [yatras.id], references: [yatra_pricing.yatra_id] }),
  yatra_addons: many(yatra_addons),
  yatra_pickup_cities: many(yatra_pickup_cities),
  yatra_list_items: many(yatra_list_items),
  yatra_faqs: many(yatra_faqs),
  yatra_categories: many(yatra_categories),
  yatra_destinations: many(yatra_destinations),
  departures: many(departures),
  reviews: many(reviews),
}));
export const categoriesRelations = relations(categories, ({ many }) => ({ yatra_categories: many(yatra_categories) }));
export const destinationsRelations = relations(destinations, ({ many }) => ({ yatra_destinations: many(yatra_destinations) }));
export const yatraCategoriesRelations = relations(yatra_categories, ({ one }) => ({
  yatra: one(yatras, { fields: [yatra_categories.yatra_id], references: [yatras.id] }),
  category: one(categories, { fields: [yatra_categories.category_id], references: [categories.id] }),
}));
export const yatraDestinationsRelations = relations(yatra_destinations, ({ one }) => ({
  yatra: one(yatras, { fields: [yatra_destinations.yatra_id], references: [yatras.id] }),
  destination: one(destinations, { fields: [yatra_destinations.destination_id], references: [destinations.id] }),
}));
export const yatraImagesRelations = relations(yatra_images, ({ one }) => ({ yatra: one(yatras, { fields: [yatra_images.yatra_id], references: [yatras.id] }) }));
export const yatraItineraryDaysRelations = relations(yatra_itinerary_days, ({ one }) => ({ yatra: one(yatras, { fields: [yatra_itinerary_days.yatra_id], references: [yatras.id] }) }));
export const yatraAddonsRelations = relations(yatra_addons, ({ one }) => ({ yatra: one(yatras, { fields: [yatra_addons.yatra_id], references: [yatras.id] }) }));
export const yatraPickupCitiesRelations = relations(yatra_pickup_cities, ({ one }) => ({ yatra: one(yatras, { fields: [yatra_pickup_cities.yatra_id], references: [yatras.id] }) }));
export const yatraListItemsRelations = relations(yatra_list_items, ({ one }) => ({ yatra: one(yatras, { fields: [yatra_list_items.yatra_id], references: [yatras.id] }) }));
export const yatraFaqsRelations = relations(yatra_faqs, ({ one }) => ({ yatra: one(yatras, { fields: [yatra_faqs.yatra_id], references: [yatras.id] }) }));
export const yatraPricingRelations = relations(yatra_pricing, ({ one }) => ({ yatra: one(yatras, { fields: [yatra_pricing.yatra_id], references: [yatras.id] }) }));

export const departuresRelations = relations(departures, ({ one, many }) => ({
  yatra: one(yatras, { fields: [departures.yatra_id], references: [yatras.id] }),
  waitlist: many(waitlist),
}));
export const waitlistRelations = relations(waitlist, ({ one }) => ({ departure: one(departures, { fields: [waitlist.departure_id], references: [departures.id] }) }));
export const reviewsRelations = relations(reviews, ({ one }) => ({ yatra: one(yatras, { fields: [reviews.yatra_id], references: [yatras.id] }) }));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  yatras: one(yatras, { fields: [bookings.yatra_id], references: [yatras.id] }),
  departures: one(departures, { fields: [bookings.departure_id], references: [departures.id] }),
  booking_travellers: many(booking_travellers),
  booking_addons: many(booking_addons),
  payments: many(payments),
  refunds: many(refunds),
}));
export const bookingTravellersRelations = relations(booking_travellers, ({ one }) => ({ booking: one(bookings, { fields: [booking_travellers.booking_id], references: [bookings.id] }) }));
export const bookingAddonsRelations = relations(booking_addons, ({ one }) => ({ booking: one(bookings, { fields: [booking_addons.booking_id], references: [bookings.id] }) }));
export const paymentsRelations = relations(payments, ({ one }) => ({ booking: one(bookings, { fields: [payments.booking_id], references: [bookings.id] }) }));
export const refundsRelations = relations(refunds, ({ one }) => ({ booking: one(bookings, { fields: [refunds.booking_id], references: [bookings.id] }) }));
export const couponRedemptionsRelations = relations(coupon_redemptions, ({ one }) => ({
  coupon: one(coupons, { fields: [coupon_redemptions.coupon_id], references: [coupons.id] }),
  booking: one(bookings, { fields: [coupon_redemptions.booking_id], references: [bookings.id] }),
}));
export const couponsRelations = relations(coupons, ({ many }) => ({ coupon_redemptions: many(coupon_redemptions) }));
