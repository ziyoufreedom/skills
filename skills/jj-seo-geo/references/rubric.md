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

## SERP Features layer (100 pts) — engine extension

Not part of the upstream v9.9.9 rubric. Added because "rank #1" is no longer the
whole game: on a local-business query the blue link is often below a local pack,
a People-Also-Ask block, and a featured snippet. This layer scores whether a page
is *eligible* for those slots. Every check maps to a documented Google feature
requirement, and every one is verifiable from static HTML.

| Dimension | Pts | Full marks when |
|---|---:|---|
| FAQ rich result | 10 | `FAQPage` schema present (6) + ≥4 `Question` nodes (4) |
| PAA alignment | 10 | ≥5 headings/`<dt>` whose text contains `?` (3 → 3pts, 5+ → 10) |
| Snippet paragraph | 15 | ≥2 paragraphs of 35-75 words placed immediately after an `</h2>`/`</h3>` |
| Snippet list | 10 | ≥1 `<ol>` with ≥3 `<li>` |
| Snippet table | 10 | ≥1 `<table>` with ≥3 `<tr>` |
| Image pack | 10 | ≥2 body images with `alt` ≥30 chars (1 image → 5) |
| Review stars | 10 | `AggregateRating` node in the graph |
| Local pack | 10 | LocalBusiness node carrying both `geo` and `openingHoursSpecification` |
| Breadcrumb | 5 | `BreadcrumbList` schema |
| Speakable | 5 | `SpeakableSpecification` node (voice assistants / AI read-aloud) |
| Social cards | 5 | `og:image` (3) + `twitter:card` (2) |

### Why the 35-75 word window

Google's featured-snippet paragraphs cluster around 40-60 words; below ~35 the
passage rarely carries a complete answer, above ~75 it gets truncated mid-thought.
The engine requires the paragraph to *directly follow a heading* because that is
the passage-ranking unit — a heading that poses the question plus a self-contained
answer beneath it is the single highest-leverage pattern in this whole layer.

### SERP band interpretation

| Score | Read |
|---|---|
| 90-100 | Eligible for snippet, PAA, local pack, and rich results simultaneously. |
| 70-89 | Wins rich results but leaves snippet/PAA slots to competitors. |
| 50-69 | Blue link only. Schema exists but the body has no extractable structures. |
| <50 | Invisible outside the ten blue links. |

### The three cheapest sitewide lifts

Ordered by points-per-edit, measured on a 46-page site that went 67.8 → 90+:

1. **Layout-level schema** (LocalBusiness geo+hours, Speakable, og/twitter) — one
   edit to the shared layout, +30 on every page at once.
2. **Convert one existing list into a real `<table>`** in a shared template. A
   pricing `<ul>` rendered as `<table>` lifted 13 service pages by 10 each.
3. **One question-form `<h2>` + a 40-60 word answer** per page — +15, and it is
   the same edit that fixes GEO DirectAnswer.

---

## How the engine differs from line-by-line WebFetch auditing

The on-page-seo-auditor skill's default mode (WebFetch one URL, score with the rubric) burns 1 model pass per URL. For a 42-page site that's 42 × ~30s = 21 min wall + cost. **This engine encodes the rubric in 580 lines of pure Node** that walks `dist/` in 0.3 seconds and emits the same scorecard structure — same rubric, same dimensions, same grades.

The tradeoff: the engine relies on regex-based HTML parsing rather than LLM interpretation, so judgment calls (is this title compelling? is the H1 too generic?) are coarser. For pure numeric checks (length, count, density, schema presence, citation count) the engine is identical to the auditor.

Use both:
- **Engine** for the sitewide sweep (find worst pages, cluster aggregates, cross-cutting issues)
- **WebFetch auditor** for deep-dive on the 3-5 pages the engine flags as P0
