/**
 * Example seo-geo.config.mjs — copy to scripts/audit/seo-geo.config.mjs
 * in your target project and adapt to your IA.
 *
 * The scripts in scripts/audit/seo-geo-score.mjs and metadata-audit.mjs do NOT
 * automatically import this file — it's a documentation reference for what to
 * edit inline. To wire it up, search for `// CONFIGURE` in both scripts and
 * replace the constants with imports from this file.
 */

// ---------- seo-geo-score.mjs CONFIGURE #1 ----------
export function inferCluster(route) {
  // CMS site example
  if (route === "/") return { cluster: "hub-home", queryType: "transactional", floor: 500 };
  if (route.startsWith("/blog/")) return { cluster: "blog", queryType: "informational", floor: 1500 };
  if (route.startsWith("/docs/")) return { cluster: "docs", queryType: "informational", floor: 800 };
  if (route.startsWith("/products/")) return { cluster: "product", queryType: "commercial", floor: 1200 };
  if (route.startsWith("/case-studies/")) return { cluster: "case-study", queryType: "commercial", floor: 1500 };
  if (["/about/", "/contact/", "/pricing/", "/faq/"].includes(route))
    return { cluster: "conversion", queryType: "transactional", floor: 400 };
  return { cluster: "misc", queryType: "informational", floor: 300 };
}

// ---------- seo-geo-score.mjs CONFIGURE #2 ----------
// Append vertical-specific authority domains to the universal default.
// Universal: .gov, .edu, NIH/Mayo/Cleveland/Hopkins/PubMed.
export const AUTHORITY_DOMAIN_REGEX = /(\.gov|\.edu|nccih\.nih|ncbi\.nlm|mayoclinic|clevelandclinic|hopkinsmedicine|harvard|pubmed|w3\.org|developer\.mozilla\.org|ietf\.org)/;

// ---------- metadata-audit.mjs CONFIGURE #1 ----------
export const SITE_ORIGIN = "https://example.com";

// ---------- metadata-audit.mjs CONFIGURE #2 ----------
// Canonical NAP. For non-local businesses (SaaS / e-commerce / B2B), only
// `name` and `origin` matter — set the address fields to your registered
// business address or omit the LocalBusiness schema in your JSON-LD helpers.
export const CANON = {
  name: "Example Co",
  telephone: "+1-555-555-1234",
  street: "123 Market Street, Floor 4",
  city: "San Francisco",
  region: "CA",
  postalCode: "94103",
  country: "US",
  origin: "https://example.com",
  lat: 37.7749,
  lng: -122.4194,
};
