"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useToast } from "@/components/ui/toast-provider";
import { mediaUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

const ACCEPTED = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

interface MediaUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Upload endpoint returning { url }. Defaults to /admin/media/upload. */
  uploadPath?: string;
  label?: string;
  aspect?: "square" | "wide";
  disabled?: boolean;
}

/** Single reusable image uploader for the whole admin panel:
 * pick → validate → upload → preview; replace or remove in one click. */
export function MediaUploader({
  value,
  onChange,
  uploadPath = "/admin/media/upload",
  label = "تصویر",
  aspect = "square",
  disabled,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const upload = async (file: File) => {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError("فقط JPG، PNG یا WebP مجاز است.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("حجم فایل باید کمتر از ۵ مگابایت باشد.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}${uploadPath}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "آپلود ناموفق بود.");
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      onChange(data.url);
      toast("تصویر آپلود شد.", "success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در آپلود");
    } finally {
      setUploading(false);
    }
  };

  const shown = preview ?? (value ? mediaUrl(value) : null);
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink-soft">{label}</p>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-dashed border-char/25 bg-slip dark:border-white/20 dark:bg-black/25",
          aspect === "square" ? "h-32 w-32" : "h-40 w-full",
          error && "border-clay",
        )}
      >
        {shown ? (
          <>
            <Image src={shown} alt={label} fill sizes="128px" className="object-cover" unoptimized={shown.startsWith("blob:")} />
            <button
              type="button"
              onClick={() => { if (preview) URL.revokeObjectURL(preview); setPreview(null); onChange(null); }}
              className="absolute left-2 top-2 min-h-[32px] min-w-[32px] rounded-full bg-black/50 text-white"
              aria-label="حذف تصویر"
            >
              ×
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-ink-soft hover:text-ink disabled:opacity-50"
          >
            <span className="text-2xl">＋</span>
            <span className="text-xs">{uploading ? "در حال آپلود…" : "انتخاب تصویر"}</span>
          </button>
        )}
        {shown && uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">در حال آپلود…</div>
        )}
      </div>
      {shown && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="min-h-[36px] rounded-lg border border-char/20 px-3 text-xs hover:bg-char/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
          >
            {uploading ? "…" : "تغییر"}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-clay">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
