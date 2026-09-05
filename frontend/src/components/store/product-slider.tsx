"use client";

import React from "react";
import { SmartCarousel } from "@/components/ui/smart-carousel";

interface ProductSliderProps {
  children: React.ReactNode;
  className?: string;
}

export function ProductSlider({ children, className }: ProductSliderProps) {
  const items = React.Children.toArray(children);
  if (items.length === 0) return null;

  return (
    <SmartCarousel className={className} minCardWidth={240} gap={12}>
      {items}
    </SmartCarousel>
  );
}
