# Integration — wiring jj-seo-geo into a new project

3 frameworks shown below. The engine itself is framework-agnostic — it just needs a built `dist/` of static HTML files.

## Astro 5

```bash
mkdir -p scripts/audit
cp $JJ_SEO_GEO/scripts/seo-geo-score.mjs scripts/audit/
cp $JJ_SEO_GEO/scripts/metadata-audit.mjs scripts/audit/
```

Edit the 3 `CONFIGURE` blocks (search `// CONFIGURE` in both files).

```jsonc
// package.json — add convenience scripts
{
  "scripts": {
    "audit:seo-geo": "node scripts/audit/seo-geo-score.mjs --md",
    "audit:metadata": "node scripts/audit/metadata-audit.mjs --md",
    "audit": "bun run build && npm run audit:seo-geo && npm run audit:metadata"
  }
}
```

Run: `npm run audit`.

## Next.js (static export)

Make sure `next.config.js` has `output: 'export'`. Then:

```bash
mkdir -p scripts/audit
cp $JJ_SEO_GEO/scripts/seo-geo-score.mjs scripts/audit/
cp $JJ_SEO_GEO/scripts/metadata-audit.mjs scripts/audit/
```

In both scripts, change the constant:
```js
const DIST = path.resolve("dist");   // ← change to "out" for Next.js
```

(Next exports static HTML to `out/` by default.)

## Nuxt 3 / SvelteKit (static)

Same as above. `DIST = path.resolve(".output/public")` for Nuxt 3, `"build"` for SvelteKit adapter-static.

## Vite + plain HTML / VitePress / Hugo

Use `dist/` (Vite default) or `public/` (Hugo) for the DIST constant.

## What to configure per project

### `seo-geo-score.mjs`

**CONFIGURE #1** — `inferCluster(route)` function:
- Map every URL prefix the project produces to a `{ cluster, queryType, floor }`
- `queryType` determines content length expectations:
  - `transactional` → 500+ words ideal (booking pages, contact, gift cards)
  - `commercial` → 1200+ (service/product pages)
  - `informational` → 1500+ (guides, blog, articles)
  - `local` → 400+ (city/neighborhood landing pages)
- Pages without an explicit prefix fall through to the `misc` default

Example for a SaaS docs site:
```js
function inferCluster(route) {
  if (route === "/") return { cluster: "hub-home", queryType: "transactional", floor: 500 };
  if (route.startsWith("/docs/")) return { cluster: "docs", queryType: "informational", floor: 800 };
  if (route.startsWith("/blog/")) return { cluster: "blog", queryType: "informational", floor: 1500 };
  if (route.startsWith("/pricing")) return { cluster: "pricing", queryType: "transactional", floor: 400 };
  return { cluster: "misc", queryType: "informational", floor: 300 };
}
```

**CONFIGURE #2** — `authorityLinks` regex:
- Universal default covers `.gov`, `.edu`, NIH/Mayo/Cleveland Clinic for medical content
- Append vertical-specific anchors for non-medical projects:
  - Legal: add `aba\.org|justia\.com|law\.cornell\.edu` (cornell.edu already covered by `.edu`)
  - Finance: add `sec\.gov|federalreserve\.gov|imf\.org|worldbank\.org`
  - Tech: add `w3\.org|ietf\.org|developer\.mozilla\.org|whatwg\.org`

### `metadata-audit.mjs`

**CONFIGURE #1** — `SITE_ORIGIN`:
- Production URL of the site (no trailing slash)
- Used to check canonical link tags, og:url, and absolute schema URLs

**CONFIGURE #2** — `CANON`:
- All schema NAP fields the project should agree on
- Source from your project's `business.ts` / `config.ts` / `siteConfig` to keep one source of truth
- Drift between schemas and CANON is flagged as critical-level

## Running

```bash
# 1. Build the site first
bun run build       # or npm run build / pnpm build

# 2. Score everything in dist/
node scripts/audit/seo-geo-score.mjs               # stdout report
node scripts/audit/seo-geo-score.mjs --md          # also writes markdown to scripts/audit/reports/

# 3. Audit metadata / JSON-LD separately
node scripts/audit/metadata-audit.mjs              # stdout report  
node scripts/audit/metadata-audit.mjs --md
```

Reports go to `scripts/audit/reports/seo-geo-scorecard.md` and `metadata-scorecard.md`.

## Fix-rebuild-rerun loop

The scripts are designed for fast iteration. Typical workflow:

1. Run engine on initial build → identify P0 worst pages + cross-cutting top issue
2. Fix the top cross-cutting issue (lifts many pages at once) + 2-3 worst individual pages
3. Rebuild → re-run engine → repeat
4. Stop when overall hits target (SEO ≥ 90 / GEO ≥ 80 was the Ten Toes target)

Each iteration takes ~10 seconds (build + audit). Expect 3-5 iterations to clear all P0.

## Output shape

```
Pages audited: 42  |  Generated: 2026-05-28

Route                                              Cluster      Words   SEO  GEO  Grade
---------------------------------------------------------------------------------------
/                                                  hub-home      1347    97   88  A+
/about/                                            conversion    2452    99   80  A+
...

CLUSTER AGGREGATES
hub-home              1       97.0       88.0
hub-services          2       96.5       90.5
guide                11       97.5       82.4
OVERALL              42       97.4       87.2

WEIGHTED SECTION AVERAGES  (where weakness lives)
Title     14.81/15   99%  ████████████████████
Meta       4.88/5    98%  ████████████████████
Headers    9.86/10   99%  ████████████████████
Content   24.12/25   96%  ███████████████████
Keywords  13.93/15   93%  ███████████████████
Links      9.90/10   99%  ████████████████████
Images     9.21/10   92%  ██████████████████
Technical 10.00/10  100%  ████████████████████

P0 — WORST-SCORING PAGES (immediate fix)
[81/100 A]  /contact/
    → primary kw missing · no FAQ section · kw not in title

P1 — GEO/AI-CITATION READINESS GAPS
[68/100]  /
    → no direct answer in lead

CROSS-CUTTING PATTERNS (top deductions sitewide)
   16×  thin density
   15×  no expertise signal
    7×  kw not in URL
```
