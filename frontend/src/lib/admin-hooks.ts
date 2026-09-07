"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiJson, getErrorMessage, invalidateApiCache } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast-provider";

/** Debounced value — used by every admin search box. */
export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/** Simple single-resource loader with manual refresh. */
export function useAdminResource<T>(path: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      setData(await apiJson<T>(path, { _noCache: true }));
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  useEffect(() => { void load(); }, [load]);
  return { data, loading, error, reload: load };
}

/** Mutable CRUD helper: wraps apiJson with toasts and busy state. */
export function useAdminMutation() {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const mutate = useCallback(
    async <T,>(path: string, init: RequestInit & { successMessage?: string } = {}): Promise<T | null> => {
      setBusy(true);
      try {
        const result = await apiJson<T>(path, init);
        invalidateApiCache();
        if (init.successMessage) toast(init.successMessage, "success");
        return result;
      } catch (e) {
        toast(getErrorMessage(e, "عملیات ناموفق بود."), "error");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );

  return { mutate, busy };
}

/** Latest-value guard for async effects. */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
