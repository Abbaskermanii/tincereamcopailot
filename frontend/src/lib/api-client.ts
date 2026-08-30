"use client";

import { API_URL } from "./api";

export interface ApiError {
  status: number;
  message: string;
  detail?: unknown;
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  const refreshToken = getRefreshToken();
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
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        return false;
      }
      const data = await res.json();
      if (data.access_token) localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export function authHeaders(json = false): HeadersInit {
  const token = getAccessToken();
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

// --- Request deduplication, throttling, and bounded cache ---
const pendingRequests = new Map<string, Promise<Response>>();
const lastRequestAt = new Map<string, number>();

// Bounded response cache with TTL and max size
const CACHE_TTL_MS = 30_000;
const CACHE_MAX_ENTRIES = 200;
const responseCache = new Map<string, { res: Response; expiry: number }>();

let cleanupTimer: ReturnType<typeof setTimeout> | null = null;

function evictExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of responseCache) {
    if (now >= entry.expiry) responseCache.delete(key);
  }
  // If still over max, remove oldest entries
  if (responseCache.size > CACHE_MAX_ENTRIES) {
    const entries = Array.from(responseCache.entries());
    // Sort by expiry ascending (oldest first)
    entries.sort((a, b) => a[1].expiry - b[1].expiry);
    const toRemove = entries.slice(0, entries.length - CACHE_MAX_ENTRIES);
    for (const [key] of toRemove) responseCache.delete(key);
  }
}

function scheduleCacheCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setTimeout(() => {
    cleanupTimer = null;
    evictExpiredCache();
  }, CACHE_TTL_MS);
}

function setCache(key: string, res: Response): void {
  // Evict before adding to stay within bounds
  if (responseCache.size >= CACHE_MAX_ENTRIES) evictExpiredCache();
  responseCache.set(key, { res: res.clone(), expiry: Date.now() + CACHE_TTL_MS });
  scheduleCacheCleanup();
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
  if (method === "GET" && shouldThrottle(url)) {
    const cached = responseCache.get(dedupKey);
    if (cached) return cached.res.clone();
  }

  const exec = async (): Promise<Response> => {
    const headers = new Headers(init.headers);
    const token = getAccessToken();
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    let res = await fetch(url, { ...init, headers, credentials: "include" });

    if (res.status === 401 && !init._retry) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        const newToken = getAccessToken();
        if (newToken) headers.set("Authorization", `Bearer ${newToken}`);
        res = await fetch(url, { ...init, headers, credentials: "include", _retry: true } as RequestInit & { _retry?: boolean });
      }
    }
    return res;
  };

  const promise = exec();
  if (method === "GET" && !init._noDedup) pendingRequests.set(dedupKey, promise);

  try {
    const res = await promise;
    // Cache successful GET responses
    if (method === "GET" && res.ok && !init._noCache) {
      setCache(dedupKey, res);
    }
    return res;
  } finally {
    if (method === "GET" && !init._noDedup) pendingRequests.delete(dedupKey);
  }
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
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
