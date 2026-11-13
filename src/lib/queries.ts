import { queryOptions } from "@tanstack/react-query";
import {
  getSettings, getHome, getFooterData, listYatras, getFilterOptions, getYatra, listDepartures,
  listDestinations, getDestination, listCategories, getCategory, listBlog, getBlogPost, listFaqs, listTeam, listGallery,
} from "./public-data.functions";

const stale = 60_000;
export const settingsQuery = queryOptions({ queryKey: ["settings"], queryFn: () => getSettings(), staleTime: stale });
export const homeQuery = queryOptions({ queryKey: ["home"], queryFn: () => getHome(), staleTime: stale });
export const footerQuery = queryOptions({ queryKey: ["footer"], queryFn: () => getFooterData(), staleTime: stale });
export const yatrasQuery = queryOptions({ queryKey: ["yatras"], queryFn: () => listYatras(), staleTime: stale });
export const filterOptionsQuery = queryOptions({ queryKey: ["filter-options"], queryFn: () => getFilterOptions(), staleTime: stale });
export const yatraQuery = (slug: string) => queryOptions({ queryKey: ["yatra", slug], queryFn: () => getYatra({ data: { slug } }), staleTime: stale });
export const departuresQuery = queryOptions({ queryKey: ["departures"], queryFn: () => listDepartures(), staleTime: stale });
export const destinationsQuery = queryOptions({ queryKey: ["destinations"], queryFn: () => listDestinations(), staleTime: stale });
export const destinationQuery = (slug: string) => queryOptions({ queryKey: ["destination", slug], queryFn: () => getDestination({ data: { slug } }), staleTime: stale });
export const categoriesQuery = queryOptions({ queryKey: ["categories"], queryFn: () => listCategories(), staleTime: stale });
export const categoryQuery = (slug: string) => queryOptions({ queryKey: ["category", slug], queryFn: () => getCategory({ data: { slug } }), staleTime: stale });
export const blogQuery = queryOptions({ queryKey: ["blog"], queryFn: () => listBlog(), staleTime: stale });
export const blogPostQuery = (slug: string) => queryOptions({ queryKey: ["blog", slug], queryFn: () => getBlogPost({ data: { slug } }), staleTime: stale });
export const faqsQuery = queryOptions({ queryKey: ["faqs"], queryFn: () => listFaqs(), staleTime: stale });
export const teamQuery = queryOptions({ queryKey: ["team"], queryFn: () => listTeam(), staleTime: stale });
export const galleryQuery = queryOptions({ queryKey: ["gallery"], queryFn: () => listGallery(), staleTime: stale });

export type YatraCardData = Awaited<ReturnType<typeof listYatras>>[number];
export type Settings = Awaited<ReturnType<typeof getSettings>>;
