import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const db = createServerOnlyFn(() => {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
});

const today = () => new Date().toISOString().slice(0, 10);

const YATRA_CARD = "id, slug, title_en, title_hi, short_desc_en, short_desc_hi, duration_days, duration_nights, price, original_price, rating, review_count, popularity, cover_image, featured, offer, offer_ends_at, transport, difficulty, senior_friendly, states, starting_city_en, starting_city_hi";

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await db().from("site_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(error.message);
  return data;
});

export const getHome = createServerFn({ method: "GET" }).handler(async () => {
  const c = db();
  const [banners, deps, featured, cats, dests, offers, tests, reps, blog, popular] = await Promise.all([
    c.from("banners").select("*").eq("is_published", true).order("sort_order"),
    c.from("departures").select(`id, start_date, end_date, total_seats, booked_seats, status, price_override, yatra:yatras!inner(${YATRA_CARD})`).gte("start_date", today()).in("status", ["available", "filling_fast"]).order("start_date").limit(8),
    c.from("yatras").select(YATRA_CARD).eq("status", "published").eq("featured", true).order("popularity", { ascending: false }).limit(6),
    c.from("categories").select("*").eq("is_published", true).order("sort_order"),
    c.from("destinations").select("id, slug, name_en, name_hi, state, image_url").eq("is_published", true).order("sort_order"),
    c.from("yatras").select(YATRA_CARD).eq("status", "published").eq("offer", true).order("popularity", { ascending: false }).limit(4),
    c.from("testimonials").select("*").eq("is_published", true).order("sort_order"),
    c.from("representatives").select("*").eq("is_published", true).order("sort_order"),
    c.from("blog_posts").select("id, slug, title_en, title_hi, excerpt_en, excerpt_hi, cover_image, published_at").eq("is_published", true).lte("published_at", new Date().toISOString()).order("published_at", { ascending: false }).limit(3),
    c.from("yatras").select("slug, title_en, title_hi").eq("status", "published").order("popularity", { ascending: false }).limit(6),
  ]);
  return {
    banners: banners.data ?? [],
    departures: deps.data ?? [],
    featured: featured.data ?? [],
    categories: cats.data ?? [],
    destinations: dests.data ?? [],
    offers: offers.data ?? [],
    testimonials: tests.data ?? [],
    reps: reps.data ?? [],
    blog: blog.data ?? [],
    popular: popular.data ?? [],
  };
});

export const getFooterData = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await db().from("yatras").select("slug, title_en, title_hi").eq("status", "published").order("popularity", { ascending: false }).limit(6);
  return data ?? [];
});

export const listYatras = createServerFn({ method: "GET" }).handler(async () => {
  const c = db();
  const { data, error } = await c
    .from("yatras")
    .select(`${YATRA_CARD}, yatra_categories(category:categories(slug)), yatra_destinations(destination:destinations(slug, state)), departures(start_date, status, total_seats, booked_seats)`)
    .eq("status", "published");
  if (error) throw new Error(error.message);
  const t = today();
  return (data ?? []).map((y) => {
    const future = (y.departures ?? []).filter((d) => d.start_date >= t && d.status !== "closed" && d.status !== "completed").sort((a, b) => a.start_date.localeCompare(b.start_date));
    return {
      ...y,
      categorySlugs: (y.yatra_categories ?? []).map((x) => x.category?.slug).filter(Boolean) as string[],
      destinationSlugs: (y.yatra_destinations ?? []).map((x) => x.destination?.slug).filter(Boolean) as string[],
      nextDate: future[0]?.start_date ?? null,
      months: Array.from(new Set(future.map((d) => Number(d.start_date.slice(5, 7))))),
      yatra_categories: undefined,
      yatra_destinations: undefined,
      departures: undefined,
    };
  });
});

export const getFilterOptions = createServerFn({ method: "GET" }).handler(async () => {
  const c = db();
  const [cats, dests] = await Promise.all([
    c.from("categories").select("slug, name_en, name_hi").eq("is_published", true).order("sort_order"),
    c.from("destinations").select("slug, name_en, name_hi, state").eq("is_published", true).order("sort_order"),
  ]);
  return { categories: cats.data ?? [], destinations: dests.data ?? [] };
});

