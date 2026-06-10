---
name: b2b-saas-google-ads
description: End-to-end Google Ads campaign builder for B2B / enterprise SaaS products (AI platforms, MCP gateways, agent infrastructure, dev tools, governance/compliance platforms, etc.). Use this skill whenever the user wants to plan, build, or refresh paid search for a B2B SaaS product where the buyer is an engineering / platform / security / compliance leader and conversions are demos / trials / Marketplace listings. Produces a single Google Ads Editor-ready unified CSV (campaigns + ad groups + keywords + RSAs + negatives + sitelinks + callouts + structured snippets) plus a tracking + retargeting setup guide. Always use this skill for B2B SaaS / enterprise product paid-search work — do NOT use the local-biz-google-ads skill (that one is for local service businesses with a phone-call funnel).
---

# B2B SaaS Google Ads Campaign Builder

Generates a complete, validated, Google Ads Editor-importable B2B SaaS paid-search account from a Python config. Output is **one** unified CSV (campaigns + ad groups + keywords + RSAs + negatives + sitelinks + callouts + structured snippets all in one file) plus a tracking + retargeting setup guide.

This skill is the B2B counterpart to `local-biz-google-ads`. The two are deliberately separate because the playbooks diverge:

| | local-biz-google-ads | **b2b-saas-google-ads** (this) |
|---|---|---|
| Buyer | consumer / SMB owner | engineering / platform / security / compliance leader |
| Decision time | minutes | weeks–months (multi-touch) |
| Conversion | phone call / form submit | demo booked / Marketplace listing / trial |
| LP architecture | single page | **intent-based 3-tier routing** (ToFu/MoFu/BoFu → different LPs) |
| Match types | Phrase + some Broad | **Exact for competitor terms, Phrase for category, never Broad** |
| Attribution | last-click | **Data-Driven Attribution + offline conversion uploads** |
| Negatives | trades / DIY / jobs | **business-line drift** (consulting / training / migration) + academic + brand pollution |
| Retargeting | optional | **Apollo enrichment + Customer Match is day-one** |
| EU TTPA | universal `No` | universal `No` (B2B SaaS is never political) |

## When to use this skill

Trigger whenever the user:
- Is launching paid search for a B2B SaaS, dev tool, AI platform, or enterprise infra product
- Has a SEMrush position-tracking export and wants ads aligned to those tracked keywords
- Needs to refresh/restructure existing B2B Google Ads campaigns
- Mentions ICP scoring, Apollo enrichment, Customer Match, or Marketplace listings in the same breath as Google Ads
- Asks for "Google Ads for [SaaS product]" where the product is sold via demo or self-serve trial

If the request is for a local service business (massage, restaurant, dental, legal, home services, etc.), use `local-biz-google-ads` instead. The two skills are not interchangeable.

## Input requirements (ask the user if missing)

Before generating anything:

1. **Product** — name, category, primary value prop (one sentence)
2. **Landing pages** — at minimum (a) product page with demo CTA and (b) editorial/content hub URL if exists. Specify which sub-pages exist (e.g., `/comparisons/`, `/pricing/`, `/docs/`, `/registry/`).
3. **Boss-tracked keyword list** — almost always a SEMrush position-tracking export (`.xls` / `.xlsx`). Extract keywords + CPC + Volume + KD + tracked URL. The set of keywords the boss watches is the **commercial reality** of the campaign — ads spend on keywords outside this set is invisible to leadership.
4. **Excluded business lines** — what *not* to advertise (consulting, training, services). These become Account-level shared negatives.
5. **Monthly budget** — typical B2B SaaS Phase 1 MVP: $2,000–5,000/mo across 3–5 campaigns.
6. **Competitors** — by name. These drive `{competitor} alternative / pricing / demo` ad groups.
7. **Geo targeting** — usually `US; CA; UK; AU` for English-language enterprise SaaS; expand for brand defense only.

