/**
 * Metadata + JSON-LD audit
 *
 * Scans every dist/*.html for:
 *   - <title>: length 50-60 ideal · 30-70 ok · brand · uniqueness
 *   - <meta name="description">: length 140-160 ideal · 110-170 ok · CTA · uniqueness
 *   - canonical: present · absolute · HTTPS · matches URL
 *   - og:* trio: title · description · image · url · type · site_name · locale
 *   - twitter:* trio: card · title · description · image
 *   - JSON-LD: parse-ability · schema types present · required fields · NAP consistency
 *
 * Usage: node scripts/audit/metadata-audit.mjs [--md]
 */

import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist");
// CONFIGURE #1: set to the production origin of the target project.
// All canonical link tags + og:url + schema URL fields are checked against this.
const SITE_ORIGIN = "https://tentoeskansas.com";
const EMIT_MD = process.argv.includes("--md");

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== "_astro") out.push(...walk(full));
    else if (e.isFile() && e.name === "index.html") out.push(full);
  }
  return out;
}

function decode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#38;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function getMeta(html, name) {
  // Astro outputs content="..." (double-quoted). Literal apostrophes inside
  // are allowed. Match content=" ... " with greedy-friendly negated double-quote.
  const reN = new RegExp(`<meta\\s+name=["']${name}["']\\s+content="([^"]*)"`, "i");
  const reP = new RegExp(`<meta\\s+property=["']${name}["']\\s+content="([^"]*)"`, "i");
  // Fallback for single-quoted content
  const reNs = new RegExp(`<meta\\s+name=["']${name}["']\\s+content='([^']*)'`, "i");
  const rePs = new RegExp(`<meta\\s+property=["']${name}["']\\s+content='([^']*)'`, "i");
  const m = html.match(reN) || html.match(reP) || html.match(reNs) || html.match(rePs);
  return decode((m?.[1] || "").trim());
}

function getLink(html, rel) {
  const reD = new RegExp(`<link\\s+rel=["']${rel}["']\\s+href="([^"]*)"`, "i");
  const reS = new RegExp(`<link\\s+rel=["']${rel}["']\\s+href='([^']*)'`, "i");
  const m = html.match(reD) || html.match(reS);
  return decode((m?.[1] || "").trim());
}

function getTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/);
  return decode((m?.[1] || "").trim());
}

