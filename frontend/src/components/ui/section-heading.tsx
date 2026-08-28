import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="text-2xl font-extrabold md:text-3xl">{title}</h2>
        {subtitle && (
          <p className="mt-2 text-sm text-char-soft dark:text-ink-soft">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
