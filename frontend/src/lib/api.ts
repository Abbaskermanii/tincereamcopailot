export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}
/** Server-side fetches go through the docker network when available. */
const INTERNAL_API_URL = process.env.INTERNAL_API_URL;

function baseUrl(): string {
  if (typeof window === "undefined" && INTERNAL_API_URL) return INTERNAL_API_URL;
  return API_URL;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  short_description: string | null;
  stock_qty: number;
  primary_image_url: string | null;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price_delta: number;
  absolute_price: number | null;
  stock_qty: number;
  is_active: boolean;
  image_url?: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  code: string;
  cost: number;
  free_over_amount: number | null;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
}

export interface Category {
  id?: string;
  name: string;
  slug: string;
  image_url?: string | null;
  description?: string | null;
  children?: Category[];
}

import { cache } from "react";

// dedup + cache for server fetches - React cache ensures same request in same render is deduped
const cachedFetch = cache(async <T>(path: string, revalidate: number): Promise<T | null> => {
  try {
    const tag = (path.split("?")[0] ?? path).split("/").filter(Boolean).pop() || "api";
    const res = await fetch(`${baseUrl()}${path}`, {
      next: { revalidate, tags: [tag] },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
});

async function get<T>(path: string, revalidate = 120): Promise<T | null> {
  return cachedFetch<T>(path, revalidate);
}

export async function apiGet<T>(path: string, revalidate = 120) {
  return get<T>(path, revalidate);
}

// For stock-sensitive data, use shorter revalidate
export async function getWithFreshness<T>(path: string, revalidate = 30): Promise<T | null> {
  return get<T>(path, revalidate);
}

export const api = {
  categories: () => get<Category[]>("/categories"),
  category: (slug: string) =>
    get<Category & { product_count: number }>(`/categories/${slug}`),
  latestReviews: (limit = 6) =>
    get<
      Array<{
        id: string;
        author_name: string;
        rating: number;
        title: string;
        body: string;
        is_buyer: boolean;
        created_at: string;
        product_name?: string | null;
        product_slug?: string | null;
      }>
    >("/reviews/latest", 300).then((r) => r ?? []),
  products: (
    params: Record<string, string | number | boolean | undefined>,
    revalidate = 90,
  ) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }
    return get<Paged<ProductListItem>>(`/products?${qs}`, revalidate);
  },
  product: (slug: string) =>
    get<
      ProductListItem & {
        description: string;
        sku: string;
        weight_grams: number;
        material: string | null;
        dimensions: string | null;
        meta_title: string | null;
        meta_description: string | null;
        category_name: string | null;
        category_slug: string | null;
        discount_percent: number;
        images: ProductImage[];
        variants: ProductVariant[];
      }
    >(`/products/${slug}`),
  articles: () => get<Array<{ id: string; title: string; slug: string; excerpt?: string; body?: string; published_at?: string; cover_url?: string | null; category_name?: string | null; author_name?: string | null; author_avatar_url?: string | null; reading_time_minutes?: number }>>("/articles", 180),
  article: (slug: string) => get<{ id: string; title: string; slug: string; excerpt?: string; body: string; published_at?: string; cover_url?: string | null; category_name?: string | null; author_name?: string | null; author_avatar_url?: string | null; reading_time_minutes?: number; tags?: string[] }>(`/articles/${slug}`, 300),
  articleCategories: () => get<Array<{ id: string; name: string; slug: string }>>("/article-categories", 300),
  carousels: () =>
    get<Array<{ id: string; title?: string; subtitle?: string | null; image_url: string; link_url?: string | null; sort_order: number; is_active?: boolean }>>(
      "/carousels",
      120
    ),
  shippingMethods: () => get<ShippingMethod[]>("/shipping-methods", 120),
  faq: () =>
    get<Array<{ id: string; question: string; answer: string; category: string; sort_order: number; is_active: boolean }>>(
      "/faq",
      120
    ),
};
