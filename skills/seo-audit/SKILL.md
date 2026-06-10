---
name: seo-audit
description: |
  Run a proactive SEO audit on a website (any framework, any host) and produce
  an evidence-backed scorecard + prioritized action plan. Zero API keys required —
  works against a live URL or a local `dist/` directory using only HTTP fetch +
  HTML parsing.

  Triggers when the user says: "audit my site", "SEO audit", "全网 SEO 审计",
  "score my SEO", "check my site SEO", "what's my SEO score", "site health check",
  "pre-launch SEO check", or pastes a URL and asks for an SEO evaluation.

  This skill PRODUCES audit data (scorecard + per-page metrics + issue list).
  After running it, hand the report to the `seo-fix` skill to apply fixes,
  or to `seo-perf-audit-fix` for Lighthouse-style perf patches, or to
  `seo-ld-json` for schema-specific repairs.

  Distinct from `seo-perf-audit-fix` (which consumes external audit output) —
  this skill GENERATES the audit. Distinct from the full `_seo-evaluation/claude-seo`
  megaskill — this is a compact, no-dependency drop-in for everyday use.
license: MIT
---

# SEO Audit Skill

Fetch a site, parse every page, score 7 categories on a 100-point scale, write a markdown report with a prioritized action plan. Designed to run end-to-end in **5–15 minutes** with no API keys.

## When to use

- **Pre-launch**: validate a new build before deploying (`audit dist/`)
- **Post-launch**: baseline the live site (`audit https://...`)
- **Compare**: run twice (before/after a migration or fix cycle) and diff scorecards
- **Reactive**: user pastes a URL and asks "why isn't this ranking?"

If you've already got a Lighthouse / PageSpeed / SEMrush / GSC report and just want the fixes applied, prefer `seo-perf-audit-fix` directly — don't re-audit.

## What it checks (7 categories, weighted to 100)

