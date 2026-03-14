/**
 * src/lib/seo-config.mjs
 *
 * SINGLE SOURCE OF TRUTH for all page SEO data.
 * Must be a pure JS module — no React, no DOM, no browser APIs.
 * Imported by both:
 *   - React components (to set <head> for client-side nav)
 *   - scripts/prerender.mjs (to generate static HTML at build time)
 *
 * Replace all {PLACEHOLDERS} with actual business data.
 */

export const SITE_URL = 'https://{domain}'
export const BUSINESS_NAME = '{Business Name}'
export const BUSINESS_CITY = '{City}'

// LocalBusiness schema — used on Home, Location pages
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'Spa',
  name: BUSINESS_NAME,
  url: SITE_URL,
  telephone: '{phone}',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '{street}',
    addressLocality: '{city}',
    addressRegion: '{state}',
    postalCode: '{zip}',
    addressCountry: 'US',
  },
  priceRange: '{$$}',
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '10:00', closes: '20:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday','Sunday'], opens: '10:00', closes: '18:00' },
  ],
  sameAs: ['{google_business_url}'],
}

function serviceSchema(serviceName, city) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${serviceName} in ${city}`,
    provider: { '@type': 'Spa', name: BUSINESS_NAME, url: SITE_URL },
    areaServed: { '@type': 'City', name: city },
  }
}

function faqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

// ---------------------------------------------------------------------------
// Route SEO Map
// Key = exact route path (must match React Router paths)
// ---------------------------------------------------------------------------

export const routeSEO = {

  '/': {
    title: `${BUSINESS_NAME} | Massage & Spa in ${BUSINESS_CITY}`,
    description: `${BUSINESS_NAME} in ${BUSINESS_CITY}. Professional massage, facials & spa services. Book online today.`,
    jsonLd: localBusinessSchema,
  },

  '/about': {
    title: `About Us | ${BUSINESS_NAME} ${BUSINESS_CITY}`,
    description: `Meet the team at ${BUSINESS_NAME}. Certified therapists serving ${BUSINESS_CITY} with premium massage and spa services.`,
    jsonLd: localBusinessSchema,
  },

  '/services': {
    title: `Massage & Spa Services | ${BUSINESS_NAME} ${BUSINESS_CITY}`,
    description: `Explore all services at ${BUSINESS_NAME}: deep tissue massage, couples massage, facials, hydrofacials & more in ${BUSINESS_CITY}.`,
    jsonLd: localBusinessSchema,
  },

  '/contact': {
    title: `Contact & Book | ${BUSINESS_NAME} ${BUSINESS_CITY}`,
    description: `Book an appointment at ${BUSINESS_NAME} in ${BUSINESS_CITY}. Call {phone} or book online. Located at {address}.`,
    jsonLd: [localBusinessSchema, faqSchema([
      { q: `Where is ${BUSINESS_NAME} located?`, a: `We are located at {address}, ${BUSINESS_CITY}.` },
      { q: 'How do I book an appointment?', a: 'Book online at {booking_link} or call {phone}.' },
    ])],
  },

  '/faq': {
    title: `FAQ | ${BUSINESS_NAME} ${BUSINESS_CITY}`,
    description: `Frequently asked questions about ${BUSINESS_NAME} in ${BUSINESS_CITY}. Pricing, booking, what to expect & more.`,
    jsonLd: faqSchema([
      { q: `How much does massage cost at ${BUSINESS_NAME}?`, a: 'Services start at ${price}. See our services page for full pricing.' },
      { q: 'Do I need an appointment?', a: 'Appointments are recommended. Book online or call us.' },
      { q: 'What types of massage do you offer?', a: 'We offer deep tissue, Swedish, couples massage, therapeutic massage, and more.' },
      { q: 'Is parking available?', a: 'Yes, free parking is available at our location.' },
      { q: 'Do you offer gift cards?', a: 'Yes! Gift cards are available for purchase in-store or online.' },
    ]),
  },

  // SERVICE PAGES — duplicate this block for each service
  '/services/deep-tissue-massage-{city}': {
    title: `Deep Tissue Massage in ${BUSINESS_CITY} | ${BUSINESS_NAME}`,
    description: `Professional deep tissue massage in ${BUSINESS_CITY}. Relieve chronic pain and muscle tension. Certified therapists. Book today.`,
    jsonLd: [serviceSchema('Deep Tissue Massage', BUSINESS_CITY), localBusinessSchema],
  },

  '/services/couples-massage-{city}': {
    title: `Couples Massage in ${BUSINESS_CITY} | ${BUSINESS_NAME}`,
    description: `Romantic couples massage in ${BUSINESS_CITY}. Enjoy a relaxing spa experience together. Perfect for anniversaries & date nights.`,
    jsonLd: [serviceSchema('Couples Massage', BUSINESS_CITY), localBusinessSchema],
  },

  '/services/relaxation-massage-{city}': {
    title: `Relaxation Massage in ${BUSINESS_CITY} | ${BUSINESS_NAME}`,
    description: `Unwind with a full-body relaxation massage in ${BUSINESS_CITY}. Reduce stress, improve sleep, restore balance. Book online today.`,
    jsonLd: [serviceSchema('Relaxation Massage', BUSINESS_CITY), localBusinessSchema],
  },

  // LOCATION PAGES
  '/locations/massage-spa-near-me': {
    title: `Massage Spa Near You in ${BUSINESS_CITY} | ${BUSINESS_NAME}`,
    description: `Looking for a massage spa near you in ${BUSINESS_CITY}? ${BUSINESS_NAME} is conveniently located and ready to book.`,
    jsonLd: localBusinessSchema,
  },

  '/locations/massage-spa-{city}': {
    title: `Massage Spa in ${BUSINESS_CITY}, TN | ${BUSINESS_NAME}`,
    description: `${BUSINESS_NAME} is ${BUSINESS_CITY}'s top-rated massage spa. Services include deep tissue, couples massage, facials & more.`,
    jsonLd: localBusinessSchema,
  },

  // GUIDE / AUTHORITY PAGES
  '/guides/best-massage-spa-{city}': {
    title: `Best Massage Spa in ${BUSINESS_CITY} | ${BUSINESS_NAME}`,
    description: `Looking for the best massage spa in ${BUSINESS_CITY}? See why ${BUSINESS_NAME} is the top-rated choice for massage and spa services.`,
    jsonLd: localBusinessSchema,
  },

  '/guides/benefits-of-massage': {
    title: `Benefits of Regular Massage | ${BUSINESS_NAME} ${BUSINESS_CITY}`,
    description: `Discover the health benefits of regular massage therapy: stress relief, pain reduction, better sleep & more. Expert advice from ${BUSINESS_NAME}.`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Benefits of Regular Massage',
      author: { '@type': 'Organization', name: BUSINESS_NAME },
    },
  },

}
