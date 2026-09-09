"use client";

import React, { useState } from "react";

/**
 * Hook to manage loading states with skeleton UI
 */
export function useSkeleton(showInitialLoading = true) {
  const [isLoading, setIsLoading] = useState(showInitialLoading);

  const show = () => setIsLoading(true);
  const hide = () => setIsLoading(false);

  return {
    isLoading,
    show,
    hide,
  };
}

/**
 * Component for rendering skeleton while data is loading
 */
export const WithSkeleton = ({
  isLoading,
  children,
  skeletonTemplate,
  className = "",
}: {
  isLoading: boolean;
  children: React.ReactNode;
  skeletonTemplate: React.ReactNode;
  className?: string;
}) => {
  if (isLoading) {
    return <div className={className}>{skeletonTemplate}</div>;
  }

  return <div className={className}>{children}</div>;
};