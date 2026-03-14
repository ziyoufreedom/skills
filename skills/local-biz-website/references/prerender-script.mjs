/**
 * scripts/prerender.mjs
 * 
 * Run after `vite build` to generate per-route static HTML with correct SEO head.
 * Usage: node scripts/prerender.mjs
 * 
 * This script reads dist/index.html as a template, then for every route defined
 * in src/lib/seo-config.js, writes dist/{route}/index.html with the correct
 * <title>, <meta description>, <link canonical>, OG tags, and JSON-LD injected
 * directly into the HTML — no JS execution required by crawlers.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', 'dist')

// Import seo-config — must be a plain JS/JSON file (no React, no DOM)
// If using TypeScript, compile it first or use a .mjs version
const { routeSEO, SITE_URL } = await import('../src/lib/seo-config.mjs')

const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8')

let count = 0

for (const [route, seo] of Object.entries(routeSEO)) {
  // Skip root — dist/index.html already handled
  if (route === '/') {
    injectSEO(path.join(distDir, 'index.html'), seo, route)
    count++
    continue
  }

  const routeDir = path.join(distDir, route.replace(/^\//, ''))
  fs.mkdirSync(routeDir, { recursive: true })
  injectSEO(path.join(routeDir, 'index.html'), seo, route)
  count++
}

console.log(`✅ Prerendered ${count} routes`)

// ---------------------------------------------------------------------------

function injectSEO(outputPath, seo, route) {
  const canonical = `${SITE_URL}${route}`
  let html = template

  // Title
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(seo.title)}</title>`
  )

  // Meta description
  if (html.includes('name="description"')) {
    html = html.replace(
      /(<meta\s+name="description"\s+content=")[^"]*(")/,
      `$1${escapeHtml(seo.description)}$2`
    )
  } else {
    html = html.replace(
      '</head>',
      `  <meta name="description" content="${escapeHtml(seo.description)}">\n</head>`
    )
  }

  // Canonical
  const canonicalTag = `  <link rel="canonical" href="${canonical}">`
  if (html.includes('rel="canonical"')) {
    html = html.replace(/<link rel="canonical"[^>]*>/, canonicalTag)
  } else {
    html = html.replace('</head>', `${canonicalTag}\n</head>`)
  }

  // Open Graph tags
  const ogTags = buildOGTags(seo, canonical)
  html = html.replace('</head>', `${ogTags}\n</head>`)

  // JSON-LD schemas
  if (seo.jsonLd) {
    const schemas = Array.isArray(seo.jsonLd) ? seo.jsonLd : [seo.jsonLd]
    const scriptTags = schemas
      .map(s => `  <script type="application/ld+json">${JSON.stringify(s)}</script>`)
      .join('\n')
    html = html.replace('</head>', `${scriptTags}\n</head>`)
  }

  fs.writeFileSync(outputPath, html, 'utf-8')
}

function buildOGTags(seo, canonical) {
  const lines = [
    `  <meta property="og:title" content="${escapeHtml(seo.title)}">`,
    `  <meta property="og:description" content="${escapeHtml(seo.description)}">`,
    `  <meta property="og:url" content="${canonical}">`,
    `  <meta property="og:type" content="website">`,
  ]
  if (seo.ogImage) {
    lines.push(`  <meta property="og:image" content="${seo.ogImage}">`)
  }
  return lines.join('\n')
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
