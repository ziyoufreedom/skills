---
name: jj-seo-geo
description: Cross-project SEO + GEO + SERP-features audit engine. Use when the user wants to score every built page of a static site against the seo-geo-claude-skills v9.9.9 rubric (100-pt SEO + 100-pt GEO + 100-pt SERP feature readiness) locally — no per-URL WebFetch. Triggers on "score the whole site", "audit SEO + GEO", "GEO scorecard", "AI citation readiness", "SERP features", "featured snippet readiness", "全网打分", "SEO 评分", "全站审计", "评分卡". Drops three reusable Node scripts into the target project's scripts/audit/, configures the project-specific cluster map + NAP, and emits per-page + sitewide scorecards plus JSON for driving fan-out fixes. Outperforms WebFetch'ing the auditor URL by URL — runs over the whole dist/ in <1 second.
---

# jj-seo-geo — Local SEO + GEO Scorecard

A drop-in audit engine that **scores every built page of a static site** against the seo-geo-claude-skills v9.9.9 rubric (100-pt SEO + 100-pt GEO), without making N WebFetch calls. Battle-tested on the Ten Toes Reflexology project where it took 42 pages from SEO 90.7 / GEO 70.9 → SEO 97.8 / GEO 87.9 (100 % target achievement) over 5 iterations.

## When to use

- User says "score the whole site" / "全网打分" / "audit SEO + GEO"
- User pastes the on-page-seo-auditor rubric and wants to apply it across many pages
- User wants a sitewide markdown scorecard generated locally
- User wants per-cluster aggregates (hub vs service vs guide vs conversion)
- User wants both SEO **and** GEO (AI citation readiness) scored in one pass

## What it produces

For every page in `dist/`:
1. **SEO score /100** with the 8-dimension breakdown (Title 15 / Meta 5 / Headers 10 / Content 25 / Keywords 15 / Links 10 / Images 10 / Technical 10) — see `references/rubric.md`
2. **GEO score /100** with 5-dimension breakdown (FactualDensity 25 / DirectAnswer 20 / Citations 20 / Schema 20 / QuotableFacts 15)
3. **SERP Features score /100** — eligibility for the non-blue-link slots: FAQ rich result 10 / PAA question-headings 10 / snippet paragraph 15 / snippet list 10 / snippet table 10 / image pack 10 / review stars 10 / local pack 10 / breadcrumb 5 / speakable 5 / social cards 5
4. **Per-page issue list** (critical / warning / info)
5. **Cluster aggregates** (avg / min per cluster, all three scores)
6. **Cross-cutting issue patterns** (the top 20 deductions globally — tells you what to fix to lift the whole site)
7. **P0 worst-scoring pages** + **P1 GEO-weak pages** + **P2 SERP-feature-weak pages**
8. `--md` writes the markdown report · `--json` writes `seo-geo-data.json` (per-page sub-scores — feed this to optimization subagents) · `--only=<substr>` prints a full per-dimension breakdown for matching routes

Two companion scripts:
- `metadata-audit.mjs` — title/desc/canonical/OG/Twitter/JSON-LD validation including NAP consistency against `business.ts`
- `similarity-audit.mjs` — Jaccard 5-word-shingle comparison of every page pair, flagging near-duplicate landing pages (≥0.70 critical, ≥0.50 high, ≥0.35 watch) with geo tokens masked so city-swap templates are caught

### Primary-keyword resolution

The engine reads author-declared `<meta name="keywords">` as ground truth (first
entry that actually occurs in the body wins), falling back to H1 n-gram density
inference. Declaring keywords per page removes the whole class of false negatives
where the inferrer picks a phrase the author never targeted — on a conversion page
like `/reviews/` it is the difference between SEO 89 and 100.

## Install into a target project (Claude's playbook)

### Step 1 — Copy the scripts

Copy `scripts/seo-geo-score.mjs` and `scripts/metadata-audit.mjs` into the target project's `scripts/audit/` directory.

```bash
mkdir -p scripts/audit
cp $SKILL_DIR/scripts/seo-geo-score.mjs scripts/audit/
cp $SKILL_DIR/scripts/metadata-audit.mjs scripts/audit/
cp $SKILL_DIR/scripts/similarity-audit.mjs scripts/audit/
```

### Step 2 — Configure project-specific bits

Each script has 3 sections marked `// CONFIGURE:` that the target project needs to customize. Either edit the scripts directly OR (cleaner) create `scripts/audit/seo-geo.config.mjs` exporting the overrides. The script loads the config if it exists.

**Required configuration** for any new project — `seo-geo-score.mjs` carries four numbered `CONFIGURE` blocks:

0. **Project identity** (top of file) — `PROJECT` label, `HOST` (internal-link detection), `BRAND_RE` (brand token expected in every title), `TITLE_SUFFIX_RE` (suffix stripped before keyword inference).

1. **`inferCluster(route)`** — map URL routes to clusters with `{ cluster, queryType, floor }`. The default Ten Toes shape (hub-home / hub-services / hub-guides / lawrence-* / service / guide / conversion) won't match your IA. Use the page types listed in `references/integration.md`.

