"use client";

import { useEffect } from "react";
import { pushRecentlyViewed } from "@/lib/local-store";

export function TrackRecentlyViewed({
  slug,
  name,
  price,
  imageUrl,
}: {
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
}) {
  useEffect(() => {
    pushRecentlyViewed({ slug, name, price, imageUrl });
  }, [slug, name, price, imageUrl]);
  return null;
}
