"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface BreadcrumbNavItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbNavProps {
  items: BreadcrumbNavItem[];
  className?: string;
}

export function BreadcrumbNav({ items, className = "" }: BreadcrumbNavProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="breadcrumb" className={`mb-6 ${className}`}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-char-soft dark:text-ink-soft">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <li aria-hidden="true">
                  <ChevronLeft className="h-3.5 w-3.5 text-char-soft/50 dark:text-ink-soft/50" />
                </li>
              )}
              <li>
                {item.href && !isLast ? (
                  <Link href={item.href} className="hover:text-lajvard dark:hover:text-lajvard-soft transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className="font-medium text-char dark:text-white">{item.label}</span>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
