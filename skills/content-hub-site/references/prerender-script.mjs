/**
 * scripts/prerender.mjs
 *
 * Run after `vite build` to generate per-route static HTML with correct SEO <head>.
 * Also generates sitemap.xml and robots.txt.
 *
 * Usage: node scripts/prerender.mjs
 *
 * IMPORTANT: This script must be self-contained plain JavaScript.
 * It runs in Node.js outside the Vite/TS pipeline — CANNOT import .ts files.
 * SEO data is intentionally duplicated here from seo-config.ts.
 *
 * Environment variable: SITE_DOMAIN (defaults to placeholder)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "..", "dist");
const DOMAIN = process.env.SITE_DOMAIN || "https://www.example.com";

// ---------------------------------------------------------------------------
// Site data (duplicated from site-config.ts — keep in sync!)
// ---------------------------------------------------------------------------

const SITE = {
  name: "{Site Name}",
  tagline: "{Site tagline}",
};

// ---------------------------------------------------------------------------
// Schema helpers
// ---------------------------------------------------------------------------

function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: DOMAIN,
    description: SITE.tagline,
    publisher: { "@type": "Organization", name: SITE.name },
  };
}

function articleSchema(headline, slug) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    url: `${DOMAIN}${slug}`,
    author: { "@type": "Organization", name: SITE.name },
    publisher: { "@type": "Organization", name: SITE.name },
  };
}

function collectionSchema(name, slug, description) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: `${DOMAIN}${slug}`,
    description,
    publisher: { "@type": "Organization", name: SITE.name },
  };
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

function escapeAttr(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------------------------------------------------------------------------
// Route SEO data — one entry per page
//
// Duplicate from seo-config.ts. Keep in sync!
// Each route: { title, description, robots, jsonLd }
// ---------------------------------------------------------------------------

const routes = {
  "/": {
    title: `${SITE.name} | ${SITE.tagline}`,
    description: "{Home page meta description — 150 chars}",
    robots: "index,follow",
    jsonLd: webSiteSchema(),
  },
  // --- Article pages ---
  "/{topic-1-slug}": {
    title: `{Topic 1 Title} | ${SITE.name}`,
    description: "{Topic 1 meta description}",
    robots: "index,follow",
    jsonLd: articleSchema("{Topic 1 Headline}", "/{topic-1-slug}"),
  },
  // ... add all article routes
  // --- Catalog pages ---
  "/use-cases": {
    title: `Use Cases | ${SITE.name}`,
    description: "{Use cases meta description}",
    robots: "index,follow",
    jsonLd: collectionSchema("Use Cases", "/use-cases", "{description}"),
  },
  "/comparisons": {
    title: `Comparisons | ${SITE.name}`,
    description: "{Comparisons meta description}",
    robots: "index,follow",
    jsonLd: collectionSchema("Comparisons", "/comparisons", "{description}"),
  },
  "/resources": {
    title: `Resources | ${SITE.name}`,
    description: "{Resources meta description}",
    robots: "index,follow",
    jsonLd: collectionSchema("Resources", "/resources", "{description}"),
  },
};

// ---------------------------------------------------------------------------
// Apply per-route HTML modifications
// ---------------------------------------------------------------------------

function applyRouteHtml(template, route, seo) {
  let html = template;
  const canonicalUrl = route === "/" ? `${DOMAIN}/` : `${DOMAIN}${route}`;
  const safeTitle = escapeAttr(seo.title);
  const safeDesc = escapeAttr(seo.description);

  // <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`);

  // <meta name="description">
  if (html.includes('name="description"')) {
    html = html.replace(
      /(<meta\s+name="description"\s+content=")[^"]*(")/,
      `$1${safeDesc}$2`
    );
  } else {
    html = html.replace(
      "</head>",
      `  <meta name="description" content="${safeDesc}">\n</head>`
    );
  }

  // <link rel="canonical">
  if (html.includes('rel="canonical"')) {
    html = html.replace(
      /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
      `$1${canonicalUrl}$2`
    );
  } else {
    html = html.replace(
      "</head>",
      `  <link rel="canonical" href="${canonicalUrl}">\n</head>`
    );
  }

  // OG + Twitter meta tags
  const ogReplacements = [
    [
      /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
      `$1${safeTitle}$2`,
    ],
    [
      /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/,
      `$1${safeTitle}$2`,
    ],
    [
      /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
      `$1${safeDesc}$2`,
    ],
    [
      /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/,
      `$1${safeDesc}$2`,
    ],
  ];
  for (const [pattern, replacement] of ogReplacements) {
    if (pattern.test(html)) {
      html = html.replace(pattern, replacement);
    }
  }

  // Inject <meta name="robots">
  if (seo.robots) {
    html = html.replace(
      "</head>",
      `  <meta name="robots" content="${seo.robots}">\n</head>`
    );
  }

  // Inject JSON-LD
  if (seo.jsonLd) {
    html = html.replace(
      "</head>",
      `  <script type="application/ld+json">${JSON.stringify(seo.jsonLd)}</script>\n</head>`
    );
  }

  return html;
}

// ---------------------------------------------------------------------------
// Main: prerender all routes
// ---------------------------------------------------------------------------

const templatePath = path.join(DIST, "index.html");
if (!fs.existsSync(templatePath)) {
  console.error("ERROR: dist/index.html not found. Run `vite build` first.");
  process.exit(1);
}

const template = fs.readFileSync(templatePath, "utf-8");
let count = 0;

for (const [route, seo] of Object.entries(routes)) {
  const html = applyRouteHtml(template, route, seo);

  if (route === "/") {
    fs.writeFileSync(templatePath, html);
  } else {
    const dir = path.join(DIST, route);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), html);
  }
  count++;
}

console.log(`Prerendered ${count} pages with SEO metadata`);

// ---------------------------------------------------------------------------
// Generate sitemap.xml
// ---------------------------------------------------------------------------

const today = new Date().toISOString().split("T")[0];

function sitemapPriority(route) {
  if (route === "/") return "1.0";
  if (["/use-cases", "/comparisons", "/resources"].includes(route))
    return "0.7";
  return "0.8"; // article/topic pages
}

const sitemapEntries = Object.keys(routes)
  .map(
    (route) => `  <url>
    <loc>${route === "/" ? DOMAIN + "/" : DOMAIN + route}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route === "/" ? "weekly" : "monthly"}</changefreq>
    <priority>${sitemapPriority(route)}</priority>
  </url>`
  )
  .join("\n");

fs.writeFileSync(
  path.join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`
);
console.log(`Generated sitemap.xml (${Object.keys(routes).length} URLs)`);

// ---------------------------------------------------------------------------
// Generate robots.txt
// ---------------------------------------------------------------------------

fs.writeFileSync(
  path.join(DIST, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${DOMAIN}/sitemap.xml\n`
);
console.log("Generated robots.txt");
