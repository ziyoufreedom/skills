---
name: seo-fix
description: |
  Apply prioritized SEO fixes from an audit report. Reads `SEO-AUDIT-REPORT.md`
  (or equivalent), classifies each finding by severity + owner skill, and either
  applies fixes directly (canonical, hreflang, sitemap, robots, llms.txt, NAP
  consistency, internal links, thin content prompts) or hands off to a specialist
  skill (`seo-perf-audit-fix` for Lighthouse-style perf, `seo-ld-json` for
  schema-specific repairs).

  Triggers when the user says: "fix SEO issues", "apply audit fixes",
  "fix SEO-AUDIT-REPORT.md", "now fix everything", "make my site rank",
  "实施 SEO 修复", or pastes an audit report and asks to apply fixes.

  Pairs with `seo-audit` (the auditor that produces the report). Don't reach
  for this skill until you have an audit report — running it without findings
  has nothing to do.

  This is a **meta-orchestrator**: it owns the workflow and the
  middle-ground fixes that no other SEO skill specifically handles.
license: MIT
---

# SEO Fix Skill

Convert audit findings into shipped fixes. Acts as a routing layer over the existing SEO skill ecosystem (`seo-perf-audit-fix`, `seo-ld-json`) for the categories they cover, and a direct executor for everything in between.

## When to use

- After `seo-audit` produces `SEO-AUDIT-REPORT.md`
- After an external Lighthouse/PSI/Search Console audit, when the user wants comprehensive cleanup (not just perf)
- When the user pastes a list of SEO issues and says "fix these"

If the user only has Lighthouse output and only wants perf patches → use `seo-perf-audit-fix` directly, skip this.
If the user only wants to add JSON-LD to one page → use `seo-ld-json` directly, skip this.

## Process

### 1. Locate the audit report

Default path: `./SEO-AUDIT-REPORT.md` (where `seo-audit` writes by default).

If missing, ask the user where the report is, or offer to run `seo-audit` first.

If the user pastes findings inline instead, parse from the conversation.

### 2. Classify each finding by severity AND owner skill

The audit report from `seo-audit` already includes an `owner:` field per finding. Use it. For external audits, classify yourself using the routing table below.

| Owner skill | When to route there | Example findings |
|---|---|---|
| **self** (this skill) | Architectural / sitewide / cross-cutting concerns | duplicate canonicals, missing hreflang, thin content prompts, NAP inconsistency, llms.txt, broken internal links, sitemap missing, robots.txt issues, missing redirects |
| **`seo-ld-json`** | Schema-specific add/fix | "Missing FAQPage schema", "No BreadcrumbList", "Organization missing sameAs", "Service schema needs @id" |
| **`seo-perf-audit-fix`** | Lighthouse/PSI-style perf patches | render-blocking CSS, font preload, image alt missing (when from PSI), Core Web Vitals findings, color contrast, redundant alt |
| **manual** | Architectural rewrites | SPA → SSG migration (flag for separate ticket — too big for a fix pass) |

### 3. Apply fixes in priority order

Critical → High → Medium → Low. Within each tier, group by file so each file is touched at most once per session.

For each batch (self-owned), use the patterns below. For owner=other-skill, invoke that skill with the relevant findings.

### 4. Verify after fixes

After applying all fixes, ask the user to re-run `seo-audit` to confirm score lift. Diff the new scorecard against the original. Surface any regressions.

## Self-owned fix patterns

### 1. Duplicate canonicals → self-canonical

**Symptom**: all pages have `<link rel="canonical" href="https://example.com/">`.

**Fix** (Astro):
```astro
---
// In SiteLayout.astro:
const canonical = new URL(Astro.url.pathname, Astro.site).toString();
---
<link rel="canonical" href={canonical} />
```

**Fix** (Next.js):
```jsx
import { headers } from 'next/headers';
// In layout / metadata:
export async function generateMetadata({ params }) {
  return {
    alternates: { canonical: `https://example.com${pathname}` },
  };
}
```

For React SPAs without SSR: **don't try to fix with useEffect** — Google won't run the JS for canonicals reliably. Flag for SSG migration instead.

### 2. Missing hreflang on multilingual site

**Symptom**: site has `/en/...` and `/zh/...` trees but no `<link rel="alternate" hreflang="...">`.

**Fix** (Astro): in SiteLayout, given `lang` and pathname:
```astro
---
const altLang = lang === 'en' ? 'zh' : 'en';
const altPath = lang === 'en' ? `/zh${pathname}` : pathname.replace(/^\/zh/, '');
const otherHref = new URL(altPath, Astro.site).toString();
---
<link rel="alternate" hreflang={lang === 'en' ? 'en' : 'zh-Hans'} href={canonical} />
<link rel="alternate" hreflang={altLang === 'en' ? 'en' : 'zh-Hans'} href={otherHref} />
<link rel="alternate" hreflang="x-default" href={lang === 'en' ? canonical : otherHref} />
```

### 3. Thin content (page < target word count)

Don't pad — write substantive sections. For service pages:
- **Conditions treated** (3–8 specific conditions, named)
- **What to expect** (3-step numbered: intake → session → aftercare)
- **Benefits** (bullet list, specific not generic)
- **Why choose us** (trust block: credentials, years, approach)
- **FAQ** (3–5 questions, plain answers)
- **Related services** (2–3 internal links)

Use the source-of-truth content record pattern (`src/lib/content/services-*.ts` if Astro local-biz-astro). Edit the record, the template renders.

For each thin page, propose 2–3 sections to add based on the page's existing topic. **Never invent statistics, credentials, or claims**.

### 4. NAP inconsistency

Single source of truth: `src/lib/content/business.ts` (or equivalent). Every footer/header/contact/schema render should import from that file. Audit every file that renders address/phone/email and refactor to import.

### 5. Missing llms.txt

Create `public/llms.txt` per [llmstxt.org spec](https://llmstxt.org):
```markdown
# Brand Name

