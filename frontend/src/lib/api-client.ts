"use client";

import { API_URL } from "./api";

export interface ApiError {
  status: number;
  message: string;
  detail?: unknown;
}

// --- توکن‌ها فقط از کوکی httponly می‌مونیم (بک‌اند header نشانه ورود احراز شده) ---
// localStorage.getItem/setItem "access_token"/"refresh_token" حذف شده.
// Authorization header دستی (Bearer ...) حذف شده — از credentials: "include"
// در fetch استفاده می‌شه. cookie httponly توسط بک‌اند setted می‌شه.

// --- دریافت refresh token از cookie (method fluent) ---
function getRefreshTokenFromCookie(): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )tinceram_refresh=([^;]+)/);
  return match?.[1] ?? null;
}

// --- refresh token attempt ---
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  const refreshToken = getRefreshTokenFromCookie();
  if (!refreshToken) return false;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) {
        // refresh failed → clear cookies so user is logged out
        document.cookie = "tinceram_access=; max-age=0; path=/";
        document.cookie = "tinceram_refresh=; max-age=0; path=/";
        return false;
      }
      // سرвер معمولاً JSON برنمی‌گردونه، اما ممکن است برای سازگاری cookie ری‑SET کنه
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

// --- authHeaders: توکنها فقط با کوکی httponly ارسال میشوند (credentials: "include") ---
export function authHeaders(json = false): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  return h;
}

// --- مدیریت درخواست برای جلوگیری از فشار به بک‌اند ---
const pendingRequests = new Map<string, Promise<Response>>();
const lastRequestAt = new Map<string, number>();
const responseCache = new Map<string, { res: Response; expiry: number }>();

/** Cache invalidation — call after any successful mutation so admin UI never shows stale data. */
export function invalidateApiCache(prefix?: string): void {
  if (!prefix) { responseCache.clear(); return; }
  for (const key of [...responseCache.keys()]) {
    if (key.includes(prefix)) responseCache.delete(key);
  }
}

function throttleKey(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname;
  } catch {
    return url.split("?")[0] ?? url;
  }
}

function shouldThrottle(url: string): boolean {
  const key = throttleKey(url);
  const now = Date.now();
  const last = lastRequestAt.get(key) ?? 0;
  // حداقل 80ms فاصله بین درخواست‌های GET به یک endpoint
  if (now - last < 80) return true;
  lastRequestAt.set(key, now);
  return false;
}

export async function apiFetch(
  path: string,
  init: RequestInit & { _retry?: boolean; _noDedup?: boolean; _noCache?: boolean } = {}
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const method = (init.method ?? "GET").toUpperCase();
  const dedupKey = `${method}:${url}:${init.body ?? ""}`;

  // کش کوتاه‌مدت برای GET (30s) — از فشار تکراری جلوگیری
  if (method === "GET" && !init._noCache) {
    const cached = responseCache.get(dedupKey);
    if (cached && Date.now() < cached.expiry) {
      return cached.res.clone();
    }
  }

  // Deduplication: اگر همین GET در حال اجراست، همان Promise را برگردان
  if (method === "GET" && !init._noDedup && pendingRequests.has(dedupKey)) {
    return (await pendingRequests.get(dedupKey)!).clone();
  }

  // Throttle ساده: اگر خیلی سریع درخواست تکراری زدیم، از کش stale استفاده کن
  if (method === "GET" && !init._noCache && shouldThrottle(url)) {
    const cached = responseCache.get(dedupKey);
    if (cached) return cached.res.clone();
  }

  const exec = async (): Promise<Response> => {
    const headers = new Headers(init.headers);
    // auth tokens exclusively via httponly cookies; no manual Bearer header.
    if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    let res = await fetch(url, { ...init, headers, credentials: "include", cache: init.cache ?? "no-store" });

    if (res.status === 401 && !init._retry) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        res = await fetch(url, { ...init, headers, credentials: "include", cache: init.cache ?? "no-store", _retry: true } as RequestInit & { _retry?: boolean });
      }
    }
    return res;
  };

  const promise = exec();
  if (method === "GET" && !init._noDedup) pendingRequests.set(dedupKey, promise);

  try {
    const res = await promise;
    // کش کردن پاسخ موفق GET برای 30 ثانیه
    if (method === "GET" && res.ok && !init._noCache) {
      responseCache.set(dedupKey, { res: res.clone(), expiry: Date.now() + 30_000 });
      // پاکسازی خودکار بعد از 30s
      setTimeout(() => responseCache.delete(dedupKey), 30_000);
    }
    return res;
  } finally {
    if (method === "GET" && !init._noDedup) pendingRequests.delete(dedupKey);
  }
}

export async function apiJson<T>(
  path: string,
  init: RequestInit & { _retry?: boolean; _noDedup?: boolean; _noCache?: boolean } = {},
): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    let msg = `خطا: ${res.status}`;
    try {
      const data = await res.json();
      if (Array.isArray(data.detail)) msg = data.detail.map((d: { msg: string }) => d.msg).join("، ");
      else if (typeof data.detail === "string") msg = data.detail;
      else if (data.message) msg = data.message;
      throw { status: res.status, message: msg, detail: data.detail } as ApiError;
    } catch (e) {
      if ((e as ApiError).status) throw e;
      throw { status: res.status, message: msg } as ApiError;
    }
  }
  return (await res.json()) as T;
}

export function getErrorMessage(err: unknown, fallback = "خطایی رخ داد"): string {
  if (err && typeof err === "object" && "message" in err) return String((err as { message: string }).message);
  if (err instanceof Error) return err.message;
  return fallback;
}

export function isAuthError(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && "status" in err && (err as ApiError).status === 401);
}