export const getYatra = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug).slice(0, 200) }))
  .handler(async ({ data }) => {
    const c = db();
    const { data: y, error } = await c
      .from("yatras")
      .select("*, yatra_images(*), yatra_itinerary_days(*), yatra_pricing(*), yatra_addons(*), yatra_pickup_cities(*), yatra_list_items(*), yatra_faqs(*), yatra_categories(category:categories(id, slug, name_en, name_hi))")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!y) return null;
    const [deps, reviews, settings] = await Promise.all([
      c.from("departures").select("*").eq("yatra_id", y.id).gte("start_date", today()).neq("status", "completed").order("start_date"),
      c.from("reviews").select("id, name, city, rating, comment, reply, created_at").eq("yatra_id", y.id).eq("status", "approved").order("created_at", { ascending: false }),
      c.from("site_settings").select("cancellation_slabs").eq("id", 1).single(),
    ]);
    const catIds = (y.yatra_categories ?? []).map((x) => x.category?.id).filter(Boolean) as string[];
    let related: unknown[] = [];
    if (catIds.length) {
      const { data: rel } = await c.from("yatra_categories").select(`yatra:yatras!inner(${YATRA_CARD}, status)`).in("category_id", catIds).neq("yatra_id", y.id).eq("yatra.status", "published").limit(12);
      const seen = new Set<string>();
      related = (rel ?? []).map((r) => r.yatra).filter((r) => r && !seen.has(r.id) && seen.add(r.id)).slice(0, 3);
    }
    const sortBy = <T extends { sort_order?: number; day_number?: number }>(a: T[]) => [...a].sort((x, z) => (x.sort_order ?? x.day_number ?? 0) - (z.sort_order ?? z.day_number ?? 0));
    return {
      ...y,
      yatra_images: sortBy(y.yatra_images ?? []),
      yatra_itinerary_days: sortBy(y.yatra_itinerary_days ?? []),
      yatra_addons: sortBy(y.yatra_addons ?? []),
      yatra_pickup_cities: sortBy(y.yatra_pickup_cities ?? []),
      yatra_list_items: sortBy(y.yatra_list_items ?? []),
      yatra_faqs: sortBy(y.yatra_faqs ?? []),
      departures: deps.data ?? [],
      reviews: reviews.data ?? [],
      slabs: (y.cancellation_slabs ?? settings.data?.cancellation_slabs ?? []) as { min_days: number; refund_percent: number }[],
      related: related as Awaited<ReturnType<typeof listYatras>>,
    };
  });

export const listDepartures = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await db()
    .from("departures")
    .select("id, start_date, end_date, total_seats, booked_seats, status, price_override, yatra:yatras!inner(id, slug, title_en, title_hi, duration_days, duration_nights, price, cover_image, status, yatra_categories(category:categories(slug)))")
    .gte("start_date", today())
    .neq("status", "completed")
    .eq("yatra.status", "published")
    .order("start_date");
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({ ...d, categorySlugs: (d.yatra?.yatra_categories ?? []).map((x) => x.category?.slug).filter(Boolean) as string[] }));
});

export const listDestinations = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await db().from("destinations").select("*").eq("is_published", true).order("sort_order");
  return data ?? [];
});

export const getDestination = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug).slice(0, 200) }))
  .handler(async ({ data }) => {
    const c = db();
    const { data: dest } = await c.from("destinations").select("*").eq("slug", data.slug).eq("is_published", true).maybeSingle();
    if (!dest) return null;
    const { data: rel } = await c.from("yatra_destinations").select(`yatra:yatras!inner(${YATRA_CARD}, status)`).eq("destination_id", dest.id).eq("yatra.status", "published");
    return { ...dest, yatras: (rel ?? []).map((r) => r.yatra).filter(Boolean) };
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await db().from("categories").select("*, yatra_categories(count)").eq("is_published", true).order("sort_order");
  return data ?? [];
});

export const getCategory = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug).slice(0, 200) }))
  .handler(async ({ data }) => {
    const c = db();
    const { data: cat } = await c.from("categories").select("*").eq("slug", data.slug).eq("is_published", true).maybeSingle();
    if (!cat) return null;
    const { data: rel } = await c.from("yatra_categories").select(`yatra:yatras!inner(${YATRA_CARD}, status)`).eq("category_id", cat.id).eq("yatra.status", "published");
    return { ...cat, yatras: (rel ?? []).map((r) => r.yatra).filter(Boolean) };
  });

export const listBlog = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await db().from("blog_posts").select("id, slug, title_en, title_hi, excerpt_en, excerpt_hi, cover_image, category, author, published_at").eq("is_published", true).lte("published_at", new Date().toISOString()).order("published_at", { ascending: false });
  return data ?? [];
});

export const getBlogPost = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug).slice(0, 200) }))
  .handler(async ({ data }) => {
    const c = db();
    const { data: post } = await c.from("blog_posts").select("*").eq("slug", data.slug).eq("is_published", true).lte("published_at", new Date().toISOString()).maybeSingle();
    if (!post) return null;
    const { data: related } = await c.from("blog_posts").select("id, slug, title_en, title_hi, cover_image, published_at").eq("is_published", true).neq("id", post.id).lte("published_at", new Date().toISOString()).order("published_at", { ascending: false }).limit(3);
    return { ...post, related: related ?? [] };
  });

export const listFaqs = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await db().from("faqs").select("*").eq("is_published", true).order("sort_order");
  return data ?? [];
});

export const listTeam = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await db().from("team_members").select("*").eq("is_published", true).order("sort_order");
  return data ?? [];
});

export const listGallery = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await db().from("gallery_images").select("*").eq("is_published", true).order("sort_order");
  return data ?? [];
});
