/**
 * SEO / Schema.org JSON-LD helpers for local-biz-astro projects.
 *
 * Copy to src/lib/seo/schemas.ts. Pages import the helpers they need,
 * build a `jsonLd` array, and pass it to <SiteLayout jsonLd={...}>.
 * SiteLayout emits one @graph block combining everything.
 *
 * Pure TypeScript — no Astro APIs — so it's testable and importable
 * from anywhere (pages, scripts, even Node).
 */

// -------------------------------------------------------------------
// Domain constant — keep in sync with astro.config.mjs `site` field
// -------------------------------------------------------------------
export const DOMAIN = "https://www.example.com"; // UPDATE per client

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------
export interface PostalAddress {
  street: string;
  city: string;
  region: string;        // e.g., "OR", "CA"
  postalCode: string;
  country: string;       // e.g., "US"
}

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface OpeningHours {
  [day: string]: string; // e.g., { Monday: "09:00-19:00", Sunday: "Closed" }
}

export interface ReviewHighlight {
  author: string;
  rating: number;        // 1–5
  text: string;
  date: string;          // ISO YYYY-MM-DD
}

export interface AggregateRating {
  value: number;
  count: number;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

// -------------------------------------------------------------------
// Publisher / Organization — used site-wide as the Article.publisher
// and also emitted standalone on the home page so Google can build
// a full Knowledge Graph entity.
// -------------------------------------------------------------------
export interface OrganizationInput {
  name: string;
  legalName?: string;
  alternateName?: string;
  description?: string;
  logoPath?: string;       // root-relative, e.g., "/logo.png"
  foundingDate?: string;   // YYYY
  address?: PostalAddress;
  sameAs?: string[];       // canonical identity URLs (official site, LinkedIn, Wikidata)
  areaServed?: string;
  knowsAbout?: string[];
  email?: string;
  phone?: string;
}

export function makeOrganization(o: OrganizationInput): Record<string, unknown> {
  return {
    "@type": "Organization",
    "@id": `${DOMAIN}#org`,
    name: o.name,
    ...(o.legalName ? { legalName: o.legalName } : {}),
    ...(o.alternateName ? { alternateName: o.alternateName } : {}),
    ...(o.description ? { description: o.description } : {}),
    url: `${DOMAIN}/`,
    ...(o.logoPath ? { logo: { "@type": "ImageObject", url: `${DOMAIN}${o.logoPath}` } } : {}),
    ...(o.foundingDate ? { foundingDate: o.foundingDate } : {}),
    ...(o.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: o.address.street,
            addressLocality: o.address.city,
            addressRegion: o.address.region,
            postalCode: o.address.postalCode,
            addressCountry: o.address.country,
          },
        }
      : {}),
    ...(o.phone ? { telephone: o.phone } : {}),
    ...(o.email ? { email: o.email } : {}),
    ...(o.sameAs && o.sameAs.length > 0 ? { sameAs: o.sameAs } : {}),
    ...(o.areaServed ? { areaServed: o.areaServed } : {}),
    ...(o.knowsAbout && o.knowsAbout.length > 0 ? { knowsAbout: o.knowsAbout } : {}),
  };
}

// -------------------------------------------------------------------
// LocalBusiness — the single most impactful schema for map-pack
// ranking. Use a subtype when possible (DaySpa, MassageTherapy,
// BeautySalon, HairSalon, MedicalBusiness, Physiotherapy, ...).
// One emission per location.
// -------------------------------------------------------------------
export type LocalBusinessType =
  | "LocalBusiness"
  | "DaySpa"
  | "BeautySalon"
  | "HairSalon"
  | "NailSalon"
  | "MassageTherapy"
  | "Physiotherapy"
  | "MedicalClinic"
  | "DentistOffice"
  | "HealthClub";

export interface LocalBusinessInput {
  type: LocalBusinessType;
  id: string;              // absolute @id, e.g., `${DOMAIN}/locations/tigard#localbusiness`
  name: string;
  url: string;             // root-relative path, e.g., "/locations/tigard"
  image?: string;          // root-relative image path
  address: PostalAddress;
  phone: string;
  email?: string;
  geo?: GeoCoordinates;
  hours?: OpeningHours;
  priceRange?: string;     // "$", "$$", "$$$"
  sameAs?: string[];
  areaServed?: string[];
  aggregateRating?: AggregateRating;
  reviews?: ReviewHighlight[];
}

// Schema.org uses 3-letter day codes for OpeningHoursSpecification
const DAY_CODE: Record<string, string> = {
  Monday: "Mo", Tuesday: "Tu", Wednesday: "We", Thursday: "Th",
  Friday: "Fr", Saturday: "Sa", Sunday: "Su",
};

