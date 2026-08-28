/**
 * SEO + GEO scoring engine per seo-geo-claude-skills/on-page-seo-auditor v9.9.9.
 *
 * Weighted scorecard (100 pts):
 *   Title 15 | Meta 5 | Headers 10 | Content 25 | Keywords 15 | Links 10 | Images 10 | Technical 10
 *
 * GEO layer (separate 100-pt score):
 *   FactualDensity 25 | DirectAnswer 20 | Citations 20 | Schema 20 | QuotableFacts 15
 *
 * SERP Features layer (separate 100-pt score — readiness for non-blue-link SERP slots):
 *   FAQ rich result 10 | PAA question-headings 10 | Snippet paragraph 15 |
 *   Snippet list 10 | Snippet table 10 | Breadcrumb 5 | Review stars 10 |
 *   Image pack 10 | Local pack 10 | Speakable 5 | Social cards 5
 *
 * Primary-keyword signal: author-declared <meta name="keywords"> wins (first entry
 * that actually occurs in the body); falls back to H1 2/3-gram density inference.
 *
 * Cluster benchmarks per scoring-rubric.md (content length by query type):
 *   Informational: 1500+ full / 500-1499 partial / <500 poor
 *   Commercial:    1200+ full / 400-1199 partial / <400 poor
 *   Transactional: 500+  full / 200-499  partial / <200 poor
 *   Local:         400+  full / 150-399  partial / <150 poor
 *
 * Four CONFIGURE blocks below need per-project values: #0 project identity,
 * #1 route→cluster map, #2 authority domains, #3 cluster display order.
 *
 * Usage: node scripts/audit/seo-geo-score.mjs [--md] [--json] [--only=<substr>[,<substr>]]
 */

import fs from "node:fs";
import path from "node:path";

// =============================================================================
// CONFIGURE #0: project identity.
//   PROJECT   — label printed on the scorecard header + markdown report
//   HOST      — bare hostname; links containing it count as internal
//   BRAND_RE  — brand token expected in every <title> (title scoring -1 if absent)
//   TITLE_SUFFIX_RE — brand/price suffix stripped before keyword inference
// =============================================================================
const PROJECT = "Ten Toes KS-Astro";
const HOST = "tentoeskansas.com";
const BRAND_RE = /\bten toes\b/i;
const TITLE_SUFFIX_RE = /\s*[|·•]\s*ten toes.*$/i;

const DIST = path.resolve("dist");
const EMIT_MD = process.argv.includes("--md");
const EMIT_JSON = process.argv.includes("--json");
const ONLY_ARG = process.argv.find((a) => a.startsWith("--only="));

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "in", "on", "at", "to", "for", "with",
  "by", "from", "is", "are", "was", "were", "be", "been", "being", "this", "that",
  "these", "those", "it", "its", "as", "you", "your", "we", "our", "us", "i", "me",
  "my", "they", "them", "their", "what", "which", "who", "whom", "whose", "when",
  "where", "why", "how", "do", "does", "did", "will", "would", "should", "could",
  "can", "may", "might", "must", "have", "has", "had", "if", "then", "than", "so",
  "not", "no", "yes", "all", "any", "some", "more", "most", "less", "few", "many",
  "much", "very", "just", "also", "too", "only", "even", "still", "again", "back",
  "out", "up", "down", "off", "over", "under", "into", "onto", "about", "after",
  "before", "between", "through",
]);

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== "_astro") out.push(...walk(full));
    else if (e.isFile() && e.name === "index.html") out.push(full);
  }
  return out;
}

// =============================================================================
// CONFIGURE #1: route-to-cluster mapping for the target project.
//   queryType ∈ {transactional, commercial, informational, local}
//   floor    = minimum acceptable body word count (per seo-geo rubric §Benchmarks)
//     informational: 1500+ ideal · 500-1499 partial · <500 thin
//     commercial:    1200+ ideal · 400-1199 partial · <400 thin
//     transactional: 500+  ideal · 200-499  partial · <200 thin
//     local:         400+  ideal · 150-399  partial · <150 thin
// The default below is from the Ten Toes Reflexology project. Adjust to your IA.
// =============================================================================
function inferCluster(route) {
  if (route === "/") return { cluster: "hub-home", queryType: "transactional", floor: 500 };
  if (route === "/services/") return { cluster: "hub-services", queryType: "commercial", floor: 800 };
  if (route === "/services/massage/") return { cluster: "hub-services", queryType: "commercial", floor: 1200 };
  if (route === "/guides/") return { cluster: "hub-guides", queryType: "informational", floor: 500 };
  if (route === "/lawrence/massage/") return { cluster: "lawrence-hub", queryType: "local", floor: 1200 };
  if (route.startsWith("/services/")) return { cluster: "service", queryType: "commercial", floor: 1200 };
  if (route.startsWith("/guides/")) return { cluster: "guide", queryType: "informational", floor: 1500 };
  if (route.startsWith("/lawrence/")) return { cluster: "lawrence-seo", queryType: "local", floor: 800 };
  if (["/about/", "/contact/", "/faq/", "/gift-cards/", "/vip-membership/", "/reviews/"].includes(route))
    return { cluster: "conversion", queryType: "transactional", floor: 400 };
  return { cluster: "misc", queryType: "informational", floor: 300 };
}

function decode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function stripChrome(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<head[\s\S]*?<\/head>/g, "")
    .replace(/<svg[\s\S]*?<\/svg>/g, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "");
}

