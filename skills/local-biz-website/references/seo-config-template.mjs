/**
 * src/lib/seo-config.ts (template — rename to .ts in actual project)
 *
 * SINGLE SOURCE OF TRUTH for all page SEO data.
 * Must be pure data — no React, no DOM, no browser APIs.
 *
 * Used by React components for client-side context.
 * The prerender script (scripts/prerender.mjs) duplicates this data
 * because it runs in plain Node.js and cannot import TypeScript.
 *
 * Replace all {PLACEHOLDERS} with actual business data from project.json.
 */

export type SEOData = {
  title: string
  description: string
  h1: string
  jsonLd: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Business constants — from project.json
// ---------------------------------------------------------------------------

const BUSINESS = {
  name: '{Business Name}',
  phone: '{phone}',
  email: '{email}',
  url: '', // set when domain is live
  address: {
    streetAddress: '{street}',
    addressLocality: '{city}',
    addressRegion: '{state}',
    postalCode: '{zip}',
    addressCountry: 'US',
  },
  geo: { latitude: 0, longitude: 0 },
  priceRange: '$$',
  foundingDate: '{year}',
  openingHours: ['Mo-Sa 09:00-20:00', 'Su 10:00-18:00'],
  sameAs: ['{google_business_url}', '{facebook_url}', '{instagram_url}'],
} as const

// ---------------------------------------------------------------------------
// Schema builder helpers
// ---------------------------------------------------------------------------

export function buildLocalBusinessSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MassageTherapy', // pick most specific: Spa, MassageTherapy, HealthAndBeautyBusiness
    name: BUSINESS.name,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    foundingDate: BUSINESS.foundingDate,
    priceRange: BUSINESS.priceRange,
    address: { '@type': 'PostalAddress', ...BUSINESS.address },
    geo: { '@type': 'GeoCoordinates', latitude: BUSINESS.geo.latitude, longitude: BUSINESS.geo.longitude },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '20:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Sunday',
        opens: '10:00',
        closes: '18:00',
      },
    ],
    sameAs: BUSINESS.sameAs,
    areaServed: [
      // Add all served cities
      { '@type': 'City', name: '{primary_city}' },
    ],
    paymentAccepted: 'Cash, Credit Card', // add more from project.json
  }
}

export function buildServiceSchema(serviceName: string, slug: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceName,
    url: slug,
    provider: {
      '@type': 'MassageTherapy',
      name: BUSINESS.name,
      telephone: BUSINESS.phone,
      address: { '@type': 'PostalAddress', ...BUSINESS.address },
    },
    areaServed: { '@type': 'City', name: BUSINESS.address.addressLocality },
    serviceType: 'Massage Therapy',
    // NOTE: Do not include price/offers if content_restrictions includes "no_prices"
  }
}

export function buildFAQSchema(faqs: { question: string; answer: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

function buildArticleSchema(title: string, slug: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    url: slug,
    author: { '@type': 'Organization', name: BUSINESS.name },
    publisher: { '@type': 'Organization', name: BUSINESS.name },
  }
}

// ---------------------------------------------------------------------------
// Route SEO definitions — generated from project.json.seo.pages[]
//
// Each entry:
//   key = exact route path (must match React Router)
//   value = { title, description, h1, jsonLd }
//
// jsonLd per page_type:
//   core     → buildLocalBusinessSchema()
//   service  → buildServiceSchema(name, slug)
//   location → buildLocalBusinessSchema()
//   authority → buildArticleSchema(title, slug)
//   faq      → buildFAQSchema(faqs)
// ---------------------------------------------------------------------------

export const routeSEO: Record<string, SEOData> = {
  '/': {
    title: '{Business Name} | Massage & Spa in {City}',
    description: '...',
    h1: '...',
    jsonLd: buildLocalBusinessSchema(),
  },
  '/about': {
    title: 'About {Business Name} | {City}',
    description: '...',
    h1: '...',
    jsonLd: buildLocalBusinessSchema(),
  },
  // ... generate entries for all pages from project.json.seo.pages[]
}
