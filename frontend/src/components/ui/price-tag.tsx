import { cn } from "@/lib/utils";
import { faNum } from "@/lib/format";

export function PriceTag({
  price,
  compareAtPrice,
  size = "md",
  className,
}: {
  price: number;
  compareAtPrice?: number | null;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span
        className={cn(
          "font-bold text-lajvard dark:text-lajvard-soft",
          size === "lg" ? "text-2xl" : "text-lg",
        )}
      >
        {faNum(price)}
        <span className="mr-1 text-xs font-normal text-char-soft dark:text-ink-soft">تومان</span>
      </span>
      {compareAtPrice ? (
        <s className="text-sm text-char-soft/70 dark:text-ink-soft/70">{faNum(compareAtPrice)}</s>
      ) : null}
    </div>
  );
}
