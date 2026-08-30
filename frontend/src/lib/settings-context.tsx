/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiJson } from "@/lib/api-client";

type SettingValue = string | number | boolean | null;

type Setting = {
  key: string;
  value: string;
  value_type: "string" | "integer" | "boolean" | "json";
};

type SettingsContextValue = {
  settings: Record<string, SettingValue>;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setSetting: (key: string, value: string) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<Record<string, SettingValue>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: Setting[] = await apiJson<Setting[]>("/settings");
      if (response && response.length > 0) {
        const record: Record<string, SettingValue> = {};
        response.forEach((row) => {
          let parsed: SettingValue = row.value;
          if (row.value_type === "integer") {
            parsed = Number(row.value);
          } else if (row.value_type === "boolean") {
            parsed = row.value === "true";
          } else if (row.value_type === "json") {
            try {
              parsed = JSON.parse(row.value);
            } catch {
              parsed = row.value;
            }
          }
          record[row.key] = parsed;
        });
        setSettings(record);
      }
    } catch (e) {
      setError((e as Error).message ?? "خطا در بارگذاری تنظیمات");
    } finally {
      setLoading(false);
    }
  };

  const setSetting = async (key: string, value: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiJson("/admin/settings", {
        method: "POST",
        body: JSON.stringify({ key, value }),
        credentials: "include",
      });
      // Update local state immediately
      setSettings((prev) => ({ ...prev, [key]: value }));
      await reload();
    } catch (e) {
      setError((e as Error).message ?? "خطا در ذخیره تنظیمات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, error, reload, setSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
};