| Category | Weight | What it measures |
|---|---:|---|
| Technical SEO | 22% | server-rendered HTML per URL (not SPA shell), canonical correctness, robots.txt, HTTPS, sitemap quality + hreflang, 404 status code, redirects |
| Content Quality | 23% | word count per page (visible to crawler, not requiring JS), distinct content per URL, E-E-A-T signals (author bios, credentials, dates) |
| On-Page SEO | 20% | unique titles per URL, unique meta descriptions, single H1, valid heading hierarchy, hreflang per page |
| Schema / Structured Data | 10% | JSON-LD blocks present, `@graph` + `@id` linking, page-specific schemas (not just global org), validation against schema.org |
| Performance (CWV proxy) | 10% | page weight, JS bundle size, render-blocking resources, font loading strategy, third-party request count. **No PSI required** — heuristic only |
| AI Search Readiness | 10% | `llms.txt` present + valid, server-rendered content (AI crawlers can't run JS reliably), schema entity graph with `sameAs` / `founder` / authority signals |
| Images | 5% | alt coverage, missing width/height (CLS risk), oversized files, format (WebP > PNG/JPG) |

Weights match the widely-used Claude-SEO standard. See `references/scoring-rubric.md` for the per-check sub-scoring.

## Process

### 1. Discover pages

- **If URL**: fetch the homepage, then `sitemap.xml`, then `robots.txt`. If sitemap exists, use it as the URL list (cap at 50 pages for the audit; sample evenly if more). If no sitemap, do a 1-level crawl from homepage (follow internal `<a href="/...">`).
- **If local `dist/`**: walk for `**/index.html`. URL = path relative to `dist/`.

### 2. Fetch every page

Use `requests` with a Googlebot User-Agent:
```
Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)
```

Save HTML to a temp dir keyed by URL slug.

**Critical first check**: hash the response bodies. If 3+ different URLs return byte-identical HTML, **flag CRITICAL: SPA shell — Google sees no per-page content**. This single check explains 90% of "indexed but not ranking" cases.

### 3. Parse each page

Per page, extract with BeautifulSoup:
- `<title>` text
- `<meta name="description">`
- `<link rel="canonical">`
- `<meta name="robots">`
- `<html lang="">`
- `<link rel="alternate" hreflang="">` (all)
- `<h1>` count + text, `<h2>` count, `<h3>` count
- `<img>` total count, missing-alt count, missing-w/h count
- `<a href="/...">` internal link count
- All `<script type="application/ld+json">` blocks (parse JSON, list `@type`s, validate required fields)
- Word count of visible text in `<main>` (or `<body>` minus header/footer/nav)
- External resource count: `<script src="https://">`, `<link href="https://...">`

### 4. Compute per-category sub-scores

See `references/scoring-rubric.md`. Each category has 3–8 binary or graded checks; average to get the category score (0–100); weighted sum = overall.

### 5. Identify critical findings

Hard-coded triage:
- **CRITICAL** (blocks indexing): identical HTML across URLs · all canonicals point to same URL · `noindex` on key pages · sitemap returns 404 · `robots.txt` blocks crawler
- **HIGH** (drags ranking): missing `<h1>`, duplicate titles across pages, missing canonical, no hreflang on multilingual site, all schemas have same `@id`, third-party fonts blocking render
- **MEDIUM** (optimization): thin pages (<400 words), >10 images missing alt, no `BreadcrumbList` schema, `og:image` missing/404
- **LOW** (nice-to-have): no `llms.txt`, missing `sameAs` URLs in schema, fonts not preloaded

### 6. Write report

Generate `SEO-AUDIT-REPORT.md` in the project root (or `cwd`) with this structure:

```markdown
# SEO Audit Report
Target: <URL or dist path>
Run: <ISO timestamp>

## Executive Summary
- Overall SEO Health Score: **XX / 100** (Grade: A/B/C/D/F)
- Pages audited: N
- Critical issues: M
- Estimated time-to-fix (Critical+High): X hours

## Scorecard
| Category | Weight | Score |
|---|---:|---:|
| Technical SEO | 22% | XX |
| Content Quality | 23% | XX |
| ...etc...
| **OVERALL** | 100% | **XX** |

## Critical findings (fix immediately)
1. <finding> — evidence: <data> — fix: <pointer> — owner: seo-fix / seo-ld-json / seo-perf-audit-fix

## High-priority findings
...

## Per-page metrics (top 15)
| URL | Title unique | Canon | H1 | Words | Schemas | Hreflang |
|---|:-:|:-:|:-:|--:|:-:|:-:|
...

## Recommended next step
Hand this report to `seo-fix`:
> "Run seo-fix on SEO-AUDIT-REPORT.md"
```

## Running the audit

The script `scripts/audit.py` does steps 1–6 end-to-end. From the project root:

```bash
# Audit a live URL
python <skill-path>/scripts/audit.py https://example.com

# Audit a local build (no server needed)
python <skill-path>/scripts/audit.py ./dist

# Audit and cap pages
python <skill-path>/scripts/audit.py https://example.com --max-pages 30

# Output JSON instead of markdown
python <skill-path>/scripts/audit.py https://example.com --json > audit.json
```

Dependencies (auto-installable via `pip install -r <skill-path>/requirements.txt`):
- `requests`
- `beautifulsoup4`
- `lxml`

## What this skill does NOT do (use the right tool)

| Need | Use |
|---|---|
| Lighthouse / PageSpeed scores with real CWV field data | `seo-perf-audit-fix` after running PSI separately, or full `_seo-evaluation/claude-seo` with Google API key |
| Schema validation against Google Rich Results | `seo-ld-json` |
| Backlink profile analysis | `_seo-evaluation/claude-seo` with Moz/Bing API |
| GBP / local pack ranking | `_seo-evaluation/claude-seo seo-local` |
| Fix the issues this audit found | Hand the report to `seo-fix` |

## Output convention

- Report written to: `./SEO-AUDIT-REPORT.md` (project root, or current working directory)
- All `.md` files gitignored per project rules — never commit reports
- Reports are dated; running audit again **overwrites** the previous report unless `--out` specifies a different path
- `seo-fix` reads `SEO-AUDIT-REPORT.md` by default

## Scoring philosophy

This audit is **evidence-based, not opinion-based**. Every score reduction must trace to a specific failed check with evidence (HTML snippet, file path, byte count, etc.). The report must let a developer reproduce the finding in 30 seconds without re-running the audit.

If a check can't be evidenced (e.g., "is the content authoritative?"), it's not scored — only objective things go in the rubric.

## Edge cases

- **Single-page SPA without sitemap**: audit will fetch homepage only and warn loudly. Score will reflect the per-URL HTML uniqueness failure.
- **Site with auth wall**: cap at the publicly-fetched pages; note in report.
- **CDN cache stale**: if `Cache-Control: max-age` is high and you suspect stale HTML, pass `--bypass-cache` (adds `?_=<timestamp>` to requests).
- **Multi-language**: pass `--locales en,zh` to audit both `/` and `/zh/` trees; hreflang correctness is auto-checked.
- **Network timeout**: default 15s per page; configurable via `--timeout`.

## Integration with `seo-fix`

After this audit:
1. The report includes a routing column ("owner: seo-fix / seo-ld-json / seo-perf-audit-fix") for each finding
2. The `seo-fix` skill reads the report, groups findings by owner skill, and either applies fixes directly or hands off
3. After fixes, re-run this skill to confirm score lift

End-to-end loop:
```
seo-audit https://example.com   →   SEO-AUDIT-REPORT.md (score 31)
                                          ↓
                          seo-fix SEO-AUDIT-REPORT.md
                                          ↓
                              (fixes applied, deployed)
                                          ↓
seo-audit https://example.com   →   SEO-AUDIT-REPORT.md (score 94)
```