function extractJsonLd(html) {
  const blocks = [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const parsed = [];
  const errors = [];
  for (let i = 0; i < blocks.length; i++) {
    try {
      parsed.push(JSON.parse(blocks[i][1]));
    } catch (e) {
      errors.push({ index: i, error: e.message, preview: blocks[i][1].slice(0, 100) });
    }
  }
  return { parsed, errors, rawCount: blocks.length };
}

function collectSchemaNodes(parsed) {
  const out = [];
  const visit = (node) => {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (typeof node !== "object") return;
    if (node["@type"]) out.push(node);
    if (node["@graph"]) visit(node["@graph"]);
    if (node.mainEntity) visit(node.mainEntity);
    if (node.itemListElement) visit(node.itemListElement);
  };
  parsed.forEach(visit);
  return out;
}

function typeOf(node) {
  const t = node["@type"];
  return Array.isArray(t) ? t.join("/") : (t || "");
}

const REQUIRED_FIELDS = {
  LocalBusiness: ["name", "address", "telephone", "url", "image", "geo", "openingHoursSpecification"],
  DaySpa: ["name", "address", "telephone", "url", "image", "geo", "openingHoursSpecification"],
  Organization: ["name", "url", "logo", "address"],
  Article: ["headline", "author", "datePublished", "dateModified", "image", "mainEntityOfPage"],
  FAQPage: ["mainEntity"],
  Service: ["name", "provider", "areaServed"],
  BreadcrumbList: ["itemListElement"],
  WebSite: ["url", "name"],
  CollectionPage: ["name", "url"],
  Question: ["name", "acceptedAnswer"],
};

// CONFIGURE #2: canonical NAP for the target project. Source of truth — should
// match exactly what your project's business.ts / config.ts / siteConfig exports.
// LocalBusiness / DaySpa / Organization schemas on every page get checked against
// these — drift = critical-level issue (NAP inconsistency tanks local-pack ranking).
const CANON = {
  name: "Ten Toes Reflexology",
  telephone: "+1-785-865-6806",
  street: "3514 Clinton Parkway, Suite F",
  city: "Lawrence",
  region: "KS",
  postalCode: "66047",
  country: "US",
  origin: "https://tentoeskansas.com",
  lat: 38.9384,
  lng: -95.2845,
};

function validateNode(node) {
  const type = typeOf(node);
  const baseType = type.split("/")[0];
  const required = REQUIRED_FIELDS[baseType] || [];
  const missing = required.filter(f => !node[f] && node[f] !== 0);
  const napIssues = [];
  const urlIssues = [];

  // NAP consistency
  if (baseType === "LocalBusiness" || baseType === "DaySpa" || baseType === "Organization") {
    if (node.telephone && node.telephone !== CANON.telephone) {
      napIssues.push(`telephone "${node.telephone}" ≠ canonical "${CANON.telephone}"`);
    }
    if (node.name && node.name !== CANON.name) {
      napIssues.push(`name "${node.name}" ≠ canonical "${CANON.name}"`);
    }
    const addr = node.address;
    if (addr && typeof addr === "object") {
      if (addr.streetAddress && addr.streetAddress !== CANON.street)
        napIssues.push(`streetAddress "${addr.streetAddress}" ≠ canonical`);
      if (addr.addressLocality && addr.addressLocality !== CANON.city)
        napIssues.push(`addressLocality mismatch`);
      if (addr.addressRegion && addr.addressRegion !== CANON.region)
        napIssues.push(`addressRegion mismatch`);
      if (addr.postalCode && addr.postalCode !== CANON.postalCode)
        napIssues.push(`postalCode mismatch`);
    }
    const geo = node.geo;
    if (geo && typeof geo === "object") {
      if (Math.abs((geo.latitude || 0) - CANON.lat) > 0.01) napIssues.push(`geo.latitude drift`);
      if (Math.abs((geo.longitude || 0) - CANON.lng) > 0.01) napIssues.push(`geo.longitude drift`);
    }
  }

  // URL absoluteness (image, url, sameAs, logo)
  const urlFields = ["url", "image", "logo"];
  for (const f of urlFields) {
    const v = node[f];
    if (typeof v === "string" && v && !v.startsWith("http") && !v.startsWith("https"))
      urlIssues.push(`${f} not absolute: "${v}"`);
    if (typeof v === "object" && v && v.url && !v.url.startsWith("http"))
      urlIssues.push(`${f}.url not absolute: "${v.url}"`);
  }
  if (Array.isArray(node.sameAs)) {
    for (const s of node.sameAs) {
      if (!s.startsWith("http")) urlIssues.push(`sameAs not absolute: "${s}"`);
    }
  }

  return { type, missing, napIssues, urlIssues };
}

function collectIds(parsed) {
  const ids = [];
  const visit = (node) => {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (typeof node !== "object") return;
    if (node["@id"]) ids.push(node["@id"]);
    if (node["@graph"]) visit(node["@graph"]);
    if (node.mainEntity) visit(node.mainEntity);
  };
  parsed.forEach(visit);
  return ids;
}

// === MAIN AUDIT ===
const files = walk(DIST);
const reports = [];
const titleCounts = new Map();
const descCounts = new Map();

for (const f of files) {
  const html = fs.readFileSync(f, "utf8");
  const route = "/" + path.relative(DIST, f).replace(/\\/g, "/").replace(/index\.html$/, "");

  const title = getTitle(html);
  const description = getMeta(html, "description");
  const canonical = getLink(html, "canonical");
  const robots = getMeta(html, "robots");
  const viewport = getMeta(html, "viewport");
  const themeColor = getMeta(html, "theme-color");
  const ogTitle = getMeta(html, "og:title");
  const ogDescription = getMeta(html, "og:description");
  const ogImage = getMeta(html, "og:image");
  const ogUrl = getMeta(html, "og:url");
  const ogType = getMeta(html, "og:type");
  const ogSiteName = getMeta(html, "og:site_name");
  const ogLocale = getMeta(html, "og:locale");
  const twitterCard = getMeta(html, "twitter:card");
  const twitterTitle = getMeta(html, "twitter:title");
  const twitterDescription = getMeta(html, "twitter:description");
  const twitterImage = getMeta(html, "twitter:image");

  // Track dupes
  if (title) titleCounts.set(title, (titleCounts.get(title) || []).concat(route));
  if (description) descCounts.set(description, (descCounts.get(description) || []).concat(route));

  // JSON-LD
  const { parsed, errors, rawCount } = extractJsonLd(html);
  const nodes = collectSchemaNodes(parsed);
  const schemaTypes = [...new Set(nodes.map(typeOf).filter(Boolean))];
  const schemaValidation = nodes.map(validateNode);

  // === SCORING / ISSUES ===
  const issues = { critical: [], warning: [], info: [] };

  // Title checks
  if (!title) issues.critical.push("MISSING <title>");
  else {
    if (title.length < 30) issues.warning.push(`title short (${title.length}c, ideal 50-60)`);
    else if (title.length > 70) issues.critical.push(`title >70c (${title.length}c) — will truncate in SERPs`);
    else if (title.length > 60) issues.info.push(`title >60c (${title.length}c) — may truncate on mobile`);
    if (!/ten toes/i.test(title)) issues.warning.push("title missing 'Ten Toes' brand");
  }

  // Meta description checks
  if (!description) issues.critical.push("MISSING meta description");
  else {
    if (description.length < 110) issues.warning.push(`desc short (${description.length}c, ideal 140-160)`);
    else if (description.length > 170) issues.warning.push(`desc >170c (${description.length}c) — will truncate`);
    if (!/(book|call|visit|reserve|today|near|find|learn|discover|walk-in|buy|browse|read|stop by)/i.test(description))
      issues.info.push("desc no CTA verb");
  }

  // Canonical
  if (!canonical) issues.critical.push("MISSING canonical");
  else {
    if (!canonical.startsWith("https://")) issues.critical.push("canonical not HTTPS");
    if (!canonical.startsWith(SITE_ORIGIN)) issues.warning.push(`canonical origin mismatch (${canonical})`);
    // Trailing slash + route alignment
    const canonPath = canonical.replace(SITE_ORIGIN, "").replace(/\/$/, "") + "/";
    if (canonPath !== route) issues.warning.push(`canonical path "${canonPath}" != route "${route}"`);
  }

  // Robots
  if (/noindex/i.test(robots)) issues.warning.push(`robots=noindex`);

  // Viewport
  if (!viewport) issues.critical.push("MISSING viewport");

  // OG
  if (!ogTitle) issues.warning.push("missing og:title");
  if (!ogDescription) issues.warning.push("missing og:description");
  if (!ogImage) issues.warning.push("missing og:image");
  else if (!ogImage.startsWith("http")) issues.warning.push(`og:image not absolute (${ogImage})`);
  if (!ogUrl) issues.info.push("missing og:url");
  else if (!ogUrl.startsWith("http")) issues.warning.push("og:url not absolute");
  if (!ogType) issues.info.push("missing og:type");
  if (!ogSiteName) issues.info.push("missing og:site_name");
  if (!ogLocale) issues.info.push("missing og:locale");
  // OG consistency
  if (ogTitle && title && ogTitle !== title) issues.info.push(`og:title differs from <title>`);
  if (ogDescription && description && ogDescription !== description) issues.info.push(`og:description differs from meta`);

  // Twitter
  if (!twitterCard) issues.info.push("missing twitter:card");
  if (!twitterTitle) issues.info.push("missing twitter:title");
  if (!twitterDescription) issues.info.push("missing twitter:description");
  if (!twitterImage) issues.info.push("missing twitter:image");

  // JSON-LD
  if (rawCount === 0) issues.critical.push("NO JSON-LD");
  if (errors.length > 0) issues.critical.push(`JSON-LD parse error × ${errors.length}`);
  // Required-field gaps + NAP + URL absoluteness
  for (const v of schemaValidation) {
    if (v.missing.length > 0) issues.warning.push(`${v.type} missing: ${v.missing.join(",")}`);
    for (const n of v.napIssues) issues.critical.push(`${v.type}: ${n}`);
    for (const u of v.urlIssues) issues.warning.push(`${v.type}: ${u}`);
  }
  // @id duplicates within a single page (rare but bad)
  const ids = collectIds(parsed);
  const dupeIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupeIds.length > 0) issues.warning.push(`duplicate @id × ${dupeIds.length}`);
  // Schema coverage expectations by page type
  const isService = route.startsWith("/services/") && route !== "/services/" && route !== "/services/massage/";
  const isGuide = route.startsWith("/guides/") && route !== "/guides/";
  const isLawrence = route.startsWith("/lawrence/");
  if (isService && !schemaTypes.includes("Service")) issues.info.push("service page missing Service schema");
  if (isGuide && !schemaTypes.includes("Article")) issues.info.push("guide page missing Article schema");
  if (route !== "/" && !schemaTypes.includes("BreadcrumbList")) issues.info.push("missing BreadcrumbList");

  reports.push({
    route, title, description, canonical, ogImage,
    titleLen: title.length, descLen: description.length,
    schemaCount: rawCount, schemaTypes,
    nodeCount: nodes.length, parseErrors: errors.length,
    issues,
  });
}

