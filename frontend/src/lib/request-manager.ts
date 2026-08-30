"use client";

/**
 * مدیریت درخواست‌ها برای جلوگیری از فشار به بک‌اند
 * - Deduplication: اگر یک GET در حال اجراست، درخواست تکراری همان Promise را برمی‌گرداند
 * - Throttle: محدودیت نرخ per-endpoint (token bucket ساده)
 * - Cache: کش حافظه کوتاه‌مدت برای GETها
 * - Abort: کنسل خودکار درخواست قبلی برای جستجو/فیلتر
 */

type CacheEntry<T> = { data: T; expiry: number };
const cache = new Map<string, CacheEntry<unknown>>();
const pending = new Map<string, Promise<unknown>>();
const throttleMap = new Map<string, number[]>(); // endpoint -> timestamps

const DEFAULT_TTL_MS = 30_000; // 30s برای GETهای کلاینت
const MAX_REQUESTS_PER_SECOND = 8; // per endpoint throttle

function isThrottled(key: string): boolean {
  const now = Date.now();
  const windowMs = 1000;
  const timestamps = throttleMap.get(key) ?? [];
  // پاک کردن قدیمی‌ها
  const recent = timestamps.filter((t) => now - t < windowMs);
  if (recent.length >= MAX_REQUESTS_PER_SECOND) return true;
  recent.push(now);
  throttleMap.set(key, recent);
  return false;
}

function cacheKey(url: string, init?: RequestInit): string {
  return `${init?.method ?? "GET"}:${url}:${JSON.stringify(init?.body ?? "")}`;
}

export async function dedupedFetch<T>(
  url: string,
  init?: RequestInit & { ttlMs?: number; dedup?: boolean; cache?: boolean },
): Promise<T> {
  const method = init?.method ?? "GET";
  const key = cacheKey(url, init);
  const ttl = init?.ttlMs ?? DEFAULT_TTL_MS;
  const useCache = init?.cache !== false && method === "GET";
  const useDedup = init?.dedup !== false && method === "GET";

  // 1) cache hit
  if (useCache) {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    if (entry && Date.now() < entry.expiry) {
      return entry.data;
    }
  }

  // 2) throttle check - اگر throttle شد، از کش قدیمی (stale) استفاده کن یا خطا
  const endpoint = (url.split("?")[0] ?? url).split("/").slice(-2).join("/");
  if (isThrottled(endpoint) && useCache) {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    if (entry) return entry.data; // stale-while-throttle
  }

  // 3) dedup - اگر درخواست مشابه در حال اجراست، همان را برگردان
  if (useDedup && pending.has(key)) {
    return pending.get(key) as Promise<T>;
  }

  const fetchPromise = (async () => {
    const res = await fetch(url, init);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let msg = `HTTP ${res.status}`;
      try {
        const j = JSON.parse(text);
        msg = j.detail || j.message || msg;
        if (Array.isArray(j.detail)) msg = j.detail.map((d: { msg: string }) => d.msg).join("، ");
      } catch {}
      throw Object.assign(new Error(msg), { status: res.status });
    }
    // 204 No Content
    if (res.status === 204) return undefined as T;
    const data = (await res.json()) as T;
    if (useCache) {
      cache.set(key, { data, expiry: Date.now() + ttl });
    }
    return data;
  })();

  if (useDedup) {
    pending.set(key, fetchPromise);
    fetchPromise.finally(() => pending.delete(key));
  }

  return fetchPromise;
}

export function clearCache(pattern?: string) {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const k of cache.keys()) {
    if (k.includes(pattern)) cache.delete(k);
  }
}

// برای استفاده در کامپوننت‌ها: hook با abort خودکار
import { useRef, useEffect } from "react";

export function useAbortableFetch() {
  const controllerRef = useRef<AbortController | null>(null);

  const abortableFetch = async <T>(url: string, init?: RequestInit): Promise<T> => {
    // کنسل قبلی اگر هنوز در حال اجراست (برای search/filter)
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (e) {
      if ((e as Error).name === "AbortError") throw e;
      throw e;
    }
  };

  useEffect(() => {
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, []);

  return abortableFetch;
}

// Preload helper برای لینک‌های مهم
export function preload(url: string) {
  if (typeof window === "undefined") return;
  // فقط اگر قبلاً کش نشده
  const key = cacheKey(url);
  if (!cache.has(key)) {
    // fire-and-forget با low priority
    void dedupedFetch(url, { ttlMs: 60_000 }).catch(() => {});
  }
}
