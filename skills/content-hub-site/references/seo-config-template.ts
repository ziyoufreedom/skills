/**
 * src/lib/seo-config.ts
 *
 * SINGLE SOURCE OF TRUTH for per-route SEO metadata.
 * Must be pure data — no React, no DOM, no browser APIs.
 *
 * Used by:
 * - React components for client-side context (if needed)
 * - Duplicated in scripts/prerender.mjs for build-time HTML generation
 *
 * Replace all {PLACEHOLDERS} with actual data from project.json / site-config.ts.
 */

import { SITE } from "./site-config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SEOData = {
  title: string;
  description: string;
  robots?: string;
  jsonLd: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// Schema builder helpers
// ---------------------------------------------------------------------------

export function buildWebSiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.domain || "https://www.example.com",
    description: SITE.tagline,
    publisher: {
      "@type": "Organization",
      name: SITE.name,
    },
  };
}

export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.domain || "https://www.example.com",
    description: SITE.tagline,
  };
}

export function buildArticleSchema(
  headline: string,
  slug: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    url: slug,
    author: { "@type": "Organization", name: SITE.name },
    publisher: { "@type": "Organization", name: SITE.name },
  };
}

export function buildCollectionSchema(
  name: string,
  slug: string,
  description: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: slug,
    description,
    publisher: { "@type": "Organization", name: SITE.name },
  };
}

export function buildBreadcrumbSchema(
  items: { name: string; url: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ---------------------------------------------------------------------------
// Route SEO definitions
//
// Each entry:
//   key   = exact route path (must match React Router)
//   value = { title, description, robots?, jsonLd }
//
// Title format: "{Page Topic} | {Site Name}"
// Description: 120-160 chars, includes target keyword + value proposition
// ---------------------------------------------------------------------------

export const routeSEO: Record<string, SEOData> = {
  "/": {
    title: `${SITE.name} | ${SITE.tagline}`,
    description:
      "{150-char description with primary keyword and value proposition}",
    jsonLd: buildWebSiteSchema(),
  },

  // --- Article pages ---
  "/{topic-1-slug}": {
    title: `{Topic 1}: {Subtitle} | ${SITE.name}`,
    description: "{150-char description for topic 1}",
    jsonLd: buildArticleSchema("{Topic 1 Headline}", "/{topic-1-slug}"),
  },
  "/{topic-2-slug}": {
    title: `{Topic 2}: {Subtitle} | ${SITE.name}`,
    description: "{150-char description for topic 2}",
    jsonLd: buildArticleSchema("{Topic 2 Headline}", "/{topic-2-slug}"),
  },

  // --- Catalog pages ---
  "/use-cases": {
    title: `{Niche} Use Cases | ${SITE.name}`,
    description: "{150-char description for use cases page}",
    jsonLd: buildCollectionSchema("Use Cases", "/use-cases", "{description}"),
  },
  "/comparisons": {
    title: `{Niche} Comparisons | ${SITE.name}`,
    description: "{150-char description for comparisons page}",
    jsonLd: buildCollectionSchema(
      "Comparisons",
      "/comparisons",
      "{description}"
    ),
  },
  "/resources": {
    title: `{Niche} Resources | ${SITE.name}`,
    description: "{150-char description for resources page}",
    jsonLd: buildCollectionSchema("Resources", "/resources", "{description}"),
  },
};