> One-sentence description, hook for AI crawler.

Location + key practitioners + business essence.

## Pages

- [Home](/): purpose
- [About](/about): purpose
- ...

## Service Pages

- [Service A](/service-a): purpose
- ...
```

URLs in llms.txt should be relative (cross-domain portable) OR match canonical exactly.

### 6. Broken internal links

If audit shows 404s from internal links: grep source for the broken URLs and fix to current routes. For legacy URL patterns (e.g., footer still links to old hyphenated paths), add to `public/_redirects` (Cloudflare) or `astro.config.mjs#redirects` for 301s.

### 7. Missing sitemap.xml

Generate via a build-time script (Astro example):
```js
// scripts/generate-sitemap.mjs — walks dist/ for index.html files
// See _seo-evaluation/claude-seo or local-biz-astro skill for full template.
```

Wire into `npm run build` as a post-build step.

### 8. Missing hero CTAs

If audit flags pages without a "Book"/"Call" CTA in the hero (e.g., /about, /faq, /practitioners), add one CTA section. Should always be:
- Primary: book/contact (the conversion goal)
- Secondary: phone link (mobile-friendly)

### 9. Slug-vs-body keyword mismatch

If the URL slug contains a phrase that never appears in body copy (e.g., URL `/manhattan/anxiety-stress-acupuncture` but body says "stress and anxiety" not "anxiety stress acupuncture"), edit the H1 or first paragraph to use the exact slug phrase once naturally. This unlocks exact-match ranking.

### 10. Missing OG image / og-image.jpg returns 404

Create a 1200×630 OG image:
- Generate via design tool (Figma) or `generate-og.py` (PIL) — brand logo + page title centered
- Save to `public/og-image.jpg` (or per-page `public/og/<slug>.jpg`)
- Reference in SiteLayout default `ogImage`

## Routing to other skills

### To `seo-perf-audit-fix`

Findings that mention any of: `LCP`, `CLS`, `INP`, `FCP`, `TBT`, `render-blocking`, `font preload`, `cache-control`, `color contrast`, `WCAG`, `redundant alt`, `Lighthouse`, `PageSpeed`, `critical request chain`, `unused CSS`, `forced reflow`.

Invoke: "Use `seo-perf-audit-fix` on these findings: [list]"

### To `seo-ld-json`

Findings that mention any of: `schema`, `JSON-LD`, `Organization`, `LocalBusiness`, `Product`, `Service`, `FAQPage`, `BreadcrumbList`, `Review`, `AggregateRating`, `Person`, `WebSite`, `@type`, `@id`, `rich results`.

Invoke: "Use `seo-ld-json` to add/fix: [list]"

### Coordination

If the same file needs changes from both this skill and a hand-off skill, **batch all changes for that file** in one Edit operation. Don't make two separate writes — leave a clean diff.

## Verification protocol

After fixes:
1. Run `npm run build` (or framework equivalent) — must pass
2. Run `npm run audit:links` if available — must report no broken internal links
3. Re-run `seo-audit ./dist` or `seo-audit https://...` — score should be higher
4. Diff the new `SEO-AUDIT-REPORT.md` against the previous one; surface:
   - Categories improved
   - Categories unchanged or regressed
   - Outstanding findings (Medium/Low that were not addressed)

If a critical finding remains after fixes, **stop and surface to user** — don't claim success.

## What this skill won't do

- **Won't migrate framework** (SPA → SSG). That's a separate engagement; flag and propose `local-biz-astro` skill if applicable.
- **Won't write content from scratch for ranking** if it would require fabricating claims. Will propose a structure + ask user for the facts.
- **Won't commit changes** unless the user asks. Stages files and surfaces the diff.
- **Won't deploy** — that's a separate concern.

## Output convention

After each fix pass:
- Update `SEO-AUDIT-REPORT.md` with a `## Fix Pass <timestamp>` section listing what was applied + what was deferred
- Report total findings closed / remaining
- Suggest next steps (re-audit, content review, etc.)

## Integration with the SEO skill ecosystem

```
seo-audit  →  SEO-AUDIT-REPORT.md
                    ↓
                seo-fix  ────┬──────►  self (canonical, hreflang, NAP, llms.txt, thin content, ...)
                             ├──────►  seo-ld-json   (schema-specific patches)
                             └──────►  seo-perf-audit-fix (Lighthouse-style perf)
                    ↓
seo-audit (rerun, verify score lift)
```

This skill is the **glue** that turns audit findings into a coherent, prioritized fix campaign without leaving the user juggling 5 different SEO tools.
