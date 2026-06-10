# Scoring rubric — 100 pt SEO + 100 pt GEO

Both scores are computed independently. A page can be SEO 100 / GEO 60 (well-optimized but not AI-citable) or vice versa.

## SEO score (100 pts total)

Source: `seo-geo-claude-skills/optimize/on-page-seo-auditor/references/scoring-rubric.md` (Aaron He-Zhu, Apache-2.0).

| Dimension | Weight | What's checked |
|---|---:|---|
| **Title** | 15 | 50-60 chars ideal · primary keyword present · brand suffix · not duplicate sitewide |
| **Meta description** | 5 | 140-160 chars ideal · keyword present · CTA verb (book/call/visit/etc.) |
| **Headers** | 10 | Exactly 1 H1 · H1 contains primary kw · ≥3 H2s · H3 present on >800w pages · keyword in H1 |
| **Content** | 25 | Word count vs cluster floor (see below) · ≥5 `<p>` if >500w · FAQ section on >800w pages · E-E-A-T signal (`licensed`/`certified`/`insured`/`years of experience`) |
| **Keywords** | 15 | Primary kw in title + H1 + first 100 words + URL + meta · density 0.5-2 % ideal · ≤3 % no stuffing |
| **Links** | 10 | Internal links ≥ floor by content length · external links on >800w · ≥50 % anchor variety · no >2 generic anchors |
| **Images** | 10 | All `<img>` (body only — header/footer logos excluded) have alt · ≥50 % WebP/AVIF/SVG · ≥50 % lazy or `fetchpriority="high"` |
| **Technical** | 10 | Canonical present · viewport set · OG image · JSON-LD schema types · Service/Article/Breadcrumb on right page types · no `noindex` |

### Word-count floors per query type

| Query type | Full points | Partial | Thin |
|---|---|---|---|
| Informational | 1500+ | 500-1499 | <500 |
| Commercial | 1200+ | 400-1199 | <400 |
| Transactional | 500+ | 200-499 | <200 |
| Local | 400+ | 150-399 | <150 |

### Internal-link counts per content length

| Content length | Min | Ideal |
|---|---:|---:|
| <500 words | 2 | 2-4 |
| 500-1000 | 3 | 3-6 |
| 1000-2000 | 4 | 5-10 |
| 2000+ | 5 | 8-15 |

### Grade boundaries

| Score | Grade | Read |
|---|---|---|
| 90-100 | A+ | Exceptional, minor tweaks only |
| 80-89 | A | Strong, a few opportunities |
| 70-79 | B | Several areas need attention |
| 60-69 | C | Significant improvements needed |
| 50-59 | D | Major issues present |
| <50 | F | Comprehensive overhaul required |

---

## GEO score (100 pts total) — AI citation readiness

Measures how readily ChatGPT / Perplexity / Gemini / Claude / Google AI Overviews will quote the page.

| Dimension | Weight | Formula |
|---|---:|---|
| **FactualDensity** | 25 | `min(25, (numericFacts + dollarFacts) / wordCount * 100 * 5)` — concrete numbers and prices per 100 words |
| **DirectAnswer** | 20 | First 1200 chars of body contain a definition pattern (`is`/`means`/`refers to`/`involves`/`describes`/`consists of`) → +12. Also contain a numbered specific (`30 min`/`60 min`/`$X`/`9 am`/`9:30 pm`) → +8 |
| **Citations** | 20 | `min(20, authorityLinks × 8 + min(8, externalLinks/2))` — outbound links to whitelisted authority domains |
| **Schema** | 20 | LocalBusiness/DaySpa → +8 · FAQPage → +4 · Article → +3 · Service → +3 · BreadcrumbList → +2 (cap 20) |
| **QuotableFacts** | 15 | `H2 count + H3 × 0.5 + <ul> + <ol> × 2 + <table> × 3` (cap 15) — structured anchors AI can cite verbatim |

### Authority-domain whitelist (default)

- Government: `.gov`
- Academic: `.edu`
- Health (NIH-adjacent): `nccih.nih`, `ncbi.nlm`, `nih.gov`, `pubmed`
- Medical: `mayoclinic`, `clevelandclinic`, `hopkinsmedicine`, `webmd`, `harvard`
- Trade orgs: `amtamassage`, `acog.org`, `aafp.org`
- Industry pubs: `massagemag`

Customize via `CONFIGURE #2` in `seo-geo-score.mjs`.

### GEO band interpretation

| Score | Read |
|---|---|
| 80-100 | AI Overview / Perplexity-ready. Will be cited in answers. |
| 60-79 | Citable for specific queries but needs more structured facts / citations. |
| 40-59 | Page is content-rich but AI engines have nothing to quote concretely. |
| <40 | AI will paraphrase competitors, not cite this page. |

---

## How the engine differs from line-by-line WebFetch auditing

The on-page-seo-auditor skill's default mode (WebFetch one URL, score with the rubric) burns 1 model pass per URL. For a 42-page site that's 42 × ~30s = 21 min wall + cost. **This engine encodes the rubric in 580 lines of pure Node** that walks `dist/` in 0.3 seconds and emits the same scorecard structure — same rubric, same dimensions, same grades.

The tradeoff: the engine relies on regex-based HTML parsing rather than LLM interpretation, so judgment calls (is this title compelling? is the H1 too generic?) are coarser. For pure numeric checks (length, count, density, schema presence, citation count) the engine is identical to the auditor.

Use both:
- **Engine** for the sitewide sweep (find worst pages, cluster aggregates, cross-cutting issues)
- **WebFetch auditor** for deep-dive on the 3-5 pages the engine flags as P0