2. **Authority-domain regex** (`authorityLinks` filter) — defaults to `.gov / .edu / nccih / mayo / cleveland / hopkins / amta / acog / aad / pubmed`. Add your vertical's sources (legal: `aba.org`; cloud/B2B: `aws.amazon.com`, `kubernetes.io`, `nist.gov`).

3. **`clusterOrder`** — display order for the aggregates table.

Plus **`CANON`** in metadata-audit.mjs — the canonical NAP (name / phone / address / origin / lat / lng). The script flags any JSON-LD that drifts from these. Pull from your project's `business.ts` (or equivalent).

`similarity-audit.mjs` has one knob: the `GEO` regex that masks place names so city-swap templates register as duplicates rather than as distinct pages.

### Step 3 — Run

```bash
bun run build                                    # or npm run build / pnpm build
node scripts/audit/seo-geo-score.mjs             # prints stdout
node scripts/audit/seo-geo-score.mjs --md --json # markdown report + machine-readable data
node scripts/audit/seo-geo-score.mjs --only=/services/,/guides/foo   # per-dimension detail
node scripts/audit/metadata-audit.mjs --md       # title/desc/JSON-LD/NAP audit
node scripts/audit/similarity-audit.mjs          # near-duplicate page pairs
```

### Driving a fan-out fix with subagents

`--json` exists for this: it writes every page's per-dimension sub-scores and issue
strings to `scripts/audit/reports/seo-geo-data.json`. Partition the pages by file
ownership (never let two agents share a file), hand every agent the same scoring
formulas plus its own route list, and tell each to read its entries from that JSON
before editing. On a 46-page site, ten parallel agents took SEO 97.4 → 98.8, GEO
83.4 → 90.2, and SERP 67.8 → 82.2 in one pass, with the finished clusters landing
at 100 / 97 / 100. Rebuild and re-score centrally between rounds — agents must not
run builds themselves.

### Step 4 — Read the output, identify worst pages, fix, re-run

The scripts are designed for a fix-rebuild-rerun loop:
- Cluster aggregates show which **page type** is weakest (lift the whole cluster)
- P0 worst-pages shows individual outliers
- Cross-cutting patterns shows the **single top issue** affecting many pages (fix once, lift many)

## Iteration playbook (proven on Ten Toes — 5 phases got 42/42 pages to A+)

| Phase | Common move | Typical impact |
|---|---|---|
| Phase 1 — GEO citations | Inject 2-3 NCCIH/Mayo/Cleveland citations per content-heavy page | Guide GEO cluster +16-20 |
| Phase 2 — Thin-content hubs | Expand hub pages from <1000w to 1500w + add FAQ + FAQPage schema | Hub SEO +6, GEO +24 |
| Phase 3 — Conversion FAQ schema | Add FAQPage JSON-LD + visible FAQ section to about/reviews/contact | Conversion GEO +15 |
| Phase 4 — Meta CTA sweep | Add a CTA verb (book/call/walk in) to every meta description lacking one | Meta dimension 76% → 88% |
| Phase 5 — Per-page strict fixes | Strict keyword inferrer + image-counting from body-only (no header logo) + add stats tables to thin-fact guides | Final push to 100 % targets |

## Rubric reference

See `references/rubric.md` for the full 100-pt SEO + 100-pt GEO scoring formulas. Source-of-truth is `seo-geo-claude-skills/optimize/on-page-seo-auditor/references/scoring-rubric.md` at https://github.com/aaron-he-zhu/seo-geo-claude-skills (Aaron He-Zhu, Apache-2.0).

## Why not just call the auditor skill per URL?

Calling `optimize/on-page-seo-auditor` via WebFetch hits 1 URL per call. On a 42-page site that's 42 sequential WebFetch calls (~5 minutes wall-clock + 42 model passes). This skill scores 42 pages in **0.3 seconds** of pure Node walking the dist/ directory. The rubric is the same; the execution layer is local.

Use the skill's WebFetch approach when:
- Site isn't deployed yet AND no local dist/ available
- You're auditing one specific competitor URL

Use this local approach when:
- You want sitewide cluster aggregates and cross-cutting patterns
- You're iterating fix → rebuild → re-score many times
- You want the markdown scorecard written to disk

## Compatibility

- **Frameworks**: Astro 5, Next.js (static export), Nuxt 3, SvelteKit (adapter-static), VitePress, Vite + plain HTML, any tool that produces `dist/**/index.html`
- **Runtimes**: Node 18+, Bun, Deno (with `--allow-read`)
- **OS**: Windows / macOS / Linux (script uses `node:path` only)

## File layout

```
jj-seo-geo/
├── SKILL.md                         ← this file
├── scripts/
│   ├── seo-geo-score.mjs            ← drop into scripts/audit/ of target project
│   ├── metadata-audit.mjs           ← drop into scripts/audit/ of target project
│   └── similarity-audit.mjs         ← drop into scripts/audit/ of target project
├── references/
│   ├── rubric.md                    ← full 100+100 pt scoring formulas
│   └── integration.md               ← how to wire into Astro / Next / Nuxt / etc.
└── examples/
    └── seo-geo.config.example.mjs   ← per-project configuration template
```
