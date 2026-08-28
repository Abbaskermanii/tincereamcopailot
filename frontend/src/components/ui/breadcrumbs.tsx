import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function Breadcrumbs({
  items,
}: {
  items: { name: string; href?: string }[];
}) {
  return (
    <nav aria-label="مسیر صفحه" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-char-soft dark:text-ink-soft">
        {items.map((item, i) => (
          <li key={item.name} className="flex items-center gap-1">
            {item.href ? (
              <Link href={item.href} className="hover:text-lajvard dark:hover:text-lajvard-soft">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-char dark:text-ink">
                {item.name}
              </span>
            )}
            {i < items.length - 1 && <ChevronLeft size={14} aria-hidden />}
          </li>
        ))}
      </ol>
    </nav>
  );
}
