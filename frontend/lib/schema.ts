import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

interface ProductImage {
  id: string;
  url: string;
  alt: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number;
  discount_percentage?: number;
  image_url: string | null;
  images?: ProductImage[];
  rating?: number;
  review_count?: number;
}

interface ProductSchema {
  "@context": string;
  "@type": "Product";
  name: string;
  image: string[];
  description: string;
  offers: {
    "@type": "Offer";
    price: number;
    priceCurrency: string;
    availability: string;
    url: string;
    seller: {
      "@type": "Organization";
      name: string;
    };
  };
}

export function generateProductSchema(product: Product): ProductSchema {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://talar-tala.ir";

  const imageUrls = product.image_url
    ? [baseUrl + product.image_url]
    : [];

  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: imageUrls,
    description: product.name,
    offers: {
      "@type": "Offer",
      price: product.price.toString(),
      priceCurrency: "IRR",
      availability: "https://schema.org/InStock",
      url: `${baseUrl}/product/${product.slug}`,
      seller: {
        "@type": "Organization",
        name: "تالار طلا",
      },
    },
  };
}

interface ArticleSchema {
  "@context": string;
  "@type": "Article";
  headline: string;
  image: string[];
  datePublished: string;
  dateModified: string;
  author: {
    "@type": "Person";
    name: string;
  };
}

interface BreadcrumbListSchema {
  "@context": string;
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

interface WebPageSchema {
  "@context": string;
  "@type": "WebPage";
  name: string;
  description: string;
  inLanguage: string;
}

export function generateArticleSchema(article: {
  id: string;
  title: string;
  content: string;
  date: Date;
  author: string;
}): ArticleSchema {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://talar-tala.ir";

  return {
    "@context": "https://schema.org/",
    "@type": "Article",
    headline: article.title,
    image: [`${baseUrl}/blog/${article.id}/thumbnail.jpg`],
    datePublished: article.date.toISOString(),
    dateModified: article.date.toISOString(),
    author: {
      "@type": "Person",
      name: article.author,
    },
  };
}

export function generateBreadcrumbSchema(items: Array<{ label: string; href: string }>): BreadcrumbListSchema {
  return {
    "@context": "https://schema.org/",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://talar-tala.ir"}${item.href}`,
    })),
  };
}

export function generateWebPageSchema() {
  return {
    "@context": "https://schema.org/",
    "@type": "WebPage",
    name: siteConfig.title,
    description: siteConfig.description,
    inLanguage: "fa",
  };
}

interface OrganizationSchema {
  "@context": string;
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  sameAs?: string[];
  contactPoint?: {
    "@type": "ContactPoint";
    email: string;
    telephone: string;
    contactType: "sales";
    areaServed: "IR";
    availableLanguage: "fa-IR";
  };
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org/",
    "@type": "Organization",
    name: siteConfig.title,
    url: siteConfig.url,
    logo: siteConfig.images[0],
    contactPoint: {
      "@type": "ContactPoint",
      email: "info@talar-tala.ir",
      telephone: "+98-21-12345678",
      contactType: "sales",
      areaServed: "IR",
      availableLanguage: "fa-IR",
    },
  };
}

const siteConfig = {
  title: "تالار طلا | فروشگاه آنلاین",
  description: "فروشگاه آنلاین تالار طلا با گارانتی اصالت کالا و ارسال سریع",
  url: "https://talar-tala.ir",
  images: [
    "https://talar-tala.ir/og-image.jpg",
  ],
};