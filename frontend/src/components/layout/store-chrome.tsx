"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Renders the storefront header/footer everywhere EXCEPT the admin panel,
 * which has its own chrome (sidebar + topbar).
 *
 * Header/Footer are passed as props from the root server layout — server
 * components must never be imported directly into this client boundary.
 */
export function StoreChrome({
  header,
  children,
  footer,
}: {
  header: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      {header}
      <main id="main">{children}</main>
      {footer}
    </>
  );
}
