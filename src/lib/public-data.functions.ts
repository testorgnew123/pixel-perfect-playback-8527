import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, gte, inArray, lte, ne } from "drizzle-orm";
import { db } from "@/lib/db.server";
import { banners, blog_posts, categories, destinations, departures, faqs, gallery_images, representatives, reviews, site_settings, team_members, testimonials, yatra_categories, yatra_destinations, yatras } from "../../drizzle/schema";

const today = () => new Date().toISOString().slice(0, 10);

const YATRA_CARD = {
  id: true, slug: true, title_en: true, title_hi: true, short_desc_en: true, short_desc_hi: true,
  duration_days: true, duration_nights: true, price: true, original_price: true, rating: true,
  review_count: true, popularity: true, cover_image: true, featured: true, offer: true, offer_ends_at: true,
  transport: true, difficulty: true, senior_friendly: true, states: true, starting_city_en: true, starting_city_hi: true,
} as const;

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const row = await db.query.site_settings.findFirst({ where: eq(site_settings.id, 1) });
  if (!row) throw new Error("Site settings not found");
  return row;
});

export const getHome = createServerFn({ method: "GET" }).handler(async () => {
  const [bannerRows, depRows, featuredRows, catRows, destRows, offerRows, testRows, repRows, blogRows, popularRows] = await Promise.all([
    db.query.banners.findMany({ where: eq(banners.is_published, true), orderBy: asc(banners.sort_order) }),
    db.query.departures.findMany({
      where: and(gte(departures.start_date, today()), inArray(departures.status, ["available", "filling_fast"])),
      with: { yatra: { columns: YATRA_CARD } },
      orderBy: asc(departures.start_date),
      limit: 8,
    }),
    db.query.yatras.findMany({ where: and(eq(yatras.status, "published"), eq(yatras.featured, true)), columns: YATRA_CARD, orderBy: desc(yatras.popularity), limit: 6 }),
    db.query.categories.findMany({ where: eq(categories.is_published, true), orderBy: asc(categories.sort_order) }),
    db.query.destinations.findMany({ where: eq(destinations.is_published, true), orderBy: asc(destinations.sort_order), columns: { id: true, slug: true, name_en: true, name_hi: true, state: true, image_url: true } }),
    db.query.yatras.findMany({ where: and(eq(yatras.status, "published"), eq(yatras.offer, true)), columns: YATRA_CARD, orderBy: desc(yatras.popularity), limit: 4 }),
    db.query.testimonials.findMany({ where: eq(testimonials.is_published, true), orderBy: asc(testimonials.sort_order) }),
    db.query.representatives.findMany({ where: eq(representatives.is_published, true), orderBy: asc(representatives.sort_order) }),
    db.query.blog_posts.findMany({
      where: and(eq(blog_posts.is_published, true), lte(blog_posts.published_at, new Date())),
      columns: { id: true, slug: true, title_en: true, title_hi: true, excerpt_en: true, excerpt_hi: true, cover_image: true, published_at: true },
      orderBy: desc(blog_posts.published_at),
      limit: 3,
    }),
    db.query.yatras.findMany({ where: eq(yatras.status, "published"), columns: { slug: true, title_en: true, title_hi: true }, orderBy: desc(yatras.popularity), limit: 6 }),
  ]);
  return { banners: bannerRows, departures: depRows, featured: featuredRows, categories: catRows, destinations: destRows, offers: offerRows, testimonials: testRows, reps: repRows, blog: blogRows, popular: popularRows };
});

export const getFooterData = createServerFn({ method: "GET" }).handler(async () => {
  return db.query.yatras.findMany({ where: eq(yatras.status, "published"), columns: { slug: true, title_en: true, title_hi: true }, orderBy: desc(yatras.popularity), limit: 6 });
});

export const listYatras = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db.query.yatras.findMany({
    where: eq(yatras.status, "published"),
    columns: YATRA_CARD,
    with: {
      yatra_categories: { with: { category: { columns: { slug: true } } } },
      yatra_destinations: { with: { destination: { columns: { slug: true, state: true } } } },
      departures: { columns: { start_date: true, status: true, total_seats: true, booked_seats: true } },
    },
  });
  const t = today();
  return rows.map((y) => {
    const future = y.departures.filter((d) => d.start_date >= t && d.status !== "closed" && d.status !== "completed").sort((a, b) => a.start_date.localeCompare(b.start_date));
    const { yatra_categories, yatra_destinations, departures: _deps, ...card } = y;
    return {
      ...card,
      categorySlugs: yatra_categories.map((x) => x.category?.slug).filter(Boolean) as string[],
      destinationSlugs: yatra_destinations.map((x) => x.destination?.slug).filter(Boolean) as string[],
      nextDate: future[0]?.start_date ?? null,
      months: Array.from(new Set(future.map((d) => Number(d.start_date.slice(5, 7))))),
    };
  });
});

