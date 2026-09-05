"use client";

import React from "react";
import { LoadingSpinner } from "./skeleton";

interface LoadingProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
}

export const Loading = ({
  text = "در حال پردازش...",
  size = "md",
  fullPage = false,
}: LoadingProps) => {
  if (fullPage) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-char/5">
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-4" size={size} />
          <p className="text-sm font-medium text-char-soft">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-8 items-center justify-center space-x-2">
      <LoadingSpinner size={size} />
      {text && (
        <p className="text-sm text-char-soft">{text}</p>
      )}
    </div>
  );
};