If user provides a SEMrush XLS at a path, **read it first** with `openpyxl` (rename `.xls` → `.xlsx` if `file` reports it as zip/PK header — SEMrush exports often have wrong extension).

## Workflow (execute in order)

### Step 1: Read the SEMrush export and audit landing pages

```python
import openpyxl
wb = openpyxl.load_workbook(path, data_only=True)
ws = wb.active
# rows: Keyword | rank | visibility | type | landing | difference | ... | CPC | Volume | KD
```

Classify each tracked keyword by **funnel stage**:

| Stage | Signal | Example | LP target |
|---|---|---|---|
| **BoFu** (purchase intent) | competitor name + pricing/demo/alternative; product brand defense | `moveworks demo`, `glean alternative`, `jarvis chat` | **product page with demo CTA** |
| **MoFu** (comparison/evaluation) | "vs", "compare", category leader names | `jarvis vs moveworks`, `mcp gateway` (Phrase) | **comparison page** (must have CTA — see Step 2) |
| **ToFu** (research/education) | "what is", "how to", "vs RAG", concept words | `mcp vs rag`, `agentic ai governance`, `what is an ai gateway` | **editorial hub** (retargeting seed; do NOT expect direct conversion) |

Use `web_fetch` to verify each candidate LP **has a demo CTA / form / one-click conversion path**. Editorial / content-hub pages often *don't* — that's a critical risk.

### Step 2: LP audit (CRITICAL — flag editorial pages without CTAs)

Common pattern: company has a "field guide" / "research hub" / "blog" domain (e.g., `exploreagentic.ai`) that the marketing team wants to push for SEO equity, but it has zero demo CTAs in-page. **Sending paid traffic to such a page tanks CVR by 5–10×.**

For each candidate LP:
1. `web_fetch` → check for demo CTA / form / sticky bar / clear CTA above-the-fold
2. If editorial-only (no CTA), **do not route BoFu paid traffic there**. Either:
   - Route only ToFu/MoFu traffic there (acceptable — capture for retargeting)
   - OR flag to user: "needs sticky 'Schedule Demo' bar before launch — 1–2 weeks of CTO work"

Document the LP routing decision in a clear matrix the user can review.

### Step 3: Build the config

Copy `assets/example_b2b_saas_config.py` and edit. The config dict has:
- Account-level: `account_negatives` (shared list), `tracking_template`, `geo_targeting`
- Per-campaign: `name`, `daily_budget`, `bid_strategy`, `ad_groups`
- Per-ad-group: `name`, `default_max_cpc`, `final_url`, `keywords`, `rsa`
- Sitelinks + callouts + structured snippets at account level (shared)

See `references/config_schema.md` for the full schema and `references/keyword_taxonomy.md` for the ToFu/MoFu/BoFu intent classifier.

### Step 4: Generate the master CSV

Run `scripts/build_master_csv.py`. It produces ONE wide CSV with rows for every entity type, in Google Ads Editor unified bulk-import format:

```
Campaign | Campaign type | Status | Daily budget | Bid strategy type | Networks | Languages | Locations |
Ad group | Default max CPC |
Keyword | Match type | Max CPC | Final URL |
Ad type | Headline 1..15 | Description 1..4 | Path 1 | Path 2 |
Sitelink text | Description Line 1 | Description Line 2 |     ← sitelink URL goes in shared Final URL column
Callout text |
Snippet header | Value 1..10 |                                ← values split into separate columns, NOT joined by `;`
Language |                                                     ← asset-level (defaults English)
EU political advertising                                       ← campaign-only
```

Each row has only its own entity's columns filled; other columns are blank. Editor matches rows by which columns are populated. Sitelinks share the `Final URL` column with keywords/ads (Editor's canonical bulk format). Snippet values are NEVER concatenated with `;` into one cell — Editor reads them from separate `Value 1`..`Value 10` columns.

### Step 5: Validate (MANDATORY — never skip)

