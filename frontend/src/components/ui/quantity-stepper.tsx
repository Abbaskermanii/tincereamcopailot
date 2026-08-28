"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "./button";
import { toPersianDigits } from "@/lib/format";

export function QuantityStepper({
  value,
  onChange,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-char/15 p-1 dark:border-white/20">
      <Button
        variant="ghost"
        size="sm"
        aria-label="افزایش تعداد"
        className="!px-2"
        onClick={() => onChange(Math.min(value + 1, max))}
        disabled={value >= max}
      >
        <Plus size={16} />
      </Button>
      <span className="w-8 text-center font-bold" aria-live="polite">
        {toPersianDigits(value)}
      </span>
      <Button
        variant="ghost"
        size="sm"
        aria-label="کاهش تعداد"
        className="!px-2"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
      >
        <Minus size={16} />
      </Button>
    </div>
  );
}
