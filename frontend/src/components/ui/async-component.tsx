"use client";

import React from "react";
import { useLoading } from "@/hooks/use-loading";
import { LoadingSpinner } from "@/components/ui/loading";

interface AsyncComponentProps<T> {
  fetchFn: () => Promise<T>;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

interface State<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export function AsyncComponent<T>({
  fetchFn,
  fallback,
  loadingComponent,
  errorComponent,
}: AsyncComponentProps<T>) {
  const { data, isLoading, error } = useLoading(fetchFn);

  if (isLoading) {
    return loadingComponent || <LoadingSpinner />;
  }

  if (error) {
    return (
      errorComponent || (
        <div className="text-center">
          <p className="text-red-600">{error.message}</p>
        </div>
      )
    );
  }

  if (!data) {
    return fallback || <LoadingSpinner />;
  }

  return <>{data}</>;
}