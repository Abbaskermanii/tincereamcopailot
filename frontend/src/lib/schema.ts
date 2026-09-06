/** JSON-LD structured data generators for SEO */

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const STORE_NAME = "آنیمور سرام";

export interface ProductSchema {
  name: string;
  description?: string;
  image?: string;
  price: number;
  currency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  sku?: string;
  brand?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  url?: string;
}

export function productSchema(p: ProductSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.image ? (p.image.startsWith("http") ? p.image : `${SITE}${p.image}`) : undefined,
    sku: p.sku,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    category: p.category,
    offers: {
      "@type": "Offer",
      url: p.url ?? `${SITE}/product/${p.sku ?? ""}`,
      priceCurrency: p.currency ?? "IRR",
      price: p.price,
      availability: `https://schema.org/${p.availability ?? "InStock"}`,
      seller: { "@type": "Organization", name: STORE_NAME },
    },
    aggregateRating: p.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: p.rating,
          reviewCount: p.reviewCount ?? 1,
        }
      : undefined,
  };
}

export interface ArticleSchema {
  title: string;
  description?: string;
  image?: string;
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
  slug: string;
}

export function articleSchema(a: ArticleSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    image: a.image ? (a.image.startsWith("http") ? a.image : `${SITE}${a.image}`) : undefined,
    author: a.author ? { "@type": "Person", name: a.author } : { "@type": "Organization", name: STORE_NAME },
    publisher: {
      "@type": "Organization",
      name: STORE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE}/logo.png` },
    },
    datePublished: a.publishedAt,
    dateModified: a.updatedAt ?? a.publishedAt,
    url: `${SITE}/blog/${a.slug}`,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/blog/${a.slug}` },
  };
}

export interface OrganizationSchema {
  name?: string;
  url?: string;
  logo?: string;
  socialLinks?: string[];
}

export function organizationSchema(o: OrganizationSchema = {}): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: o.name ?? STORE_NAME,
    url: o.url ?? SITE,
    logo: o.logo ? (o.logo.startsWith("http") ? o.logo : `${SITE}${o.logo}`) : `${SITE}/logo.png`,
    sameAs: o.socialLinks ?? [],
  };
}

export interface BreadcrumbSchema {
  items: Array<{ name: string; url: string }>;
}

export function breadcrumbSchema(b: BreadcrumbSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: b.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE}${item.url}`,
    })),
  };
}

export interface WebPageSchema {
  title: string;
  description?: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
}

export function webPageSchema(wp: WebPageSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: wp.title,
    description: wp.description,
    url: wp.url.startsWith("http") ? wp.url : `${SITE}${wp.url}`,
    datePublished: wp.datePublished,
    dateModified: wp.dateModified,
  };
}

export interface FAQSchema {
  items: Array<{ question: string; answer: string }>;
}

export function faqSchema(f: FAQSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: f.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