function toOpeningHoursSpec(hours: OpeningHours) {
  return Object.entries(hours)
    .filter(([, v]) => v && v.toLowerCase() !== "closed")
    .map(([day, range]) => {
      const [opens, closes] = range.split("-").map((s) => s.trim());
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${day}`,
        opens,
        closes,
      };
    });
}

export function makeLocalBusiness(b: LocalBusinessInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": b.type,
    "@id": b.id,
    name: b.name,
    url: `${DOMAIN}${b.url}`,
    ...(b.image ? { image: `${DOMAIN}${b.image}` } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: b.address.street,
      addressLocality: b.address.city,
      addressRegion: b.address.region,
      postalCode: b.address.postalCode,
      addressCountry: b.address.country,
    },
    telephone: b.phone,
    ...(b.email ? { email: b.email } : {}),
    ...(b.geo
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: b.geo.lat,
            longitude: b.geo.lng,
          },
        }
      : {}),
    ...(b.hours ? { openingHoursSpecification: toOpeningHoursSpec(b.hours) } : {}),
    ...(b.priceRange ? { priceRange: b.priceRange } : {}),
    ...(b.sameAs && b.sameAs.length > 0 ? { sameAs: b.sameAs } : {}),
    ...(b.areaServed && b.areaServed.length > 0
      ? { areaServed: b.areaServed.map((a) => ({ "@type": "City", name: a })) }
      : {}),
    ...(b.aggregateRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: b.aggregateRating.value,
            reviewCount: b.aggregateRating.count,
          },
        }
      : {}),
    ...(b.reviews && b.reviews.length > 0
      ? {
          review: b.reviews.map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.author },
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
            reviewBody: r.text,
            datePublished: r.date,
          })),
        }
      : {}),
  };
}

// -------------------------------------------------------------------
// Service — for /services/[slug] pages
// -------------------------------------------------------------------
export interface ServiceInput {
  name: string;
  description: string;
  url: string;             // root-relative path
  providerName: string;    // the business name
  areaServed: string;      // city or region
  image?: string;
  price?: number;          // omit when content_restrictions.no_prices is set
  priceCurrency?: string;
}

export function makeService(s: ServiceInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.name,
    description: s.description,
    url: `${DOMAIN}${s.url}`,
    ...(s.image ? { image: `${DOMAIN}${s.image}` } : {}),
    provider: { "@type": "Organization", "@id": `${DOMAIN}#org`, name: s.providerName },
    areaServed: { "@type": "City", name: s.areaServed },
    ...(s.price !== undefined
      ? {
          offers: {
            "@type": "Offer",
            price: String(s.price),
            priceCurrency: s.priceCurrency ?? "USD",
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}

// -------------------------------------------------------------------
// Article — for /guides/[slug] evergreen content
// -------------------------------------------------------------------
export interface ArticleInput {
  headline: string;
  description: string;
  slug: string;            // root-relative, e.g., "/guides/best-massage-newberg"
  image: string;
  authorName: string;      // or author @id if you have Person nodes
  published: string;       // ISO YYYY-MM-DD
  modified: string;
  section: string;
  wordCount?: number;
}

export function makeArticle(a: ArticleInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.headline,
    description: a.description,
    image: [`${DOMAIN}${a.image}`],
    url: `${DOMAIN}${a.slug}`,
    datePublished: a.published,
    dateModified: a.modified,
    author: { "@type": "Person", name: a.authorName },
    publisher: { "@type": "Organization", "@id": `${DOMAIN}#org` },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${DOMAIN}${a.slug}` },
    articleSection: a.section,
    inLanguage: "en-US",
    isAccessibleForFree: true,
    ...(a.wordCount ? { wordCount: a.wordCount } : {}),
  };
}

// -------------------------------------------------------------------
// FAQPage — wherever the page has an accordion of Q&A.
// Answer text must be plain (strip HTML before passing in).
// -------------------------------------------------------------------
export function makeFAQPage(faq: FAQItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer.replace(/<[^>]+>/g, "").trim(),
      },
    })),
  };
}

// -------------------------------------------------------------------
// BreadcrumbList — every inner page
// -------------------------------------------------------------------
export function makeBreadcrumb(crumbs: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${DOMAIN}${c.url}`,
    })),
  };
}

// -------------------------------------------------------------------
// WebSite — home page; optional SearchAction only when there's a real
// site-search endpoint. If you don't have /?q=, skip the action —
// Google's Rich Results Test will flag fake sitelink-search-box.
// -------------------------------------------------------------------
export function makeWebSite(name: string, description: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${DOMAIN}#site`,
    url: `${DOMAIN}/`,
    name,
    description,
    inLanguage: "en-US",
    publisher: { "@type": "Organization", "@id": `${DOMAIN}#org` },
  };
}

// -------------------------------------------------------------------
// CollectionPage + ItemList — for /services, /locations, /guides hubs
// -------------------------------------------------------------------
export function makeCollectionPage(
  name: string,
  url: string,
  description: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: `${DOMAIN}${url}`,
    description,
    inLanguage: "en-US",
    isPartOf: { "@type": "WebSite", "@id": `${DOMAIN}#site` },
    publisher: { "@type": "Organization", "@id": `${DOMAIN}#org` },
  };
}

export function makeItemList(
  pageUrl: string,
  items: { name: string; url: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${DOMAIN}${pageUrl}#list`,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${DOMAIN}${it.url}`,
      name: it.name,
    })),
  };
}

// -------------------------------------------------------------------
// Usage example (from a location page):
//
//   const jsonLd = [
//     makeLocalBusiness({ type: "MassageTherapy", ... }),
//     makeBreadcrumb([
//       { name: "Home", url: "/" },
//       { name: "Locations", url: "/locations" },
//       { name: "Tigard", url: "/locations/tigard" },
//     ]),
//     makeFAQPage(content.faq),
//   ];
//
//   <SiteLayout jsonLd={jsonLd} ...>
//
// SiteLayout wraps all of these in a single @graph block so Google
// sees a coherent entity graph (Organization ← LocalBusiness ← Article
// ← BreadcrumbList) with deduplicated @id references.
// -------------------------------------------------------------------
