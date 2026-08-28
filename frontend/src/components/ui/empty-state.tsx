import { PackageOpen } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glaze-edge rounded-wobble border border-dashed border-char/20 px-6 py-16 text-center dark:border-white/20">
      <PackageOpen size={40} className="mx-auto mb-4 text-char-soft/60 dark:text-ink-soft/70" />
      <h3 className="text-lg font-bold">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm text-char-soft dark:text-ink-soft">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