function plainText(html) {
  return decode(stripChrome(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function tokenize(text) {
  return text.toLowerCase().match(/[a-z][a-z'\-]{1,}/g) || [];
}

function topNGrams(tokens, n, k = 20) {
  const counts = new Map();
  for (let i = 0; i + n <= tokens.length; i++) {
    const grams = tokens.slice(i, i + n);
    if (grams.some(t => STOPWORDS.has(t) || t.length < 3)) continue;
    const key = grams.join(" ");
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, k);
}

// Tokens that prefix H1s but rarely belong in the SEO primary keyword
const KW_ADJ_PREFIX = new Set([
  "the", "a", "an", "your", "our", "professional", "complete", "best", "top",
  "top-rated", "ultimate", "honest", "real", "genuine", "trusted", "expert",
  "premium", "luxury", "ten", "toes", "welcome", "visit", "contact", "about",
  "frequently", "asked",
]);

function inferPrimaryKeyword(title, h1, bodyTokens, declared = [], route = "") {
  // Author-declared <meta name="keywords"> is the primary signal (ported from the
  // ascending-js-next generation of this script). Eligibility: the phrase must
  // actually occur in the body at least once (a declared keyword with zero
  // on-page presence is meta-only stuffing, not the page's topic). Rank by
  // on-page footprint; slug hits weigh heavily. Brand entries are skipped;
  // bare single tokens only compete when no multi-word phrase is declared.
  const bodyStrD = bodyTokens.join(" ");
  const titleLowerD = (title || "").toLowerCase();
  const h1LowerD = (h1 || "").toLowerCase();
  const routeLowerD = route.toLowerCase().replace(/[-/]/g, " ");
  const occD = (phrase) => {
    const re = new RegExp("\\b" + phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g");
    return (bodyStrD.match(re) || []).length;
  };
  const cands = declared
    .map((k) => k.toLowerCase().trim())
    .filter((k) => k.length > 2 && !BRAND_RE.test(k));
  const multi = cands.filter((k) => k.includes(" "));
  let bestDecl = "", bestDeclScore = 0;
  for (const c of (multi.length ? multi : cands)) {
    const bodyOcc = occD(c);
    if (bodyOcc === 0) continue;
    const toks = c.split(/\s+/).filter((t) => t.length > 2);
    const score = bodyOcc * 3 +
      (titleLowerD.includes(c) ? 8 : 0) + (h1LowerD.includes(c) ? 5 : 0) +
      (routeLowerD.includes(c) ? 10 : 0) +
      toks.filter((t) => titleLowerD.includes(t)).length * 2 +
      toks.filter((t) => routeLowerD.includes(t)).length * 2 +
      toks.filter((t) => h1LowerD.includes(t)).length;
    if (score > bestDeclScore) { bestDecl = c; bestDeclScore = score; }
  }
  if (bestDecl) return bestDecl;

  // Fallback: H1 is the canonical signal. Strategy: clean H1, slide a 2/3-token
  // window, pick the highest-density-in-body candidate that's also present in
  // title. Drops generic adjectival prefixes ("Professional Foot Reflexology
  // in..." → pick "foot reflexology" not "professional foot").
  const cleanHeader = (s) => (s || "").toLowerCase()
    .replace(TITLE_SUFFIX_RE, "")
    .replace(/\s*[|·•]\s*from\s*\$\d+.*$/i, "")
    .replace(/\s*[|·•].*$/i, "")
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/[—–-]\s.*$/, "")
    .replace(/[^\w\s'\-]/g, " ")
    .trim();
  const filterToks = (s) => s.split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t) && !KW_ADJ_PREFIX.has(t));
  const h1c = cleanHeader(h1);
  const titlec = cleanHeader(title);
  let toks = filterToks(h1c);
  if (toks.length < 2) toks = filterToks(titlec);
  if (toks.length === 0) {
    // Last fallback — accept adj-prefix tokens
    toks = (h1c + " " + titlec).split(/\s+/).filter(t => t.length > 1 && !STOPWORDS.has(t));
  }
  if (toks.length === 0) return "";
  if (toks.length === 1) return toks[0];

  const bodyStr = bodyTokens.join(" ");
  const titleLower = title.toLowerCase();
  const occ = (phrase) => {
    const re = new RegExp("\\b" + phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g");
    return (bodyStr.match(re) || []).length;
  };

  // Build all 2- and 3-token candidates from sliding window of cleaned H1 tokens
  const candidates = [];
  for (let i = 0; i < toks.length - 1; i++) {
    candidates.push(toks.slice(i, i + 2).join(" "));
    if (i < toks.length - 2) candidates.push(toks.slice(i, i + 3).join(" "));
  }

  // Score each: bodyOccurrences + 5 bonus if title contains it
  let best = candidates[0], bestScore = -1;
  for (const c of candidates) {
    const inTitle = titleLower.includes(c) ? 5 : 0;
    const score = occ(c) + inTitle;
    if (score > bestScore || (score === bestScore && c.split(" ").length > best.split(" ").length)) {
      best = c;
      bestScore = score;
    }
  }
  return best;
}

// Token-overlap presence check (handles word-order differences and partial matches)
function phrasePresent(needle, haystack) {
  if (!needle) return false;
  const n = needle.toLowerCase();
  const h = haystack.toLowerCase();
  // exact phrase
  if (h.includes(n)) return true;
  // all tokens present (handles "foot reflexology" vs "reflexology in feet")
  const toks = n.split(/\s+/).filter(t => t.length > 2);
  if (toks.length === 0) return false;
  return toks.every(t => h.includes(t));
}

function audit(file) {
  const html = fs.readFileSync(file, "utf8");
  const route = "/" + path.relative(DIST, file).replace(/\\/g, "/").replace(/index\.html$/, "");
  const { cluster, queryType, floor } = inferCluster(route);

  // === Extract structured signals ===
  const title = decode((html.match(/<title>([^<]*)<\/title>/) || [, ""])[1]);
  const desc = decode((html.match(/<meta\s+name="description"\s+content="([^"]*)"/) || [, ""])[1]);
  const metaKwRaw = decode((html.match(/<meta\s+name="keywords"\s+content="([^"]*)"/) || [, ""])[1]);
  const declaredKeywords = metaKwRaw ? metaKwRaw.split(",").map(s => s.trim()).filter(Boolean) : [];
  const canonical = (html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/) || [, ""])[1];
  const robots = (html.match(/<meta\s+name="robots"\s+content="([^"]*)"/) || [, ""])[1];
  const ogImage = (html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/) || [, ""])[1];
  const themeColor = (html.match(/<meta\s+name="theme-color"/) || [])[0] || "";
  const viewport = (html.match(/<meta\s+name="viewport"/) || [])[0] || "";

  const h1Matches = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => decode(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()));
  const h2Matches = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => decode(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()));
  const h3Matches = [...html.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi)].map(m => decode(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()));

  const body = plainText(html);
  const wordCount = (body.match(/\b\w+\b/g) || []).length;
  const tokens = tokenize(body);

  // Count only body-section images (skip header/footer/nav logos which are global chrome).
  // stripChrome already removed header/footer/nav.
  const allImages = [...stripChrome(html).matchAll(/<img\b([^>]*)>/gi)];
  const imgWithAlt = allImages.filter(m => /alt="[^"]+"/.test(m[1]));
  const imgEmptyAlt = allImages.filter(m => /alt=""/.test(m[1]));
  const imgWebp = allImages.filter(m => /\.(webp|avif|svg)/i.test(m[1]));
  // Treat fetchpriority="high" hero images as "modern handling" equivalent to lazy
  // (above-fold hero MUST be eager — penalizing it is incorrect)
  const imgLazy = allImages.filter(m => /loading="lazy"/.test(m[1]) || /fetchpriority="high"/.test(m[1]));

  // Internal vs external links — exclude header/footer (already stripped) so the count is in-content
  const cleanedHtml = stripChrome(html);
  const aTags = [...cleanedHtml.matchAll(/<a\b([^>]*?)>([\s\S]*?)<\/a>/gi)];
  const linkObjs = aTags.map(m => {
    const href = (m[1].match(/href="([^"]+)"/) || [, ""])[1];
    const text = decode(m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    return { href, text };
  }).filter(l => l.href && !l.href.startsWith("#") && !l.href.startsWith("javascript:") && !l.href.startsWith("mailto:") && !l.href.startsWith("tel:"));
  const internalLinks = linkObjs.filter(l => l.href.startsWith("/") || l.href.includes(HOST));
  const externalLinks = linkObjs.filter(l => !l.href.startsWith("/") && !l.href.includes(HOST));

  // JSON-LD schema types
  const jsonLdBlocks = [...html.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  const schemaTypes = new Set();
  for (const block of jsonLdBlocks) {
    try {
      const parsed = JSON.parse(block);
      const visit = (node) => {
        if (!node) return;
        if (Array.isArray(node)) { node.forEach(visit); return; }
        if (typeof node !== "object") return;
        if (node["@type"]) {
          if (Array.isArray(node["@type"])) node["@type"].forEach(t => schemaTypes.add(t));
          else schemaTypes.add(node["@type"]);
        }
        // Recurse into every nested value so types inside hasOfferCatalog,
        // speakable, mainEntity etc. register too (not just top-level @graph).
        for (const v of Object.values(node)) {
          if (v && typeof v === "object") visit(v);
        }
      };
      visit(parsed);
    } catch { /* malformed JSON-LD — flag separately if needed */ }
  }

  // Primary keyword — author-declared meta keywords first, else H1 n-gram density
  const primary = inferPrimaryKeyword(title, h1Matches[0], tokens, declaredKeywords, route);
  const primaryTokens = primary.split(/\s+/).filter(t => t.length > 2);
  const phraseLower = primary.toLowerCase();
  const bodyLower = body.toLowerCase();
  const phraseCount = phraseLower ? (bodyLower.split(phraseLower).length - 1) : 0;
  const density = wordCount > 0 ? (phraseCount * primaryTokens.length / wordCount) * 100 : 0;

  // Keyword presence — token-overlap (lenient, handles word-order)
  const titleHasKw = phrasePresent(primary, title);
  const h1HasKw = h1Matches[0] ? phrasePresent(primary, h1Matches[0]) : false;
  const metaHasKw = phrasePresent(primary, desc);
  const urlHasKw = primaryTokens.length > 0 && primaryTokens.some(t => route.toLowerCase().includes(t));
  const first100 = tokens.slice(0, 100).join(" ");
  const first100HasKw = primaryTokens.some(t => first100.includes(t));

  // GEO signals
  const numericFacts = (body.match(/\b\d+(?:[,.]\d+)*(?:%|\s*(?:minutes?|min|hours?|hr|years?|sessions?|customers?|reviews?|degrees?|°F|°C|sq\.?\s*ft|miles?|mi|seconds?|days?))?\b/g) || []).length;
  const dollarFacts = (body.match(/\$\d+/g) || []).length;
  const namedEntities = (body.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){0,3}\b/g) || []).length;
  // CONFIGURE #2: authority-domain regex. Outbound links matching are counted as
  // E-E-A-T / GEO citation signal. Universal anchors (.gov / .edu / mayoclinic /
  // clevelandclinic / pubmed / NIH subdomains) are kept; append project-specific
  // domains for your vertical (legal: /aba\.org|justia\.com/, cloud/B2B:
  // /aws\.amazon\.com|kubernetes\.io|cncf\.io|nist\.gov/).
  const authorityLinks = externalLinks.filter(l => /(\.gov|\.edu|nccih\.nih|ncbi\.nlm|mayoclinic|webmd|harvard|cleveland|kuathletics|sportingkc|kcmo\.gov|nih\.gov|amtamassage|acog\.org|aafp\.org|hopkinsmedicine|massagemag|pubmed|aad\.org|sleepfoundation\.org|apa\.org)/.test(l.href)).length;
  const faqSchema = schemaTypes.has("FAQPage");
  const hasArticleSchema = schemaTypes.has("Article");
  const hasServiceSchema = schemaTypes.has("Service");
  const hasBreadcrumb = schemaTypes.has("BreadcrumbList");

  // === SEO SCORING (100 pts weighted) ===
  // Title /15
  let titleScore = 15;
  const titleIssues = [];
  if (!title) { titleScore = 0; titleIssues.push("MISSING title"); }
  else {
    if (title.length < 30) { titleScore -= 4; titleIssues.push(`short (${title.length}c)`); }
    else if (title.length > 70) { titleScore -= 3; titleIssues.push(`too long (${title.length}c)`); }
    else if (title.length > 60) { titleScore -= 1; titleIssues.push(`>60c (${title.length}c)`); }
    if (!titleHasKw) { titleScore -= 4; titleIssues.push("primary kw missing"); }
    if (!BRAND_RE.test(title)) { titleScore -= 1; titleIssues.push("no brand"); }
  }
  // Meta /5
  let metaScore = 5;
  const metaIssues = [];
  if (!desc) { metaScore = 0; metaIssues.push("MISSING meta"); }
  else {
    if (desc.length < 110) { metaScore -= 2; metaIssues.push(`short (${desc.length}c)`); }
    else if (desc.length > 170) { metaScore -= 2; metaIssues.push(`too long (${desc.length}c)`); }
    if (!metaHasKw) { metaScore -= 1; metaIssues.push("no kw"); }
    if (!/(book|call|visit|reserve|today|near|find|learn|discover|walk-in)/i.test(desc)) { metaScore -= 1; metaIssues.push("no CTA"); }
  }
  // Headers /10
  let headerScore = 10;
  const headerIssues = [];
  if (h1Matches.length === 0) { headerScore -= 6; headerIssues.push("NO h1"); }
  else if (h1Matches.length > 1) { headerScore -= 3; headerIssues.push(`${h1Matches.length} h1`); }
  if (h2Matches.length < 3) { headerScore -= 2; headerIssues.push(`only ${h2Matches.length} h2`); }
  if (h2Matches.length > 0 && h3Matches.length === 0 && wordCount > 800) { headerScore -= 1; headerIssues.push("no h3 in long page"); }
  if (!h1HasKw && h1Matches[0]) { headerScore -= 2; headerIssues.push("h1 no kw"); }
  // Content /25
  let contentScore = 25;
  const contentIssues = [];
  // Full marks at the rubric benchmark for the query type (informational: 1500+,
  // others: at the cluster floor). The old floor*1.5 extra was stricter than rubric.
  const fullAt = queryType === "informational" ? Math.max(floor, 1500) : floor;
  if (wordCount < floor * 0.4) { contentScore -= 18; contentIssues.push(`THIN ${wordCount}w (floor ${floor})`); }
  else if (wordCount < floor) { contentScore -= 8; contentIssues.push(`below floor ${wordCount}w (need ${floor})`); }
  else if (wordCount < fullAt) contentScore -= 2;
  // formatting check
  const paraCount = (cleanedHtml.match(/<p\b/gi) || []).length;
  if (paraCount < 5 && wordCount > 500) { contentScore -= 3; contentIssues.push(`only ${paraCount} <p>`); }
  if (faqSchema || (h2Matches.some(h => /faq|question/i.test(h)))) {} else if (wordCount > 800) { contentScore -= 2; contentIssues.push("no FAQ section"); }
  // E-E-A-T light signals
  const hasLicensedMention = /\b(licensed|certified|insured|years of experience|lmt|board-certified)\b/i.test(body);
  if (!hasLicensedMention) { contentScore -= 1; contentIssues.push("no expertise signal"); }
  // Keywords /15
  let kwScore = 15;
  const kwIssues = [];
  if (!titleHasKw) { kwScore -= 3; kwIssues.push("kw not in title"); }
  if (!h1HasKw) { kwScore -= 2; kwIssues.push("kw not in h1"); }
  if (!first100HasKw) { kwScore -= 2; kwIssues.push("kw not in first 100w"); }
  if (!urlHasKw) { kwScore -= 1; kwIssues.push("kw not in URL"); }
  if (!metaHasKw) { kwScore -= 1; kwIssues.push("kw not in meta"); }
  if (density > 3) { kwScore -= 3; kwIssues.push(`stuff ${density.toFixed(2)}%`); }
  else if (density < 0.3 && wordCount > 500) { kwScore -= 2; kwIssues.push(`thin ${density.toFixed(2)}%`); }
  // Links /10
  let linkScore = 10;
  const linkIssues = [];
  const idealMin = wordCount < 500 ? 2 : wordCount < 1000 ? 3 : wordCount < 2000 ? 4 : 5;
  if (internalLinks.length < idealMin) { linkScore -= 4; linkIssues.push(`only ${internalLinks.length} internal`); }
  if (externalLinks.length === 0 && wordCount > 800) { linkScore -= 2; linkIssues.push("no external"); }
  // anchor variety
  const anchorTexts = new Set(internalLinks.map(l => l.text.toLowerCase()));
  if (anchorTexts.size < internalLinks.length * 0.5 && internalLinks.length > 8) { linkScore -= 1; linkIssues.push("repetitive anchors"); }
  const genericAnchors = internalLinks.filter(l => /^(click here|here|read more|learn more)$/i.test(l.text.trim())).length;
  if (genericAnchors > 2) { linkScore -= 2; linkIssues.push(`${genericAnchors} generic anchors`); }
  // Images /10
  let imgScore = 10;
  const imgIssues = [];
  if (allImages.length === 0) { imgScore -= 3; imgIssues.push("no images"); }
  else {
    const missingAlt = allImages.length - imgWithAlt.length - imgEmptyAlt.length;
    if (missingAlt > 0) { imgScore -= 3; imgIssues.push(`${missingAlt} missing alt`); }
    const webpRatio = imgWebp.length / allImages.length;
    if (webpRatio < 0.5) { imgScore -= 2; imgIssues.push(`${(webpRatio * 100).toFixed(0)}% modern format`); }
    const lazyRatio = imgLazy.length / allImages.length;
    if (lazyRatio < 0.5) { imgScore -= 1; imgIssues.push(`${(lazyRatio * 100).toFixed(0)}% lazy`); }
  }
  // Technical /10
  let techScore = 10;
  const techIssues = [];
  if (!canonical) { techScore -= 3; techIssues.push("NO canonical"); }
  if (!viewport) { techScore -= 2; techIssues.push("no viewport"); }
  if (!themeColor) techScore -= 0;
  if (!ogImage) { techScore -= 1; techIssues.push("no og:image"); }
  if (schemaTypes.size === 0) { techScore -= 3; techIssues.push("no schema"); }
  else {
    if (!schemaTypes.has("LocalBusiness") && !schemaTypes.has("DaySpa") && !schemaTypes.has("Organization")) {
      techScore -= 1; techIssues.push("no org/local schema");
    }
    if (cluster === "guide" && !hasArticleSchema) { techScore -= 1; techIssues.push("guide missing Article schema"); }
    if (cluster === "service" && !hasServiceSchema) { techScore -= 1; techIssues.push("service missing Service schema"); }
    if (!hasBreadcrumb && route !== "/") { techScore -= 1; techIssues.push("no breadcrumb"); }
  }
  if (/noindex/i.test(robots)) { techScore -= 2; techIssues.push("noindex"); }

  // Clamp
  const clamp = (n, max) => Math.max(0, Math.min(max, n));
  titleScore = clamp(titleScore, 15);
  metaScore = clamp(metaScore, 5);
  headerScore = clamp(headerScore, 10);
  contentScore = clamp(contentScore, 25);
  kwScore = clamp(kwScore, 15);
  linkScore = clamp(linkScore, 10);
  imgScore = clamp(imgScore, 10);
  techScore = clamp(techScore, 10);
  const seoTotal = titleScore + metaScore + headerScore + contentScore + kwScore + linkScore + imgScore + techScore;

  // === GEO SCORING (100 pts) ===
  // FactualDensity /25 — numeric/dollar facts per 100 words
  const factsPer100 = wordCount > 0 ? ((numericFacts + dollarFacts) / wordCount) * 100 : 0;
  let geoFactual = Math.min(25, Math.round(factsPer100 * 5));
  // DirectAnswer /20 — does the first 200w of body contain a definition statement (X is Y / X means Y)?
  const lead = body.slice(0, 1200);
  const hasDefinition = /\b(?:is|means|refers to|involves|describes|consists of)\b/i.test(lead);
  const hasNumberedAnswer = /\b(?:30\s*minutes?|60\s*minutes?|90\s*minutes?|\$\d+|9\s*am|9:?30\s*pm)\b/i.test(lead);
  let geoDirect = (hasDefinition ? 12 : 0) + (hasNumberedAnswer ? 8 : 0);
  // Citations /20 — authoritative outbound links + named-author bylines + named entities
  let geoCite = Math.min(20, authorityLinks * 8 + Math.min(8, Math.floor(externalLinks.length / 2)));
  // Schema /20 — JSON-LD coverage (LocalBusiness baseline; +Article/Service/FAQ/Breadcrumb each adds)
  let geoSchema = 0;
  if (schemaTypes.has("LocalBusiness") || schemaTypes.has("DaySpa")) geoSchema += 8;
  if (faqSchema) geoSchema += 4;
  if (hasArticleSchema) geoSchema += 3;
  if (hasServiceSchema) geoSchema += 3;
  if (hasBreadcrumb) geoSchema += 2;
  geoSchema = Math.min(20, geoSchema);
  // QuotableFacts /15 — H2/H3 are good "quote anchors" + structured lists
  const ulCount = (cleanedHtml.match(/<ul\b/gi) || []).length;
  const olCount = (cleanedHtml.match(/<ol\b/gi) || []).length;
  const tableCount = (cleanedHtml.match(/<table\b/gi) || []).length;
  let geoQuote = Math.min(15, h2Matches.length + h3Matches.length * 0.5 + ulCount + olCount * 2 + tableCount * 3);
  geoQuote = Math.round(geoQuote);
  const geoTotal = geoFactual + geoDirect + geoCite + geoSchema + geoQuote;

  // === SERP FEATURES SCORING (100 pts) — readiness for non-blue-link SERP slots ===
  // FAQ rich result /10 — FAQPage schema + ≥4 Question nodes
  const faqQuestionCount = jsonLdBlocks.reduce(
    (n, b) => n + (b.match(/"@type"\s*:\s*"Question"/g) || []).length, 0);
  const serpFaq = (faqSchema ? 6 : 0) + (faqQuestionCount >= 4 ? 4 : faqQuestionCount >= 2 ? 2 : 0);
  // PAA alignment /10 — question-format headings (h2/h3/dt ending in "?")
  const dtMatches = [...cleanedHtml.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>/gi)]
    .map(m => decode(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()));
  const questionHeads = [...h2Matches, ...h3Matches, ...dtMatches].filter(h => /\?/.test(h)).length;
  const serpPaa = questionHeads >= 5 ? 10 : questionHeads >= 3 ? 7 : questionHeads >= 1 ? 3 : 0;
  // Featured-snippet paragraph /15 — a 35-75 word paragraph directly after an h2/h3
  const headingParas = [...cleanedHtml.matchAll(/<\/h[23]>\s*(?:<[^>p][^>]*>\s*)*?<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(m => decode(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()));
  const snippetParas = headingParas.filter(t => {
    const w = t.split(/\s+/).filter(Boolean).length;
    return w >= 35 && w <= 75;
  }).length;
  const serpPara = snippetParas >= 2 ? 15 : snippetParas === 1 ? 10 : 0;
  // List snippet /10 — ≥1 ordered list with ≥3 items
  const olRich = [...cleanedHtml.matchAll(/<ol\b[^>]*>([\s\S]*?)<\/ol>/gi)]
    .filter(m => (m[1].match(/<li\b/gi) || []).length >= 3).length;
  const serpList = olRich >= 1 ? 10 : 0;
  // Table snippet /10 — ≥1 table with ≥3 rows
  const tableRich = [...cleanedHtml.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)]
    .filter(m => (m[1].match(/<tr\b/gi) || []).length >= 3).length;
  const serpTable = tableRich >= 1 ? 10 : 0;
  // Breadcrumb display /5 · Review stars /10 · Speakable /5
  const serpCrumb = hasBreadcrumb ? 5 : 0;
  const serpStars = schemaTypes.has("AggregateRating") ? 10 : 0;
  const serpSpeak = schemaTypes.has("SpeakableSpecification") ? 5 : 0;
  // Image pack /10 — ≥2 body images with descriptive alt (≥30 chars)
  const richAltImgs = allImages.filter(m => ((m[1].match(/alt="([^"]*)"/) || [, ""])[1] || "").length >= 30).length;
  const serpImage = richAltImgs >= 2 ? 10 : richAltImgs === 1 ? 5 : 0;
  // Local pack /10 — LocalBusiness carrying geo + opening hours
  const serpLocal = jsonLdBlocks.some(b => /"geo"/.test(b) && /openingHoursSpecification/i.test(b)) ? 10 : 0;
  // Social cards /5 — og:image + twitter card
  const serpSocial = (ogImage ? 3 : 0) + (/<meta\s+name="twitter:card"/.test(html) ? 2 : 0);
  const serpTotal = serpFaq + serpPaa + serpPara + serpList + serpTable + serpCrumb +
    serpStars + serpImage + serpLocal + serpSpeak + serpSocial;

  return {
    route, cluster, queryType, floor,
    title: { value: title, length: title.length, score: titleScore, issues: titleIssues },
    meta:  { value: desc, length: desc.length, score: metaScore, issues: metaIssues },
    headers: { h1: h1Matches.length, h2: h2Matches.length, h3: h3Matches.length, score: headerScore, issues: headerIssues },
    content: { words: wordCount, paragraphs: paraCount, score: contentScore, issues: contentIssues },
    keywords: { primary, density: +density.toFixed(2), score: kwScore, issues: kwIssues },
    links: { internal: internalLinks.length, external: externalLinks.length, authority: authorityLinks, score: linkScore, issues: linkIssues },
    images: { total: allImages.length, alt: imgWithAlt.length, webp: imgWebp.length, lazy: imgLazy.length, score: imgScore, issues: imgIssues },
    technical: { canonical: !!canonical, schemaTypes: [...schemaTypes], score: techScore, issues: techIssues },
    seoTotal,
    geo: {
      factualDensity: geoFactual, directAnswer: geoDirect, citations: geoCite,
      schema: geoSchema, quotableFacts: geoQuote, total: geoTotal,
      authorityLinks, numericFacts, faqSchema,
    },
    serp: {
      faq: serpFaq, paa: serpPaa, snippetPara: serpPara, snippetList: serpList,
      snippetTable: serpTable, breadcrumb: serpCrumb, stars: serpStars,
      imagePack: serpImage, localPack: serpLocal, speakable: serpSpeak,
      social: serpSocial, total: serpTotal,
      questionHeads, snippetParas, faqQuestionCount, richAltImgs,
    },
  };
}

function gradeOf(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

// === RUN ===
const files = walk(DIST);
const reports = files.map(audit).sort((a, b) => a.route.localeCompare(b.route));

// Per-page table
console.log("\n=================================================================================");
console.log(` SEO + GEO + SERP SCORECARD — ${PROJECT} — per seo-geo-claude-skills v9.9.9`);
console.log("=================================================================================\n");
console.log(`Pages audited: ${reports.length}  |  Generated: ${new Date().toISOString().slice(0, 10)}\n`);

const PAD = {
  route: 56, cluster: 14, words: 6, seo: 6, geo: 6, serp: 6, grade: 6,
};
console.log(
  "Route".padEnd(PAD.route) +
  "Cluster".padEnd(PAD.cluster) +
  "Words".padStart(PAD.words) + "  " +
  "SEO".padStart(PAD.seo) + "  " +
  "GEO".padStart(PAD.geo) + "  " +
  "SERP".padStart(PAD.serp) + "  " +
  "Grade".padStart(PAD.grade)
);
console.log("-".repeat(110));
for (const r of reports) {
  console.log(
    r.route.padEnd(PAD.route) +
    r.cluster.padEnd(PAD.cluster) +
    String(r.content.words).padStart(PAD.words) + "  " +
    String(r.seoTotal).padStart(PAD.seo) + "  " +
    String(r.geo.total).padStart(PAD.geo) + "  " +
    String(r.serp.total).padStart(PAD.serp) + "  " +
    gradeOf(r.seoTotal).padStart(PAD.grade)
  );
}

// Cluster aggregates
console.log("\n=================================================================================");
console.log(" CLUSTER AGGREGATES");
console.log("=================================================================================\n");
const byCluster = new Map();
for (const r of reports) {
  if (!byCluster.has(r.cluster)) byCluster.set(r.cluster, []);
  byCluster.get(r.cluster).push(r);
}
// CONFIGURE #3: cluster display order (any cluster not listed sorts to the end).
const clusterOrder = ["hub-home", "hub-services", "hub-guides", "lawrence-hub", "service", "guide", "lawrence-seo", "conversion"];
const sortedClusters = [...byCluster.keys()].sort((a, b) => {
  const ia = clusterOrder.indexOf(a), ib = clusterOrder.indexOf(b);
  return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
});
console.log("Cluster".padEnd(16) + "Pages".padStart(7) + "  " + "SEO avg".padStart(9) + "  " + "GEO avg".padStart(9) + "  " + "SERP avg".padStart(9) + "  " + "Min SEO".padStart(9) + "  " + "Min GEO".padStart(9));
console.log("-".repeat(84));
let globalSeoSum = 0, globalGeoSum = 0, globalSerpSum = 0;
for (const c of sortedClusters) {
  const pages = byCluster.get(c);
  const seoAvg = pages.reduce((s, r) => s + r.seoTotal, 0) / pages.length;
  const geoAvg = pages.reduce((s, r) => s + r.geo.total, 0) / pages.length;
  const serpAvg = pages.reduce((s, r) => s + r.serp.total, 0) / pages.length;
  const seoMin = Math.min(...pages.map(r => r.seoTotal));
  const geoMin = Math.min(...pages.map(r => r.geo.total));
  globalSeoSum += pages.reduce((s, r) => s + r.seoTotal, 0);
  globalGeoSum += pages.reduce((s, r) => s + r.geo.total, 0);
  globalSerpSum += pages.reduce((s, r) => s + r.serp.total, 0);
  console.log(c.padEnd(16) + String(pages.length).padStart(7) + "  " +
    seoAvg.toFixed(1).padStart(9) + "  " + geoAvg.toFixed(1).padStart(9) + "  " +
    serpAvg.toFixed(1).padStart(9) + "  " +
    String(seoMin).padStart(9) + "  " + String(geoMin).padStart(9));
}
console.log("-".repeat(84));
console.log("OVERALL".padEnd(16) + String(reports.length).padStart(7) + "  " +
  (globalSeoSum / reports.length).toFixed(1).padStart(9) + "  " +
  (globalGeoSum / reports.length).toFixed(1).padStart(9) + "  " +
  (globalSerpSum / reports.length).toFixed(1).padStart(9));

// Section average (where weakness lives)
console.log("\n=================================================================================");
console.log(" WEIGHTED SECTION AVERAGES (where weakness lives)");
console.log("=================================================================================\n");
const sectAvg = {
  Title: reports.reduce((s, r) => s + r.title.score, 0) / reports.length,
  Meta: reports.reduce((s, r) => s + r.meta.score, 0) / reports.length,
  Headers: reports.reduce((s, r) => s + r.headers.score, 0) / reports.length,
  Content: reports.reduce((s, r) => s + r.content.score, 0) / reports.length,
  Keywords: reports.reduce((s, r) => s + r.keywords.score, 0) / reports.length,
  Links: reports.reduce((s, r) => s + r.links.score, 0) / reports.length,
  Images: reports.reduce((s, r) => s + r.images.score, 0) / reports.length,
  Technical: reports.reduce((s, r) => s + r.technical.score, 0) / reports.length,
};
const maxes = { Title: 15, Meta: 5, Headers: 10, Content: 25, Keywords: 15, Links: 10, Images: 10, Technical: 10 };
for (const [section, avg] of Object.entries(sectAvg)) {
  const pct = (avg / maxes[section]) * 100;
  const bar = "█".repeat(Math.round(pct / 5));
  console.log(section.padEnd(10) + avg.toFixed(2).padStart(5) + "/" + maxes[section] + "  " + pct.toFixed(0).padStart(3) + "%  " + bar);
}

// Top P0 (worst 10 by SEO total)
console.log("\n=================================================================================");
console.log(" P0 — WORST-SCORING PAGES (immediate fix)");
console.log("=================================================================================\n");
const worst = [...reports].sort((a, b) => a.seoTotal - b.seoTotal).slice(0, 10);
for (const r of worst) {
  const allIssues = [
    ...r.title.issues, ...r.meta.issues, ...r.headers.issues, ...r.content.issues,
    ...r.keywords.issues, ...r.links.issues, ...r.images.issues, ...r.technical.issues,
  ];
  console.log(`  [${r.seoTotal}/100 ${gradeOf(r.seoTotal)}]  ${r.route}`);
  console.log(`    → ${allIssues.slice(0, 5).join(" · ") || "no issues recorded"}`);
}

// GEO-weak pages
console.log("\n=================================================================================");
console.log(" P1 — GEO/AI-CITATION READINESS GAPS (pages weakest for ChatGPT/Perplexity)");
console.log("=================================================================================\n");
const geoWeak = [...reports].sort((a, b) => a.geo.total - b.geo.total).slice(0, 8);
for (const r of geoWeak) {
  const gaps = [];
  if (r.geo.factualDensity < 10) gaps.push(`thin facts (${r.geo.factualDensity}/25)`);
  if (r.geo.directAnswer < 10) gaps.push(`no direct answer in lead`);
  if (r.geo.citations < 10) gaps.push(`no authority links (${r.geo.authorityLinks})`);
  if (!r.geo.faqSchema && r.content.words > 800) gaps.push(`no FAQ schema`);
  if (r.geo.quotableFacts < 8) gaps.push(`few quotable anchors`);
  console.log(`  [${r.geo.total}/100]  ${r.route}`);
  console.log(`    → ${gaps.slice(0, 4).join(" · ") || "ok"}`);
}

// SERP-feature-weak pages
console.log("\n=================================================================================");
console.log(" P2 — SERP FEATURES GAPS (weakest pages for snippets/PAA/rich results)");
console.log("=================================================================================\n");
const serpWeak = [...reports].sort((a, b) => a.serp.total - b.serp.total).slice(0, 10);
for (const r of serpWeak) {
  const gaps = [];
  if (r.serp.faq < 10) gaps.push(`FAQ ${r.serp.faq}/10 (${r.serp.faqQuestionCount} Qs)`);
  if (r.serp.paa < 10) gaps.push(`PAA heads ${r.serp.questionHeads}`);
  if (r.serp.snippetPara < 15) gaps.push(`snippet-paras ${r.serp.snippetParas}`);
  if (r.serp.snippetList < 10) gaps.push(`no rich <ol>`);
  if (r.serp.snippetTable < 10) gaps.push(`no rich <table>`);
  if (r.serp.imagePack < 10) gaps.push(`rich-alt imgs ${r.serp.richAltImgs}`);
  if (r.serp.speakable < 5) gaps.push(`no speakable`);
  console.log(`  [${r.serp.total}/100]  ${r.route}`);
  console.log(`    → ${gaps.slice(0, 5).join(" · ") || "ok"}`);
}

// Cross-cutting patterns
console.log("\n=================================================================================");
console.log(" CROSS-CUTTING PATTERNS (occurrences across site)");
console.log("=================================================================================\n");
const issueCounts = new Map();
for (const r of reports) {
  for (const arr of [r.title.issues, r.meta.issues, r.headers.issues, r.content.issues, r.keywords.issues, r.links.issues, r.images.issues, r.technical.issues]) {
    for (const i of arr) {
      const key = i.replace(/\d+/g, "N").replace(/N\.NN%/g, "N%");
      issueCounts.set(key, (issueCounts.get(key) || 0) + 1);
    }
  }
}
const sortedIssues = [...issueCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
for (const [issue, n] of sortedIssues) {
  console.log(`  ${String(n).padStart(3)}×  ${issue}`);
}

// --only=<substr>[,<substr>] — full per-page breakdown for specific routes
if (ONLY_ARG) {
  const needles = ONLY_ARG.slice(7).split(",").filter(Boolean);
  console.log("\n=================================================================================");
  console.log(" PER-PAGE DETAIL");
  console.log("=================================================================================");
  for (const r of reports.filter(r => needles.some(n => r.route.includes(n)))) {
    console.log(`\n${r.route}`);
    console.log(`  SEO ${r.seoTotal}/100 (${gradeOf(r.seoTotal)})   GEO ${r.geo.total}/100   SERP ${r.serp.total}/100   ${r.content.words}w   kw="${r.keywords.primary}" ${r.keywords.density}%`);
    for (const [name, sec] of [
      ["Title", r.title], ["Meta", r.meta], ["Headers", r.headers], ["Content", r.content],
      ["Keywords", r.keywords], ["Links", r.links], ["Images", r.images], ["Technical", r.technical],
    ]) {
      console.log(`  ${name.padEnd(10)}${String(sec.score).padStart(5)}  ${sec.issues.join(" · ") || "clean"}`);
    }
    console.log(`  GEO        facts ${r.geo.factualDensity}/25 · answer ${r.geo.directAnswer}/20 · cites ${r.geo.citations}/20 · schema ${r.geo.schema}/20 · quotable ${r.geo.quotableFacts}/15`);
    console.log(`  SERP       faq ${r.serp.faq}/10 · paa ${r.serp.paa}/10 · para ${r.serp.snippetPara}/15 · list ${r.serp.snippetList}/10 · table ${r.serp.snippetTable}/10 · crumb ${r.serp.breadcrumb}/5 · stars ${r.serp.stars}/10 · img ${r.serp.imagePack}/10 · local ${r.serp.localPack}/10 · speak ${r.serp.speakable}/5 · social ${r.serp.social}/5`);
  }
}

if (EMIT_JSON) {
  const outDir = path.resolve("scripts/audit/reports");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "seo-geo-data.json");
  fs.writeFileSync(outPath, JSON.stringify(reports, null, 1));
  console.log(`\n✔ JSON data written to ${path.relative(process.cwd(), outPath)}`);
}

if (EMIT_MD) {
  let md = `# SEO + GEO + SERP Scorecard — ${PROJECT}\n\n_Per seo-geo-claude-skills/on-page-seo-auditor v9.9.9 · ${new Date().toISOString().slice(0, 10)}_\n\n`;
  md += `## Per-page scores\n\n| Route | Cluster | Words | SEO/100 | GEO/100 | SERP/100 | Grade |\n|---|---|---:|---:|---:|---:|---:|\n`;
  for (const r of reports) {
    md += `| ${r.route} | ${r.cluster} | ${r.content.words} | ${r.seoTotal} | ${r.geo.total} | ${r.serp.total} | ${gradeOf(r.seoTotal)} |\n`;
  }
  md += `\n## Cluster aggregates\n\n| Cluster | Pages | SEO avg | GEO avg | SERP avg |\n|---|---:|---:|---:|---:|\n`;
  for (const c of sortedClusters) {
    const pages = byCluster.get(c);
    md += `| ${c} | ${pages.length} | ${(pages.reduce((s, r) => s + r.seoTotal, 0) / pages.length).toFixed(1)} | ${(pages.reduce((s, r) => s + r.geo.total, 0) / pages.length).toFixed(1)} | ${(pages.reduce((s, r) => s + r.serp.total, 0) / pages.length).toFixed(1)} |\n`;
  }
  md += `| **OVERALL** | ${reports.length} | **${(globalSeoSum / reports.length).toFixed(1)}** | **${(globalGeoSum / reports.length).toFixed(1)}** | **${(globalSerpSum / reports.length).toFixed(1)}** |\n`;
  const outDir = path.resolve("scripts/audit/reports");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "seo-geo-scorecard.md");
  fs.writeFileSync(outPath, md);
  console.log(`\n✔ Markdown report written to ${path.relative(process.cwd(), outPath)}`);
}