Run `scripts/validate_master.py`. It checks:
- RSA Headlines ≤ 30 chars, Descriptions ≤ 90, Path 1/2 ≤ 15
- Sitelink text ≤ 25 chars, descriptions ≤ 35
- Callouts ≤ 25 chars
- Structured snippet values ≤ 25 chars each
- No duplicate keywords (same campaign + ad group + keyword + match)
- All Final URLs are HTTPS and reachable
- `EU political advertising = No` on every campaign row (required since 2024 EU TTPA — Editor blocks activation without it)
- `Networks` uses canonical Editor value (`Google search` not `Google Search Only`)
- `Bid strategy type` is canonical (`Manual CPC`, `Target impression share`, etc.)
- No "AWS Advanced **Consulting** Partner" wording in RSAs (B2B SaaS product ads must not imply consulting service line — see `references/business_line_guardrails.md`)
- Match Type is Exact for competitor + brand-defense keywords; Phrase for generic category; **errors on Broad**
- Geo `Locations` use semicolon separators

If any errors: fix the config, re-run generator + validator. Do not present output until 0 errors.

### Step 6: Tracking + retargeting setup guide

After CSV passes validation, generate `tracking_setup.md` (template in `references/tracking_guide.md`) with:
- gclid → form → CRM passthrough specifics
- Account-level Tracking Template (UTM canonical)
- Apollo enrichment + ICP scoring rubric (template in `references/retargeting_workflow.md`)
- Customer Match upload cadence
- Offline conversion upload (CRM stage → Google Ads)
- Data-Driven Attribution settings
- Failure early-warning watchlist (see `references/failure_thresholds.md`)

### Step 7: Package and deliver

Place all output in a project subfolder (e.g., `<project>/Jarvis/`):
- `<project>_master.csv` — the single CSV
- `tracking_setup.md` — ops guide
- `_source/` — config file + generator/validator scripts + raw SEMrush export

Present to user with:
1. Import order (single Editor import — File → Import → Choose CSV)
2. Pre-launch checklist (LP CTA verification, tracking smoke test, negative list applied at account level)
3. Phase ramp schedule (don't immediately go to full budget; ramp 25% → 50% → 100% over 3 weeks)
4. Decisions still open (LPs needing CTOs, budget realloc triggers)

## Critical guardrails (never violate)

1. **Never route BoFu (purchase-intent) paid traffic to an editorial / content-hub page without a demo CTA.** Quality Score may stay OK but CVR collapses.
2. **Never use Broad match in B2B SaaS Phase 1.** Google's Broad matching for B2B has historically pulled jobs/training/career queries. Use Phrase or Exact.
3. **Never advertise the parent company's other business lines.** If the product is the AI platform, the ads must not pitch consulting / training / migration / managed services. Add those as account-level negatives even if the parent company offers them.
4. **EU political advertising = No** must be set on every campaign (2024 EU TTPA enforcement; Editor blocks activation).
5. **Always launch Paused.** Phase 0 is infra (tracking + Apollo + ICP scoring + LP audit). Editor import → manual review → unpause only after Phase 0 acceptance.
6. **Budget allocation by LP readiness, not by keyword tier alone.** A high-value keyword cluster without a ready LP is a Phase 2 candidate, not Phase 1. Match ramp to LP delivery schedule.
7. **Keyword set must be ≥80% from boss-tracked SEMrush list** when one exists. Otherwise leadership can't see ad impact in their dashboard. Long-tails outside the tracked list need explicit justification.
8. **AWS / cloud-partner credibility signals** in B2B SaaS ads should say "AWS Advanced Partner" or "Available on AWS Marketplace" — NEVER "AWS Advanced Consulting Partner" (implies consulting service line).

## Output style

- Single CSV file (one wide unified CSV, not 10 separate files like local-biz-google-ads — B2B users do single import in Editor).
- All campaigns ship Paused.
- Always include: 8–10 sitelinks (mix product + comparison + editorial URLs), 8–10 callouts, 1–2 structured snippets.
- Place in a `<project>/Jarvis/` (or product-named) folder; archive source materials in `_source/` subfolder.
