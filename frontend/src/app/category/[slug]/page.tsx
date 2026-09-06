import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

interface Props {
  params: { slug: string };
}

/**
 * Category landing pages were consolidated into the shop's filtered view.
 * Old /category/<slug> URLs permanently redirect (308) to /shop?category=<slug>
 * so already-indexed links keep their SEO value.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { alternates: { canonical: `/shop?category=${params.slug}` } };
}

export default function CategoryRedirectPage({ params }: Props) {
  permanentRedirect(`/shop?category=${params.slug}`);
}
