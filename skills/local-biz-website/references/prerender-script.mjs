/**
 * scripts/prerender.mjs
 *
 * Run after `vite build` to generate per-route static HTML with correct SEO <head>
 * and page-specific SSR-fallback body content (for LCP and no-JS crawlers).
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
  openingHours: ['Mo-Sa 09:00-20:00', 'Su 10:00-18:00'],
  sameAs: ['{google_business_url}', '{facebook_url}', '{instagram_url}'],
}

function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'DaySpa', // or MassageTherapy, HealthAndBeautyBusiness, BeautySalon
    name: BUSINESS.name,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
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

function serviceSchema(name, description) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: { '@type': 'LocalBusiness', name: BUSINESS.name },
    areaServed: BUSINESS.address.addressLocality,
  }
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ---------------------------------------------------------------------------
// Route SEO data — one entry per page
//
// Each route needs:
//   title        — page <title> (30-60 chars, keyword + brand)
//   description  — meta description (120-160 chars, keyword + CTA)
//   robots       — meta robots directive (default: "index,follow")
//   jsonLd       — JSON-LD schema object
//   fallbackHtml — SSR fallback body HTML (h1 + intro + location info)
//
// Replace with actual data from project.json / seo-config.ts.
// ---------------------------------------------------------------------------

const routes = {
  '/': {
    title: `${BUSINESS.name} | Service in {City}`,
    description: 'Description with keyword and CTA. Book today!',
    robots: 'index,follow',
    jsonLd: localBusinessSchema(),
    fallbackHtml: `
      <h1>${BUSINESS.name} | Service in {City}</h1>
      <p>Description paragraph with key info about the business.</p>
      <h2>Our Services</h2>
      <h3>Service 1</h3><h3>Service 2</h3><h3>Service 3</h3>
      <h2>Location</h2>
      <p>${BUSINESS.address.streetAddress}, ${BUSINESS.address.addressLocality}, ${BUSINESS.address.addressRegion} ${BUSINESS.address.postalCode} — ${BUSINESS.phone}</p>`,
  },
  '/about': {
    title: `About ${BUSINESS.name} | {City}`,
    description: 'Learn about our business...',
    robots: 'index,follow',
    jsonLd: localBusinessSchema(),
    fallbackHtml: `
      <h1>About ${BUSINESS.name}</h1>
      <p>About paragraph...</p>`,
  },
  // ... add all routes from project.json.seo.pages[]
  // For SEO landing pages, generate entries programmatically:
  //
  // const seoPages = [ { route, title, description, heading, subheading, intro }, ... ]
  // for (const page of seoPages) {
  //   routes[page.route] = {
  //     title: page.title,
  //     description: page.description,
  //     robots: 'index,follow,max-image-preview:large',
  //     jsonLd: serviceSchema(page.heading, page.description),
  //     fallbackHtml: `
  //       <h1>${escapeHtml(page.heading)}</h1>
  //       <p>${escapeHtml(page.subheading)}</p>
  //       <p>${escapeHtml(page.intro)}</p>
  //       <p>Rating · Reviews · Locations</p>
  //       <h2>Our Locations</h2>
  //       <p>Address 1 — Phone 1</p>
  //       <p>Address 2 — Phone 2</p>`,
  //   }
  // }
}

// ---------------------------------------------------------------------------
// Apply per-route HTML modifications to the template
// ---------------------------------------------------------------------------

function applyRouteHtml(template, route, seo) {
  let html = template
  const canonicalUrl = route === '/' ? `${DOMAIN}/` : `${DOMAIN}${route}`
  const safeTitle = escapeAttr(seo.title)
  const safeDesc = escapeAttr(seo.description)

  // <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`)

  // <meta name="description">
  html = html.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${safeDesc}$2`
  )

  // <link rel="canonical"> (replace if present, inject if not)
  if (html.includes('rel="canonical"')) {
    html = html.replace(
      /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
      `$1${canonicalUrl}$2`
    )
  } else {
    html = html.replace('</head>', `  <link rel="canonical" href="${canonicalUrl}">\n</head>`)
  }

  // OG + Twitter meta tags (replace if present, inject if not)
  const ogReplacements = [
    [/(<meta\s+property="og:title"\s+content=")[^"]*(")/,       `$1${safeTitle}$2`],
    [/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/,      `$1${safeTitle}$2`],
    [/(<meta\s+property="og:description"\s+content=")[^"]*(")/,  `$1${safeDesc}$2`],
    [/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/,`$1${safeDesc}$2`],
  ]
  for (const [pattern, replacement] of ogReplacements) {
    if (pattern.test(html)) {
      html = html.replace(pattern, replacement)
    }
  }

  // Inject <meta name="robots"> (before </head>)
  if (seo.robots) {
    html = html.replace('</head>', `  <meta name="robots" content="${seo.robots}">\n</head>`)
  }

  // Inject JSON-LD (before </head>)
  if (seo.jsonLd) {
    html = html.replace(
      '</head>',
      `  <script type="application/ld+json">${JSON.stringify(seo.jsonLd)}</script>\n</head>`
    )
  }

  // Replace SSR-fallback body content (critical for LCP!)
  if (seo.fallbackHtml) {
    html = html.replace(
      /(<div id="ssr-fallback">)[\s\S]*?(<\/div>\s*<\/div>)/,
      `$1${seo.fallbackHtml}\n      $2`
    )
  }

  return html
}

// ---------------------------------------------------------------------------
// Main: prerender all routes
// ---------------------------------------------------------------------------

const templatePath = path.join(DIST, 'index.html')
if (!fs.existsSync(templatePath)) {
  console.error('ERROR: dist/index.html not found. Run `vite build` first.')
  process.exit(1)
}

const template = fs.readFileSync(templatePath, 'utf-8')
let count = 0

for (const [route, seo] of Object.entries(routes)) {
  const html = applyRouteHtml(template, route, seo)

  if (route === '/') {
    fs.writeFileSync(templatePath, html)
  } else {
    const dir = path.join(DIST, route)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'index.html'), html)
  }
  count++
}

console.log(`✓ Prerendered ${count} pages with SEO metadata + fallback body`)

// ---------------------------------------------------------------------------
// Generate sitemap.xml
// ---------------------------------------------------------------------------

const today = new Date().toISOString().split('T')[0]

function sitemapPriority(route) {
  if (route === '/') return '1.0'
  if (['/services', '/locations'].includes(route)) return '0.9'
  if (['/about', '/contact'].includes(route)) return '0.6'
  return '0.8' // service/location/SEO landing pages
}

const sitemapEntries = Object.keys(routes)
  .map(route => `  <url>
    <loc>${route === '/' ? DOMAIN + '/' : DOMAIN + route}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${sitemapPriority(route)}</priority>
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
