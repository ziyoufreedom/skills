/**
 * scripts/prerender.mjs
 *
 * Run after `vite build` to generate per-route static HTML with correct SEO head.
 * Also generates sitemap.xml and robots.txt in the same pass.
 *
 * Usage: node scripts/prerender.mjs
 *
 * IMPORTANT: This script must be self-contained plain JavaScript.
 * It runs in Node.js outside the Vite/TS pipeline, so it CANNOT import .ts files.
 * SEO data is intentionally duplicated here from seo-config.ts.
 *
 * Environment variable: SITE_DOMAIN (defaults to placeholder)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.resolve(__dirname, '..', 'dist')
const DOMAIN = process.env.SITE_DOMAIN || 'https://www.example.com'

// ---------------------------------------------------------------------------
// Business data + schema helpers (duplicated from seo-config.ts)
// ---------------------------------------------------------------------------

const BUSINESS = {
  name: '{Business Name}',
  phone: '{phone}',
  email: '{email}',
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
}

function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'MassageTherapy', // or Spa, HealthAndBeautyBusiness, etc.
    name: BUSINESS.name,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    foundingDate: BUSINESS.foundingDate,
    priceRange: BUSINESS.priceRange,
    address: { '@type': 'PostalAddress', ...BUSINESS.address },
    geo: { '@type': 'GeoCoordinates', ...BUSINESS.geo },
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
    url: DOMAIN,
  }
}

function serviceSchema(name, slug) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    url: `${DOMAIN}${slug}`,
    provider: {
      '@type': 'MassageTherapy',
      name: BUSINESS.name,
      telephone: BUSINESS.phone,
      address: { '@type': 'PostalAddress', ...BUSINESS.address },
    },
    areaServed: { '@type': 'City', name: BUSINESS.address.addressLocality },
    serviceType: 'Massage Therapy',
  }
}

function articleSchema(headline, slug) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    url: `${DOMAIN}${slug}`,
    author: { '@type': 'Organization', name: BUSINESS.name },
    publisher: { '@type': 'Organization', name: BUSINESS.name },
  }
}

// ---------------------------------------------------------------------------
// Route SEO data — one entry per page
// Replace with actual data from project.json
// ---------------------------------------------------------------------------

const routes = {
  '/': {
    title: `${BUSINESS.name} | Massage & Spa in {City}`,
    description: '...',
    jsonLd: localBusinessSchema(),
  },
  '/about': {
    title: `About ${BUSINESS.name} | {City}`,
    description: '...',
    jsonLd: localBusinessSchema(),
  },
  // ... add all routes from project.json.seo.pages[]
}

// ---------------------------------------------------------------------------
// Prerender all routes
// ---------------------------------------------------------------------------

const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf-8')
let count = 0

for (const [route, seo] of Object.entries(routes)) {
  const dir = route === '/' ? DIST : path.join(DIST, route)
  fs.mkdirSync(dir, { recursive: true })

  let html = template

  // Title
  html = html.replace(/<title>.*?<\/title>/, `<title>${seo.title}</title>`)

  // Meta description
  if (html.includes('name="description"')) {
    html = html.replace(
      /name="description"\s+content=".*?"/,
      `name="description" content="${seo.description}"`
    )
  } else {
    html = html.replace('</head>', `  <meta name="description" content="${seo.description}">\n  </head>`)
  }

  // Canonical URL
  const canonical = `${DOMAIN}${route === '/' ? '' : route}`
  html = html.replace('</head>', `  <link rel="canonical" href="${canonical}">\n  </head>`)

  // Open Graph + Twitter Card tags
  const ogTags = [
    `<meta property="og:title" content="${seo.title}">`,
    `<meta property="og:description" content="${seo.description}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${BUSINESS.name}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${seo.title}">`,
    `<meta name="twitter:description" content="${seo.description}">`,
  ].join('\n    ')
  html = html.replace('</head>', `    ${ogTags}\n  </head>`)

  // JSON-LD schema
  html = html.replace(
    '</head>',
    `  <script type="application/ld+json">${JSON.stringify(seo.jsonLd)}</script>\n  </head>`
  )

  const outFile = route === '/' ? path.join(DIST, 'index.html') : path.join(dir, 'index.html')
  fs.writeFileSync(outFile, html)
  count++
}

console.log(`✓ Prerendered ${count} pages with SEO metadata`)

// ---------------------------------------------------------------------------
// Generate sitemap.xml
// ---------------------------------------------------------------------------

const today = new Date().toISOString().split('T')[0]

function priority(route) {
  if (route === '/') return '1.0'
  if (['/services', '/about', '/contact'].includes(route)) return '0.9'
  if (route.startsWith('/services/')) return '0.8'
  if (route.startsWith('/locations/')) return '0.7'
  if (route.startsWith('/guides/')) return '0.6'
  return '0.5'
}

const sitemapEntries = Object.keys(routes)
  .map(route => `  <url>
    <loc>${DOMAIN}${route === '/' ? '' : route}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${priority(route)}</priority>
  </url>`)
  .join('\n')

fs.writeFileSync(
  path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`
)
console.log(`✓ Generated sitemap.xml (${Object.keys(routes).length} URLs)`)

// ---------------------------------------------------------------------------
// Generate robots.txt
// ---------------------------------------------------------------------------

fs.writeFileSync(
  path.join(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${DOMAIN}/sitemap.xml\n`
)
console.log('✓ Generated robots.txt')