// Dupe analysis
const duplicateTitles = [...titleCounts.entries()].filter(([, routes]) => routes.length > 1);
const duplicateDescs = [...descCounts.entries()].filter(([, routes]) => routes.length > 1);

// === OUTPUT ===
console.log("\n" + "=".repeat(110));
console.log(" METADATA + JSON-LD AUDIT — Ten Toes KS-Astro");
console.log("=".repeat(110) + "\n");
console.log(`Pages audited: ${reports.length}  |  Generated: ${new Date().toISOString().slice(0, 10)}\n`);

// Summary
const critTotal = reports.reduce((s, r) => s + r.issues.critical.length, 0);
const warnTotal = reports.reduce((s, r) => s + r.issues.warning.length, 0);
const infoTotal = reports.reduce((s, r) => s + r.issues.info.length, 0);
const pagesClean = reports.filter(r => r.issues.critical.length === 0 && r.issues.warning.length === 0).length;
console.log(`Issues:  ${critTotal} critical · ${warnTotal} warning · ${infoTotal} info`);
console.log(`Pages with 0 critical+warning issues: ${pagesClean} / ${reports.length}\n`);

// Per-page table
console.log("=".repeat(110));
console.log(" PER-PAGE METADATA");
console.log("=".repeat(110) + "\n");
const PAD = { route: 54, tlen: 5, dlen: 5, sch: 4, types: 8, crit: 4, warn: 4 };
console.log(
  "Route".padEnd(PAD.route) +
  "Tlen".padStart(PAD.tlen) + " " +
  "Dlen".padStart(PAD.dlen) + " " +
  "Sch".padStart(PAD.sch) + " " +
  "Types".padStart(PAD.types) + " " +
  "Crit".padStart(PAD.crit) + " " +
  "Warn".padStart(PAD.warn)
);
console.log("-".repeat(110));
for (const r of reports) {
  console.log(
    r.route.padEnd(PAD.route) +
    String(r.titleLen).padStart(PAD.tlen) + " " +
    String(r.descLen).padStart(PAD.dlen) + " " +
    String(r.schemaCount).padStart(PAD.sch) + " " +
    String(r.nodeCount).padStart(PAD.types) + " " +
    String(r.issues.critical.length).padStart(PAD.crit) + " " +
    String(r.issues.warning.length).padStart(PAD.warn)
  );
}

