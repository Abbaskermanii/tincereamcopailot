"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/loading";

interface CategoryProps {
  name: string;
  slug: string;
  image: string | null;
  productCount?: number;
  isLoading?: boolean;
}

export function CategoryCard({
  name,
  slug,
  image,
  productCount,
  isLoading = false,
}: CategoryProps) {
  return (
    <Link
      href={`/category/${slug}`}
      className="group relative overflow-hidden rounded-xl bg-char/5"
    >
      {isLoading ? (
        <div className="aspect-square">
          <Skeleton className="h-full w-full" />
        </div>
      ) : image ? (
        <div className="relative aspect-square overflow-hidden">
          <img
            src={image}
            alt={name}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="aspect-square flex items-center justify-center bg-char/10">
          <span className="text-3xl">📦</span>
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-semibold">{name}</h3>
        {productCount !== undefined && (
          <p className="text-white/80 text-sm">{productCount} محصول</p>
        )}
      </div>
    </Link>
  );
}