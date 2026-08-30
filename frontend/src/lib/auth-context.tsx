"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { apiFetch } from "./api-client";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  is_admin: boolean;
  is_active: boolean;
  role_id: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch("/auth/me", { method: "GET" });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
        setUser(null);
      } else {
        setUser(await res.json());
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "access_token") void refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("auth-changed", () => void refresh());
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth-changed", () => void refresh());
    };
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      await apiFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {}
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("admin_authorization");
    setUser(null);
    window.dispatchEvent(new Event("auth-changed"));
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    isAdmin: Boolean(user?.is_admin),
    isAuthenticated: Boolean(user),
    refresh,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
