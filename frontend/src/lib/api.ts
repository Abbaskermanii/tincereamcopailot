export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
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

export interface Category {
  id?: string;
  name: string;
  slug: string;
  image_url?: string | null;
  description?: string | null;
  children?: Category[];
}

async function get<T>(path: string, revalidate = 120): Promise<T | null> {
  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function apiGet<T>(path: string, revalidate = 120) {
  return get<T>(path, revalidate);
}

export const api = {
  categories: () => get<Category[]>("/categories"),
  category: (slug: string) =>
    get<Category & { product_count: number }>(`/categories/${slug}`),
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
      }
    >(`/products/${slug}`),
  articles: () => get<Array<{ id: string; title: string; slug: string; excerpt?: string; body?: string; published_at?: string }>>("/articles", 180),
  article: (slug: string) => get<{ id: string; title: string; slug: string; excerpt?: string; body: string; published_at?: string }>(`/articles/${slug}`, 300),
  carousels: () => get<Array<{ id: string; title?: string; image_url: string; link_url?: string; sort_order: number }>>("/carousels", 120),
};