// Schema type frequency
console.log("\n" + "=".repeat(110));
console.log(" JSON-LD SCHEMA TYPE FREQUENCY (across all pages)");
console.log("=".repeat(110) + "\n");
const typeFreq = new Map();
for (const r of reports) for (const t of r.schemaTypes) typeFreq.set(t, (typeFreq.get(t) || 0) + 1);
for (const [t, n] of [...typeFreq.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(3)}×  ${t}`);
}

// Duplicates
console.log("\n" + "=".repeat(110));
console.log(" DUPLICATES");
console.log("=".repeat(110) + "\n");
if (duplicateTitles.length === 0) console.log("  ✓ All titles unique");
else {
  console.log("  Duplicate titles:");
  for (const [t, routes] of duplicateTitles) console.log(`    "${t}"\n      → ${routes.join(", ")}`);
}
if (duplicateDescs.length === 0) console.log("  ✓ All descriptions unique");
else {
  console.log("\n  Duplicate descriptions:");
  for (const [d, routes] of duplicateDescs) {
    console.log(`    "${d.slice(0, 80)}..."`);
    console.log(`      → ${routes.join(", ")}`);
  }
}

// Critical issues
console.log("\n" + "=".repeat(110));
console.log(" CRITICAL ISSUES (must fix)");
console.log("=".repeat(110) + "\n");
const critPages = reports.filter(r => r.issues.critical.length > 0);
if (critPages.length === 0) console.log("  ✓ No critical issues");
else {
  for (const r of critPages) {
    console.log(`  ${r.route}`);
    for (const i of r.issues.critical) console.log(`    ✗ ${i}`);
  }
}

// Warnings
console.log("\n" + "=".repeat(110));
console.log(" WARNINGS (fix when convenient)");
console.log("=".repeat(110) + "\n");
const warnPages = reports.filter(r => r.issues.warning.length > 0);
if (warnPages.length === 0) console.log("  ✓ No warnings");
else {
  for (const r of warnPages) {
    console.log(`  ${r.route}`);
    for (const i of r.issues.warning) console.log(`    ⚠ ${i}`);
  }
}

// Cross-cutting pattern counts
console.log("\n" + "=".repeat(110));
console.log(" CROSS-CUTTING ISSUE PATTERNS");
console.log("=".repeat(110) + "\n");
const issuePatterns = new Map();
for (const r of reports) {
  for (const lvl of ["critical", "warning", "info"]) {
    for (const i of r.issues[lvl]) {
      const key = i.replace(/\d+/g, "N").replace(/"[^"]*"/g, '"X"').replace(/\([^)]+\)/g, "(X)");
      issuePatterns.set(key, (issuePatterns.get(key) || 0) + 1);
    }
  }
}
for (const [issue, n] of [...issuePatterns.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)) {
  console.log(`  ${String(n).padStart(3)}×  ${issue}`);
}

// Length distribution stats
console.log("\n" + "=".repeat(110));
console.log(" LENGTH DISTRIBUTIONS");
console.log("=".repeat(110) + "\n");
const titles = reports.map(r => r.titleLen);
const descs = reports.map(r => r.descLen);
const stats = (arr) => {
  const sorted = [...arr].sort((a, b) => a - b);
  return {
    min: sorted[0], max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
    mean: (arr.reduce((s, n) => s + n, 0) / arr.length).toFixed(1),
  };
};
const ts = stats(titles), ds = stats(descs);
console.log(`Title length:  min ${ts.min}  median ${ts.median}  mean ${ts.mean}  max ${ts.max}   (ideal 50-60)`);
console.log(`Desc length:   min ${ds.min}  median ${ds.median}  mean ${ds.mean}  max ${ds.max}   (ideal 140-160)`);
const ovrLong = reports.filter(r => r.titleLen > 60).length;
const tooShort = reports.filter(r => r.titleLen < 30).length;
const descOver = reports.filter(r => r.descLen > 170).length;
const descUnder = reports.filter(r => r.descLen < 110).length;
console.log(`Titles >60c:   ${ovrLong}    Titles <30c:   ${tooShort}`);
console.log(`Descs >170c:   ${descOver}    Descs <110c:   ${descUnder}`);

// MD report
if (EMIT_MD) {
  const outDir = path.resolve("scripts/audit/reports");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "metadata-scorecard.md");
  let md = `# Metadata + JSON-LD Audit — Ten Toes KS-Astro\n\n_Generated ${new Date().toISOString().slice(0, 10)}_\n\n`;
  md += `**Summary:** ${critTotal} critical · ${warnTotal} warning · ${infoTotal} info  ·  ${pagesClean}/${reports.length} pages clean\n\n`;
  md += `## Per-page metadata\n\n| Route | Title len | Desc len | JSON-LD blocks | Schema nodes | Crit | Warn |\n|---|---:|---:|---:|---:|---:|---:|\n`;
  for (const r of reports) {
    md += `| ${r.route} | ${r.titleLen} | ${r.descLen} | ${r.schemaCount} | ${r.nodeCount} | ${r.issues.critical.length} | ${r.issues.warning.length} |\n`;
  }
  md += `\n## Schema type frequency\n\n`;
  for (const [t, n] of [...typeFreq.entries()].sort((a, b) => b[1] - a[1])) {
    md += `- \`${t}\` × ${n}\n`;
  }
  fs.writeFileSync(outPath, md);
  console.log(`\n✔ Markdown report written to ${path.relative(process.cwd(), outPath)}`);
}
