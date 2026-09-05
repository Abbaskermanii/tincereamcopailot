import { cn } from "@/lib/utils";

interface EditorialHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  variant?: "default" | "centered" | "minimal" | "bold";
  className?: string;
}

export function EditorialHeading({
  eyebrow,
  title,
  subtitle,
  action,
  variant = "default",
  className,
}: EditorialHeadingProps) {
  if (variant === "centered") {
    return (
      <div className={cn("mb-8 text-center md:mb-10", className)}>
        {eyebrow && (
          <span className="mb-2 inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-kiln-clay dark:text-clay-soft md:text-xs">
            {eyebrow}
          </span>
        )}
        <h2 className="text-2xl font-extrabold tracking-tight text-char md:text-3xl lg:text-[2rem] dark:text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-char-soft dark:text-white/50 md:text-base">
            {subtitle}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={cn("mb-6 flex items-baseline justify-between gap-4 md:mb-8", className)}>
        <div className="flex items-baseline gap-3">
          {eyebrow && (
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-kiln-clay dark:text-clay-soft md:text-xs">
              {eyebrow}
            </span>
          )}
          <h2 className="text-xl font-extrabold text-char dark:text-white md:text-2xl">
            {title}
          </h2>
        </div>
        {action}
      </div>
    );
  }

  if (variant === "bold") {
    return (
      <div className={cn("mb-8 md:mb-10", className)}>
        {eyebrow && (
          <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.25em] text-kiln-clay dark:text-clay-soft md:text-xs">
            {eyebrow}
          </span>
        )}
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-char dark:text-white md:text-4xl lg:text-[2.5rem]">
            {title}
          </h2>
          {action}
        </div>
        {subtitle && (
          <p className="mt-2 max-w-xl text-sm leading-6 text-char-soft dark:text-white/50 md:text-base">
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  // default
  return (
    <div className={cn("mb-8 md:mb-10", className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-kiln-clay dark:text-clay-soft md:text-xs">
              {eyebrow}
            </span>
          )}
          <h2 className="text-2xl font-extrabold tracking-tight text-char dark:text-white md:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1.5 text-sm text-char-soft dark:text-white/50">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}
