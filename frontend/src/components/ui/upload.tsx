"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface UploadProps {
  value?: string | null;
  onFileChange: (value: string | null) => void;
  accept?: { [key: string]: string[] };
  maxSize?: number;
}

export function UploadComponent({
  value,
  onFileChange,
  accept = {
    "image/*": ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
  },
  maxSize = 5 * 1024 * 1024,
}: UploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        const maxSizeError = fileRejections.find((f) => f.errors?.find((e) => e.code === "file-too-large"));
        if (maxSizeError) {
          toast.error("فایل انتخاب شده بیش از حد مجاز است", {
            description: `حداکثر حجم مجاز: ${(maxSize / 1024 / 1024).toFixed(2)} MB`,
          });
        }
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        onFileChange(result);
        toast.success("تصویر با موفقیت بارگذاری شد");
      };

      reader.readAsDataURL(file);
    },
    [maxSize, onFileChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    disabled: !!value,
  });

  return (
    <div className="w-full">
      {!preview ? (
        <div
          {...getRootProps()}
          className={`
            relative flex flex-col items-center justify-center
            min-h-[200px] min-w-[200px] rounded-xl border-2 border-dashed
            cursor-pointer transition-all duration-200
            ${isDragActive ? "border-lajvard bg-lajvard-soft/10" : "border-char/15 bg-surface hover:border-lajvard/50 hover:bg-char/5 dark:border-white/10 dark:hover:border-lajvard-soft/50"}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="rounded-full bg-lajvard-soft/20 p-4 dark:bg-lajvard-soft/10">
              <ImageIcon className="h-8 w-8 text-lajvard dark:text-lajvard-soft" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink dark:text-white">تصویر را بکشید و رها کنید</p>
              <p className="text-xs text-char-soft dark:text-white/60 mt-1">یا کلیک کنید برای انتخاب فایل</p>
            </div>
            <p className="text-xs text-char-soft dark:text-white/60">JPG, PNG, WEBP, GIF, SVG</p>
            <p className="text-xs text-char-soft dark:text-white/60">{(maxSize / 1024 / 1024).toFixed(2)} MB حداکثر</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="aspect-video overflow-hidden rounded-xl bg-surface border border-char/15 dark:border-white/10">
            <Image src={preview} alt="Preview" fill className="object-cover" unoptimized />
          </div>
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              onFileChange(null);
            }}
            className="absolute top-2 right-2 rounded-lg bg-black/50 backdrop-blur-sm p-2 text-white hover:bg-black/70 transition-colors dark:bg-white/50 dark:text-ink dark:hover:bg-white/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
