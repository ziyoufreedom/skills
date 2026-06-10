# Scoring Rubric

Each of the 7 categories is computed from 3–8 binary or graded checks. Score per category = arithmetic mean of its checks. Overall = weighted sum of categories.

## Category weights

| Category | Weight | Why this weight |
|---|---:|---|
| Technical SEO | 22% | Indexability blockers. If Google can't crawl/index, nothing else matters. |
| Content Quality | 23% | The single biggest ranking input for non-brand queries. |
| On-Page SEO | 20% | Title/description/H1 are the strongest per-URL ranking signals after content. |
| Schema | 10% | Rich-results visibility + AI search citability. High ceiling, modest baseline impact. |
| Performance | 10% | Core Web Vitals influence ranking ~5-15% per Google; modest direct, higher UX-driven indirect. |
| AI Readiness | 10% | Growing share of traffic comes via ChatGPT/Perplexity citations; SSR content + entity graph matter. |
| Images | 5% | Image SEO + alt accessibility; smaller share but easy wins. |

Total: 100%.

## Technical SEO sub-checks (each 0-100, averaged)

| Check | Pass = 100 | Fail = 0 |
|---|---|---|
| Distinct HTML per URL | All audited URLs return unique HTML hashes | Multiple URLs return identical HTML (SPA shell) |
| Canonical correctness | Every page self-canonical OR canonical fields properly set | All canonicals point to same URL OR mismatched |
| robots.txt OK | File present, no over-blocking | Missing or `Disallow: /` on key paths |
| HTTPS | URL is https:// | http:// |
| Sitemap | sitemap.xml present, valid, includes audit URLs | Missing or 404 |
| Hreflang per page | Multilingual sites have hreflang link tags on every page | Multilingual but no hreflang |
| Server-rendered content | Every page has ≥30 words in initial HTML | Empty SPA shell |

## Content Quality sub-checks

| Check | Pass = 100 | Notes |
|---|---|---|
| Word count adequacy | Every page meets word threshold for its type | Thresholds: home 600, service 400, main 300 |
| Distinct content per URL | Each page has unique body content | SPA = 0; per-URL HTML hash uniqueness |
| Headings present | Every page has exactly one H1 | 0 H1 or multiple H1 = partial |

## On-Page SEO sub-checks

| Check | Pass = 100 |
|---|---|
| Unique titles | (unique title count / total titles) × 100 |
| Unique descriptions | Same formula for `<meta description>` |
| Single H1 | % of pages with exactly 1 H1 |
| Hreflang | All pages on multilingual sites have hreflang |
| Image alt coverage | (1 − missing_alt / total_imgs) × 100 |

## Schema sub-checks

| Check | Pass = 100 |
|---|---|
| JSON-LD present | % of pages with ≥1 `<script type=ld+json>` |
| Page-specific schemas | Service pages have `Service`/`MedicalProcedure`; etc. |
| Breadcrumb on inner pages | % of non-home pages with `BreadcrumbList` |

## Performance sub-checks (heuristic, no PSI required)

| Check | Pass = 100 |
|---|---|
| HTML page weight | Avg HTML <30 KB. Scales linearly: 30 KB = 100, 130 KB = 0 |
| Third-party requests | Few external scripts/styles. Each 10pt deduction per avg third-party request |
| Render-blocking | No external CSS (esp. Google Fonts CDN). Each blocking 20pt deduction |

> **Note**: Performance score here is a heuristic. For real Lighthouse / CrUX field data, use PageSpeed Insights API (requires API key) or `_seo-evaluation/claude-seo seo-performance`.

## AI Readiness sub-checks

| Check | Pass = 100 |
|---|---|
| llms.txt | `/llms.txt` file present (checked outside this script) |
| SSR content | Same as Technical → Server-rendered content |
| Entity graph | At least one Organization / LocalBusiness schema with @id |

## Images sub-checks

| Check | Pass = 100 |
|---|---|
| Alt coverage | (1 − missing_alt / total_imgs) × 100 |
| Dimensions set | (1 − missing_width_or_height / total_imgs) × 100 |

## Grade scale

| Score | Grade | Means |
|---|---|---|
| 90-100 | A | Production-ready. Ship it. |
| 80-89 | B | Solid. Polish a few items. |
| 70-79 | C | Working but losing rankings. |
| 60-69 | D | Major issues. Fix before relying on organic traffic. |
| <60 | F | Site is invisible to Google. Critical structural problems. |
