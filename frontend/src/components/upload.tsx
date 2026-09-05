"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/api";

interface UploadProps {
  onSuccess: (url: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function Upload({ onSuccess, onError, disabled = false }: UploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    apiFetch("/avatar/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    })
      .then((res) => {
        if (res.ok) {
          res.json().then((data) => {
            onSuccess(data.url);
          });
        } else {
          res.json().then((data) => {
            onError(data.message || "Upload failed");
          });
        }
      })
      .catch((err) => {
        onError(getErrorMessage(err));
      })
      .finally(() => setUploading(false));
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleChange}
        disabled={disabled}
        className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-b file:py-2 file:px-4 file:bg-lajvard file:text-lajvard-hover"
        aria-label="Upload image"
      />
      {uploading && <p className="mt-2 text-sm text-gray-500">در حال آپLOAD...</p>}
    </div>
  );
}