export const getFilterOptions = createServerFn({ method: "GET" }).handler(async () => {
  const [cats, dests] = await Promise.all([
    db.query.categories.findMany({ where: eq(categories.is_published, true), orderBy: asc(categories.sort_order), columns: { slug: true, name_en: true, name_hi: true } }),
    db.query.destinations.findMany({ where: eq(destinations.is_published, true), orderBy: asc(destinations.sort_order), columns: { slug: true, name_en: true, name_hi: true, state: true } }),
  ]);
  return { categories: cats, destinations: dests };
});

export const getYatra = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug).slice(0, 200) }))
  .handler(async ({ data }) => {
    const y = await db.query.yatras.findFirst({
      where: and(eq(yatras.slug, data.slug), eq(yatras.status, "published")),
      with: {
        yatra_images: true,
        yatra_itinerary_days: true,
        yatra_pricing: true,
        yatra_addons: true,
        yatra_pickup_cities: true,
        yatra_list_items: true,
        yatra_faqs: true,
        yatra_categories: { with: { category: { columns: { id: true, slug: true, name_en: true, name_hi: true } } } },
      },
    });
    if (!y) return null;
    const [deps, reviewRows, settings] = await Promise.all([
      db.query.departures.findMany({ where: and(eq(departures.yatra_id, y.id), gte(departures.start_date, today()), ne(departures.status, "completed")), orderBy: asc(departures.start_date) }),
      db.query.reviews.findMany({ where: and(eq(reviews.yatra_id, y.id), eq(reviews.status, "approved")), orderBy: desc(reviews.created_at), columns: { id: true, name: true, city: true, rating: true, comment: true, reply: true, created_at: true } }),
      db.query.site_settings.findFirst({ where: eq(site_settings.id, 1), columns: { cancellation_slabs: true } }),
    ]);
    const catIds = y.yatra_categories.map((x) => x.category?.id).filter(Boolean) as string[];
    let related: unknown[] = [];
    if (catIds.length) {
      const rel = await db.query.yatra_categories.findMany({
        where: and(inArray(yatra_categories.category_id, catIds), ne(yatra_categories.yatra_id, y.id)),
        with: { yatra: { where: eq(yatras.status, "published"), columns: YATRA_CARD } },
        limit: 12,
      });
      const seen = new Set<string>();
      related = rel.map((r) => r.yatra).filter((r): r is NonNullable<typeof r> => !!r && !seen.has(r.id) && !!seen.add(r.id)).slice(0, 3);
    }
    const sortBy = <T extends { sort_order?: number; day_number?: number }>(a: T[]) => [...a].sort((x, z) => (x.sort_order ?? x.day_number ?? 0) - (z.sort_order ?? z.day_number ?? 0));
    return {
      ...y,
      yatra_images: sortBy(y.yatra_images),
      yatra_itinerary_days: sortBy(y.yatra_itinerary_days),
      yatra_addons: sortBy(y.yatra_addons),
      yatra_pickup_cities: sortBy(y.yatra_pickup_cities),
      yatra_list_items: sortBy(y.yatra_list_items),
      yatra_faqs: sortBy(y.yatra_faqs),
      departures: deps,
      reviews: reviewRows,
      slabs: (y.cancellation_slabs ?? settings?.cancellation_slabs ?? []) as { min_days: number; refund_percent: number }[],
      related,
    };
  });

export const listDepartures = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db.query.departures.findMany({
    where: and(gte(departures.start_date, today()), ne(departures.status, "completed")),
    with: {
      yatra: {
        columns: { id: true, slug: true, title_en: true, title_hi: true, duration_days: true, duration_nights: true, price: true, cover_image: true, status: true },
        with: { yatra_categories: { with: { category: { columns: { slug: true } } } } },
      },
    },
    orderBy: asc(departures.start_date),
  });
  return rows.filter((d) => d.yatra?.status === "published").map((d) => ({ ...d, categorySlugs: (d.yatra?.yatra_categories ?? []).map((x) => x.category?.slug).filter(Boolean) as string[] }));
});

