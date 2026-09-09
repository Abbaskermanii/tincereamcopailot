import { API_URL } from "@/lib/api";

// Use the same base as the rest of the app (defaults to `/api/v1`). Keeping a
// separate default here caused reviews/questions to hit `/api/...` (404) whenever
// NEXT_PUBLIC_API_URL wasn't inlined at build time.
const API_BASE = API_URL;

export interface ProductReview {
  id?: number;
  name?: string;
  user_name?: string;
  author_name?: string;
  rating?: number | string;
  title?: string;
  text?: string;
  comment?: string;
  body?: string;
  admin_reply?: string | null;
  created_at?: string;
  date?: string;
}

export interface ProductQuestion {
  id?: number;
  name?: string;
  user_name?: string;
  author_name?: string;
  text?: string;
  question?: string;
  body?: string;
  answer?: string;
  reply?: string;
  answer_text?: string;
  created_at?: string;
  date?: string;
}

/** اگر بک‌اند خروجی را داخل items/results/data می‌گذارد، اینجا نرمال می‌شود */
export function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of ["items", "results", "data", "reviews", "questions"]) {
      const v = obj[key];
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}

async function getJson(path: string): Promise<unknown> {
  const url = `${API_BASE}${path}`;
  const candidates = url.endsWith("/") ? [url] : [`${url}/`, url];
  let lastError: unknown = null;
  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) return await res.json();
      lastError = new Error(`HTTP ${res.status} برای ${candidate}`);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError ?? new Error("fetch failed");
}

export async function fetchProductReviews(productId: number | string): Promise<ProductReview[]> {
  const data = await getJson(`/products/${productId}/reviews`);
  return normalizeList<ProductReview>(data);
}

export async function fetchProductQuestions(
  productId: number | string,
): Promise<ProductQuestion[]> {
  const data = await getJson(`/products/${productId}/questions`);
  return normalizeList<ProductQuestion>(data);
}

export async function submitProductReview(input: {
  productId: number | string;
  name: string;
  rating: number;
  text: string;
}): Promise<ProductReview> {
  const res = await fetch(`${API_BASE}/products/${input.productId}/reviews/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      product: input.productId,
      name: input.name,
      rating: input.rating,
      text: input.text,
      comment: input.text,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function submitProductQuestion(input: {
  productId: number | string;
  name: string;
  text: string;
}): Promise<ProductQuestion> {
  const res = await fetch(`${API_BASE}/products/${input.productId}/questions/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      product: input.productId,
      name: input.name,
      text: input.text,
      question: input.text,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
