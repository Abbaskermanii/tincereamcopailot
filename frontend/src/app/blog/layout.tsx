import type { ReactNode } from "react";

import { ForceLight } from "@/components/blog/force-light";

/** Magazine section: always light, always readable. */
export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ForceLight />
      {children}
    </>
  );
}