export const listDestinations = createServerFn({ method: "GET" }).handler(async () => {
  return db.query.destinations.findMany({ where: eq(destinations.is_published, true), orderBy: asc(destinations.sort_order) });
});

export const getDestination = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug).slice(0, 200) }))
  .handler(async ({ data }) => {
    const dest = await db.query.destinations.findFirst({ where: and(eq(destinations.slug, data.slug), eq(destinations.is_published, true)) });
    if (!dest) return null;
    const rel = await db.query.yatra_destinations.findMany({
      where: eq(yatra_destinations.destination_id, dest.id),
      with: { yatra: { where: eq(yatras.status, "published"), columns: YATRA_CARD } },
    });
    return { ...dest, yatras: rel.map((r) => r.yatra).filter(Boolean) };
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db.query.categories.findMany({ where: eq(categories.is_published, true), orderBy: asc(categories.sort_order), with: { yatra_categories: { columns: { yatra_id: true } } } });
  return rows.map(({ yatra_categories: links, ...c }) => ({ ...c, yatra_categories: [{ count: links.length }] }));
});

export const getCategory = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug).slice(0, 200) }))
  .handler(async ({ data }) => {
    const cat = await db.query.categories.findFirst({ where: and(eq(categories.slug, data.slug), eq(categories.is_published, true)) });
    if (!cat) return null;
    const rel = await db.query.yatra_categories.findMany({
      where: eq(yatra_categories.category_id, cat.id),
      with: { yatra: { where: eq(yatras.status, "published"), columns: YATRA_CARD } },
    });
    return { ...cat, yatras: rel.map((r) => r.yatra).filter(Boolean) };
  });

export const listBlog = createServerFn({ method: "GET" }).handler(async () => {
  return db.query.blog_posts.findMany({
    where: and(eq(blog_posts.is_published, true), lte(blog_posts.published_at, new Date())),
    columns: { id: true, slug: true, title_en: true, title_hi: true, excerpt_en: true, excerpt_hi: true, cover_image: true, category: true, author: true, published_at: true },
    orderBy: desc(blog_posts.published_at),
  });
});

export const getBlogPost = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug).slice(0, 200) }))
  .handler(async ({ data }) => {
    const post = await db.query.blog_posts.findFirst({ where: and(eq(blog_posts.slug, data.slug), eq(blog_posts.is_published, true), lte(blog_posts.published_at, new Date())) });
    if (!post) return null;
    const related = await db.query.blog_posts.findMany({
      where: and(eq(blog_posts.is_published, true), ne(blog_posts.id, post.id), lte(blog_posts.published_at, new Date())),
      columns: { id: true, slug: true, title_en: true, title_hi: true, cover_image: true, published_at: true },
      orderBy: desc(blog_posts.published_at),
      limit: 3,
    });
    return { ...post, related };
  });

export const listFaqs = createServerFn({ method: "GET" }).handler(async () => {
  return db.query.faqs.findMany({ where: eq(faqs.is_published, true), orderBy: asc(faqs.sort_order) });
});

export const listTeam = createServerFn({ method: "GET" }).handler(async () => {
  return db.query.team_members.findMany({ where: eq(team_members.is_published, true), orderBy: asc(team_members.sort_order) });
});

export const listGallery = createServerFn({ method: "GET" }).handler(async () => {
  return db.query.gallery_images.findMany({ where: eq(gallery_images.is_published, true), orderBy: asc(gallery_images.sort_order) });
});

export const getBookingContext = createServerFn({ method: "GET" })
  .inputValidator((d: { departureId: string }) => d)
  .handler(async ({ data }) => {
    const dep = await db.query.departures.findFirst({ where: eq(departures.id, data.departureId) });
    if (!dep) return null;
    const y = await db.query.yatras.findFirst({
      where: and(eq(yatras.id, dep.yatra_id), eq(yatras.status, "published")),
      columns: { id: true, slug: true, title_en: true, title_hi: true, price: true, cover_image: true, duration_days: true, duration_nights: true, gst_percent: true, gst_inclusive: true },
      with: { yatra_pricing: true, yatra_addons: true, yatra_pickup_cities: true },
    });
    if (!y) return null;
    const so = <T extends { sort_order: number }>(a: T[]) => [...a].sort((p, q) => p.sort_order - q.sort_order);
    return { dep, y: { ...y, yatra_addons: so(y.yatra_addons), yatra_pickup_cities: so(y.yatra_pickup_cities) } };
  });
