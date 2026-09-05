import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-xl bg-char/8 dark:bg-white/10", className)}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="glaze-edge overflow-hidden rounded-wobble bg-surface">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2.5 p-3.5">
        <Skeleton className="h-4 w-16 rounded-md" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
        <div className="flex items-end justify-between pt-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export const ShimmerCard = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`w-full rounded-xl bg-char/5 ${className}`}>
      <div className="h-48 w-full rounded-t-xl bg-char/10" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded bg-char/10" />
        <div className="h-4 w-1/2 rounded bg-char/10" />
      </div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 3, cols = 4 }: { rows?: number; cols?: number }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton width="3rem" height="3rem" variant="circle" />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height="1.5rem" />
            <Skeleton width="40%" height="1rem" />
            <Skeleton width="80%" height="1rem" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const LoadingSpinner = ({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={className}>
      <svg
        className={`animate-spin ${sizeClasses[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

export const FullPageLoader = ({ text = "در حال بارگذاری..." }: { text?: string }) => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-char/5">
      <div className="text-center">
        <LoadingSpinner className="mx-auto mb-4" size="lg" />
        <p className="text-sm font-medium text-char-soft">{text}</p>
      </div>
    </div>
  );
};
