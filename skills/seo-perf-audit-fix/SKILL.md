---
name: seo-perf-audit-fix
description: |
  Fix SEO and performance audit findings on static / SSG sites (Astro, Next.js SSG,
  Eleventy, Hugo). Triggers when the user pastes audit output from Lighthouse, PageSpeed
  Insights, Search Console, Sitechecker, SEMrush, or similar tools and asks to fix the
  findings, or mentions: thin content, word count too low, meta description too long
  / too short, missing alt attributes, color contrast / WCAG AA fail, render-blocking
  CSS, critical request chain, preconnect waste, "use efficient cache lifetimes",
  Google Fonts CDN, LCP / FCP / CLS issues, FAQ rich results, H1 / H2 / H3 hierarchy
  warnings, redundant alt text, forced reflow. Use this skill aggressively whenever the
  user pastes a structured audit report — even if they don't say "fix" explicitly,
  they almost always want fixes, not just commentary.
---

# SEO & performance audit fix patterns

This skill captures the patterns that turn audit findings into fixes — the ones that pass on the next re-audit instead of triggering a new warning. It assumes a static-site stack (Astro / Next.js SSG / similar) and a Tailwind-style design token system. The patterns are all from real audit fix cycles, not theory.

## How to read audit reports

Auditors are **noisy and sometimes wrong**. Before fixing anything, classify each finding:

- **Real** — reproducible against the rendered HTML / CSS. Fix.
- **False positive** — the auditor parsed a templated attribute as missing (e.g., `alt={SITE.name}` shows as `alt=""` to a regex-based scanner). Verify by reading the source AND the dist HTML. Skip.
- **Out of scope** — third-party (Cloudflare beacon's "forced reflow", Cloudflare's own short cache TTL on `/beacon.min.js`, Google Fonts cache TTL set by Google). Acknowledge and move on; don't try to fix.
- **Already passing** — the auditor's "recommendation" is met but it still prints a table that looks like a deficiency. The "Header tag usage" check that lists H4=0, H5=0, H6=0 is a classic case — it just means "you're not using these levels", not "you must use these levels".

When in doubt: open the rendered HTML (`dist/` or view-source) and grep for the actual element the auditor flagged. If the live HTML disagrees with the audit, the audit is stale (CDN cache) or wrong.

## Thin content (word count < 1500-2000)

The highest-ROI fix is almost always to **add a FAQ section + FAQPage JSON-LD**. It compounds:

1. Adds 400-700 words of substantive copy
2. Each Q becomes an H2/H3 carrying long-tail keywords
3. FAQPage schema renders as expandable rich-result cards in SERPs (huge real estate gain, often higher CTR than the headline result)
4. Zero design churn — FAQ blocks fit any layout

### Pattern

Add the FAQ data to the page's content object (the same place hero/sections live), keyed by `entries: [{question, answer}, ...]`. Render with semantic `<dl><dt><dd>` so the markup itself signals Q&A structure to crawlers. Then wire `faqLd(entries)` into the page's JSON-LD `@graph`.

```astro
{/* Visible FAQ — H3 per question for long-tail */}
<dl class="divide-y divide-ink/15 border-t border-ink/80">
  {entries.map((entry, i) => (
    <div class="grid gap-3 py-7">
      <dt>
        <span class="figure-num text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
        <h3>{entry.question}</h3>
      </dt>
      <dd>{entry.answer}</dd>
    </div>
  ))}
</dl>
```

```ts
// faqLd helper — emit alongside articleLd / websiteLd in the page graph
export function faqLd(faq: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };
}
```

**Question selection** — pick the top 5-7 questions a real reader/buyer would ask before bookmarking. Mix definition questions ("What is X?"), comparison questions ("X vs Y?"), and process questions ("How often / how do I ..."). Each answer should be 60-100 words — enough to look substantive in SERPs without bloating the page.

**Hard rule from Google**: never emit FAQPage schema for FAQs that aren't visibly rendered on the page. Google penalizes invisible markup. The visible `<dl>` is mandatory.

### Word count thresholds — what auditors actually count

Auditors disagree on what counts toward "word count". Some count whole-page visible text; some count only `<main>` content (excluding header / nav / footer). On a typical content-hub home page the gap is 200-400 words. Aim for **main-content > 2000** to pass the strictest scanners. If you've added a FAQ and you're still under threshold, the next-best lever is to extend the FAQ to 8-10 entries — each substantive entry adds 60-100 words AND another long-tail H3 AND another FAQPage schema entry, so the marginal cost is low and the SEO compounding is high. Avoid padding hero copy or stuffing keyword-density paragraphs; auditors don't care about those, and human readers do.

## Header hierarchy (H1/H2/H3 distribution)

Auditors often print an H4=0 / H5=0 / H6=0 table that *looks* like a deficiency. It isn't. The standard recommendation is **"H1 + at least 2 other levels"** — usually H2 + H3. If the page already has both, the audit is passing.

**Don't add fake hierarchy to game the table.** Forcing H4/H5/H6 onto content that doesn't have three real layers of nesting is a dark-pattern keyword stuffing signal. Google rewards header tags that match real content structure, not header tags for their own sake.

When the audit suggests "more H3s", first check whether you can add a FAQ section (that brings 5-7 long-tail H3s legitimately). If not, leave it alone.

## Title tag length — ≤60 chars

Google truncates `<title>` past ~60 chars in SERPs (some say 50–55 to be safe — depends on pixel width of the rendered chars). SEO scanners (Sitechecker, Semrush, Screaming Frog) flag anything over 60. The brand suffix " | Brand Name" is usually 15–20 chars, so for any page whose own headline is over ~42 chars, blindly appending the suffix pushes the title over the limit.

### Fix at two layers

**Mechanical layer — composeTitle helper**: instead of every page doing `\`${pageTitle} | ${SITE.name}\``, route through a helper that drops the suffix when total exceeds 60:

```ts
export function composeTitle(pageTitle: string): string {
  const suffix = ` | ${SITE.name}`;
  return pageTitle.length + suffix.length <= 60
    ? pageTitle + suffix
    : pageTitle;
}
```

Apply with a regex codemod across page templates:

```python
RE_CONST = re.compile(r'`([^`]+?) \| \$\{SITE\.name\}`')
# replace with: composeTitle(`{group(1)}`)
```

This alone fixes the borderline cases where the page title fits in 60 but adding the suffix doesn't.

**Content layer — rewrite source titles**: titles that exceed 60 even without the brand suffix need their source field shortened. For sites with separate `seoTitle` / `displayTitle` fields, only edit `seoTitle` so the visible H1 (`displayTitle`) stays expressive. Aim for ≤45 chars on `seoTitle` so the full title with suffix lands at ~60.

### Verification (decode HTML entities first)

The trap: `'` in titles becomes `&#39;` in dist HTML, which is 5 bytes vs 1 char. Naive byte-count over the rendered HTML overstates length. Use Python's `html.unescape()` before measuring:

```python
import html, re, glob
RE = re.compile(r'<title>([^<]+)</title>')
for f in glob.glob('dist/**/*.html', recursive=True):
    title = html.unescape(RE.search(open(f, encoding='utf-8').read()).group(1))
    if len(title) > 60:
        print(f'{f}: [{len(title)}] {title}')
```

### What good titles look like

- **Comparison pages**: `"X vs Y (YYYY)"` or `"X vs Y: short qualifier"` — name both vendors and the year. Avoid filler like "the buyer's guide to" / "(with disclosure)".
- **Insight / explainer pages**: lead with the indexed noun phrase ("Enterprise AI Adoption Framework"), drop the marketing subtitle. Subtitles can live in the visible H1, not the SEO title.
- **Case studies**: `"Customer: Topic — Case Study"` keeps the key entities at the front.
- **Pillar / category pages**: short, keyword-rich, brand-appendable.

## Meta description length

Target **120-160 characters**. Below 120 is "too short" (low SERP weight). Above 160 gets truncated mid-sentence with `…`.

Pattern for variable-length descriptions: walk sentence boundaries, stop before adding the next sentence would push over the target. Avoids mid-word cuts.

```ts
export function metaExcerpt(text: string, target = 160): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= target) return cleaned;
  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  let out = "";
  for (const s of sentences) {
    const proposed = out ? `${out} ${s}` : s;
    if (proposed.length > target && out.length > 0) break;
    out = proposed;
    if (out.length >= target) break;
  }
  return out.length > target
    ? cleaned.slice(0, target).replace(/\s+\S*$/, "") + "…"
    : out;
}
```

For **trimming a description that's slightly over** (e.g., 177 → goal 160): drop the last sentence rather than reword. Often the trailing sentence is a date stamp ("Edited April 2026.") that's redundant with the per-article published date in JSON-LD anyway.

## Image alt attributes

Auditors disagree about alt rules. The truth:

| Image is… | Correct alt | Why |
|---|---|---|
| Content (article cover, author headshot, hero photo) | Descriptive sentence | Screen readers read it; SEO ranks on it |
| Decorative icon next to a text label | `alt=""` + `aria-hidden="true"` on parent | Adjacent text already labels; alt would duplicate |
| Inline SVG (set:html or `<svg>`) | `aria-hidden="true"` if decorative; `role="img" aria-label="..."` if meaningful | SVGs default to img-role in some browsers; needs explicit ARIA |
| Logo inside a link with same text next to it | `alt=""` | Link's accessible name comes from the visible text; non-empty alt makes screen readers say it twice |

**The "redundant alt" trap**: `<a href="/"><img alt="Brand"><span>Brand</span></a>` is technically valid HTML but Lighthouse correctly flags it. Set `alt=""` on the image — the link still has a clear accessible name from the visible text.

**The "alt= empty as missing" trap**: some SEO scanners count `alt=""` as a missing alt and flag it. They're wrong per WCAG, but if the image is meaningful (e.g., an author headshot) you should give it a real alt anyway. Don't use `alt=""` defensively for content images — only for genuinely decorative ones.

**The logo alt ping-pong**: a brand logo in the site header / footer sits inside a link with the brand name rendered next to it. WCAG / Lighthouse want `alt=""` (avoid screen readers reading the brand twice). Many SEO scanners (Sitechecker, SEMrush, Screaming Frog) count `alt=""` as missing. The compromise that satisfies both: use a short, distinguishing alt that is **not identical** to the visible text, e.g., `alt="<Brand> logo"` or `alt="<Brand> wordmark"`. The single extra word ("logo" / "wordmark") makes it differ from adjacent text so Lighthouse stops calling it redundant, and being non-empty satisfies the SEO scanners. Past incident: header/footer logos were repeatedly flagged — first as "missing alt" (when value was set), then as "redundant alt" (when value matched adjacent text), then as "missing alt" again (when set to ""). The "<Brand> logo" pattern broke the cycle.

### Featured / cover images

For article cover images on listing pages, `alt={article.title}` is weak — the title is rendered as visible text right next to the image, so it's a duplication. Strengthen to:

```astro
alt={`Cover image — ${article.title} (${article.cluster}, ${article.eyebrow})`}
```

The bracketed metadata gives the alt unique informational content vs the visible title.

## Color contrast — design-token systems

Audit fails contrast when an accent color (warm orange, brand color, etc.) sits on a dark surface (`bg-ink`, dark navbar, dark CTA). The single `--accent` variable that works on light surfaces will usually fail WCAG on dark.

**Wrong fix**: globally darken `--accent`. Breaks all the places where the original color was the design language.

**Right fix**: define a `*-bright` variant explicitly for dark surfaces, surface it as a Tailwind utility, then audit and migrate only the dark-surface uses.

```css
:root {
  --accent: 22 74% 42%;        /* light-surface accent (HSL) */
  --accent-ink: 22 74% 28%;    /* darker variant for hover / emphasis */
  --accent-bright: 22 78% 62%; /* DARK-SURFACE variant — ~8:1 vs --ink */
}
```

```js
// tailwind.config — expose as a sibling utility
accent: {
  DEFAULT: "hsl(var(--accent))",
  ink: "hsl(var(--accent-ink))",
  bright: "hsl(var(--accent-bright))",
},
```

Then grep for `text-accent\b` (word boundary, to exclude `accent-ink` / `accent-soft`) and audit each hit's surrounding background. Anything on `bg-ink` / `bg-paper` (paper-warm-ink-side) / dark gradients gets switched to `text-accent-bright`. Keep the others as-is.

### Picking the lightness value

For ochre/orange accents on near-black `--ink`:
- Lightness ~42% → contrast ~2.8:1 (AA fail for normal text, needs 4.5:1)
- Lightness ~58-62% → contrast ~6-8:1 (AA + AAA for normal text)

Compute or estimate before committing. For HSL hue between 20-50 (warm orange/yellow), lightness 60-65% on near-black hits AAA. For cooler hues (blue, green) you can usually go a bit lower.

## Self-host fonts (drop Google Fonts CDN)

Self-hosting eliminates several distinct audit findings at once:
- 2 third-party preconnects (`fonts.googleapis.com`, `fonts.gstatic.com`)
- "Use efficient cache lifetimes" (Google sets short cache TTL; you control yours)
- Render-blocking external CSS request (Google Fonts CSS file)
- GDPR / privacy (no IP exfiltration to Google)

### The pattern (no codebase rename pass)

The trick is to write your own `@font-face` declarations using the **bare family names** already in your CSS (`Fraunces`, `Inter`, `JetBrains Mono`), with `src: url()` pointing at `@fontsource-variable/*` woff2 files via Vite's bare-import resolution. This means **zero changes to existing CSS or Tailwind config** — every existing `font-family: "Fraunces"` reference still resolves.

```bash
npm i @fontsource-variable/fraunces @fontsource-variable/inter @fontsource-variable/jetbrains-mono
```

```css
/* Top of global.css — Vite resolves the bare specifier paths and hashes the woff2 files into /_astro/ */
@font-face {
  font-family: 'Fraunces';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2') format('woff2-variations');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: 'Fraunces';
  font-style: italic;
  font-weight: 100 900;
  font-display: swap;
  src: url('@fontsource-variable/fraunces/files/fraunces-latin-full-italic.woff2') format('woff2-variations');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2') format('woff2-variations');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 100 800;
  font-display: swap;
  src: url('@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2') format('woff2-variations');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

For Fraunces, use the `full` flavor when the design uses the SOFT axis or the `opsz` axis (both common for editorial layouts). For Inter and most other fonts, the `wght` flavor is sufficient. Skip italic versions for fonts you don't render in italic.

**Subset choice**: latin-only is right for English-only sites. ~250-350 KB total for three families with full axes. If the site renders Cyrillic / Greek / Vietnamese / Latin Extended, add the corresponding `unicode-range` blocks (copy from the fontsource package's CSS).

Then in BaseHead / layout, **remove**:
- The `<link rel="preconnect">` to fonts.googleapis and fonts.gstatic
- The `<link rel="preload" as="style">` for the Google Fonts URL
- The `<link rel="stylesheet">` (and any `media="print" onload` swap)
- Any `<noscript>` fallback for the same

### Preload the LCP fonts

For the font that paints the H1 / hero / main content (almost always the display serif), add a `rel=preload` so it starts fetching during HTML parse, not after CSS load. Vite's `?url` import gives you the same hashed path the CSS uses, so the preload and the @font-face request dedupe:

```astro
---
import frauncesNormal from "@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2?url";
import frauncesItalic from "@fontsource-variable/fraunces/files/fraunces-latin-full-italic.woff2?url";
---
<link rel="preload" as="font" type="font/woff2" href={frauncesNormal} crossorigin="anonymous" />
<link rel="preload" as="font" type="font/woff2" href={frauncesItalic} crossorigin="anonymous" />
```

**Preload italic too** when the H1 contains an `<em>` or any italic text — both files are part of the LCP paint. Without italic preload, the italic file chains behind the CSS request, costing 200-400 ms on cold visits.

**Don't preload body fonts** (Inter, JetBrains Mono) unless they're in the first viewport. Preload weight is precious; over-using it can hurt other resources.

## Critical rendering path (CSS inlining)

If the audit shows "Render blocking requests — `_astro/*.css` 8 KiB / 170-300 ms" or "Maximum critical path latency 500+ms", the page CSS is the bottleneck.

### Astro

Set in `astro.config.mjs`:

```js
build: {
  inlineStylesheets: "always",  // or "auto" for ≤4KB only
}
```

`'always'` inlines the entire page CSS into a `<style>` tag in the HTML, removing the network round-trip for CSS entirely. Cost: HTML grows by the gzipped CSS size (typically +5-10 KB per page). Benefit: no render-blocking CSS request, fonts (which @font-face from inside that CSS) start fetching the moment the HTML is parsed instead of waiting for the CSS request to complete.

For content sites where users land cold and bounce — the trade-off is clearly worth it. The HTML caches at the CDN edge anyway, so the "lost" CSS caching across pages is minor.

### Next.js / other

- Next.js inlines critical CSS by default for App Router pages.
- Eleventy / Hugo: use a critical-CSS plugin (e.g., `critical` npm package as a postbuild step) or inline manually.

## Broken images — `onerror` hides the visual but not the 404

A common defensive pattern is `<img src="..." onerror="this.style.display='none'">` — when the file is missing the broken-image icon disappears and the layout falls back to a placeholder (monogram, blank box, etc.). This is fine for users but **does not fix the SEO / crawl problem**: Googlebot, Sitechecker, Semrush, Ahrefs, and every link-checker still issues the GET request, still gets a 404, and still records the URL as a broken internal image.

The trap is most common on **author / contributor avatars**: the data record has `photo: "/images/authors/<slug>.jpg"` but the actual file was never uploaded. The site renders fine because of the monogram fallback, but every page that lists the author cards (the home masthead, the /about page, the /authors index) emits a broken `<img>`. With N missing photos × M surfaces, audits report N×M 404s — easily 20-50.

### Fix

Make the image field **optional** in the data type, drop it from records that don't have a real file, and **conditionally render** the `<img>` only when the field is set:

```ts
// Type — make the field optional
export interface Author {
  // ...
  photo?: string;
  // ...
}
```

```astro
{/* Component — only emit <img> if a real file exists; monogram is the always-on baseline */}
<div class="avatar">
  <div class="monogram-fallback">{initials}</div>
  {author.photo && (
    <img src={author.photo} alt={`Portrait of ${author.name}`} loading="lazy" />
  )}
</div>
```

The monogram now sits **underneath** the conditional `<img>` so when the photo is present it covers the monogram (same visual as before); when the photo is absent there's no `<img>` tag at all, no network request, no 404.

### Why not just upload placeholder photos?

Synthetic / AI-generated headshots for real-named people violate the trust model of an editorial site. The right answer is either (a) commission real photos, or (b) ship the monogram as the primary representation. The conditional-render pattern lets (b) work cleanly until (a) lands.

### Verification one-liner

After the fix, walk dist/ and confirm zero `<img src>` references to non-existent files:

```python
import re, glob, os
present = set(os.listdir('public/images/authors'))
RE = re.compile(r'src="(/images/authors/[^"]+)"')
broken = {os.path.basename(m.group(1))
          for f in glob.glob('dist/**/*.html', recursive=True)
          for m in RE.finditer(open(f, encoding='utf-8').read())
          if os.path.basename(m.group(1)) not in present}
print(f'broken: {len(broken)}', broken)
```

## Anchor text — never link a raw URL

If an audit reports "N links have no anchor text" — typically a notice from Sitechecker / SEMrush / Ahrefs that goes into the hundreds — the cause is almost always **raw URLs used as anchor text**:

```html
<!-- WRONG — anchor text "https://anthropic.com/news/..." carries no semantic signal -->
<a href={c.url}>{c.url}</a>

<!-- WRONG — anchor text "click here" / "read more" / ">" / icon-only -->
<a href="...">read more</a>
```

SEO tools count raw URLs (and generic phrases like "click here", "more", icon-only links) as missing anchor text because the visible text doesn't describe the destination. Google uses anchor text as a ranking signal for the linked page — descriptive anchors transfer topical relevance. Raw URLs transfer nothing.

The trap is most common in **citation / source / reference blocks** where designers want to display the URL for trust ("you can see where this links") and accidentally make the URL itself the anchor. That pattern shows up at scale — a citation-heavy article has 10–20 sources, a content-heavy site has 100+ pages, the audit reports 1000+ "no anchor text" links.

### Fix pattern

Wrap the **descriptive metadata** (publisher + title, or just title) as the anchor. Demote the URL to plain text shown alongside, so users can still see the destination:

```astro
<a href={c.url} target="_blank" rel="noopener noreferrer" class="citation-link">
  <span class="font-medium">{c.publisher}</span>. <span class="italic">{c.title}</span>
</a>
<div class="text-xs text-muted">
  <span class="font-mono break-all">{c.url}</span>
  <span>· accessed {c.accessed}</span>
</div>
```

This keeps the URL visible (good UX, builds trust), gives the anchor a descriptive text like "Gartner. Predicts over 40% of agentic AI projects will be canceled by end of 2027" (good SEO + accessibility), and a single-pass fix to one component resolves every flagged page.

### Other anchor-text traps

- **Icon-only links** (e.g., social icons in footer) — add `aria-label="LinkedIn"` so screen readers and crawlers see semantic text. Visually keep the icon.
- **"Read more" / "Click here" / "Learn more"** — replace with the topic, e.g., "Read the MCP pillar", "See the agent ROI playbook". Google penalizes generic anchors slightly and they hurt accessibility.
- **`<a href="..."><img alt="..."></a>`** — the image's `alt` becomes the anchor text. Make sure the alt is descriptive (not `alt=""` for an image-only link).
- **Long URL "click-through" pattern** (`Visit https://example.com/...`) where the URL is rendered inline and linked — same problem as citations. Wrap the surrounding context as the anchor instead.

## Search Console "Page with redirect" — sitemap / internal-link slash mismatch

If Search Console flags **every URL in your sitemap** with status "Redirect", the cause is almost always a **trailing-slash mismatch** between the URLs you list in `sitemap.xml` and the URL the server treats as canonical. The pattern with static-site builds:

- `format: 'directory'` (Astro) / similar settings on Hugo / Eleventy / Next.js export → every route resolves to `/foo/index.html`, served at `/foo/` (trailing slash). Requests to `/foo` 308-redirect to `/foo/`.
- `<link rel="canonical">` in the rendered HTML emits `/foo/` (trailing slash) — that's what Astro's `Astro.url.pathname` returns inside the route.
- Your sitemap script — if it concatenates `${DOMAIN}${pathname}` without a trailing slash — emits `/foo` (no slash). Google fetches it, gets a 308 to `/foo/`, and reports the sitemap entry as "Page with redirect" / "Excluded".

### Fix

**1. Sitemap generator** — emit trailing slash for every non-root path:

```js
const loc = r === "/" ? `${DOMAIN}/` : `${DOMAIN}${r}/`;
```

**2. Internal links** — every `href="/foo"` in templates and data files should be `href="/foo/"` so users and Googlebot don't trigger a 308 on every internal click. This is also a crawl-budget win — each redirect costs Google one HTTP request.

**3. JSON-LD URLs and `slug` fields** — anything used to construct a public URL (`articleLd({slug, ...})`, `breadcrumbLd([{url, name}])`, `mainEntityOfPage @id`, profile/canonical URLs) must match the canonical with trailing slash. The cleanest place to fix is the `slug` field at the source — it propagates to all downstream consumers.

### Sweep pattern (codemod)

For projects with dozens of `href` literals, write a one-shot Python script:

```python
import re, os
# Match href="/path" (literal) and `/path/${var}` (template-literal) where
# the URL doesn't already end in /. Lookahead stops at the closing quote,
# fragment hash, or query.
RE_LIT = re.compile(r'(href\s*[:=]\s*["\'])(/(?!/)[a-z0-9][a-z0-9\-/]*?)(?=["\'#?])')
RE_TPL = re.compile(r'(/[a-z][a-z0-9\-/]+\$\{[^}]+\})(?=[`#?])')

def fix_lit(m):
    prefix, p = m.group(1), m.group(2)
    return prefix + p + ('/' if not p.endswith('/') else '')
def fix_tpl(m):
    return m.group(0) + '/'

for root, dirs, files in os.walk('src'):
    for f in files:
        if not f.endswith(('.astro', '.ts', '.tsx', '.js', '.mjs')): continue
        p = os.path.join(root, f)
        s = open(p, encoding='utf-8').read()
        s2 = RE_TPL.sub(fix_tpl, RE_LIT.sub(fix_lit, s))
        if s != s2:
            open(p, 'w', encoding='utf-8', newline='').write(s2)
```

The two regex patterns:
- **Literal** `href="/foo"` / `href: "/foo"` — leading `/` not followed by another `/` (skips `//cdn.com`), starts with letter/digit (skips bare `/`), no dots in path (skips `/foo.css`), lookahead for closing quote / `#` / `?`.
- **Template** `` `/path/${var}` `` — finds `/path/${var}` followed by closing backtick / `#` / `?`, adds `/` before the closing punctuation.

After running both, also manually inspect: `slug:` fields in content data (the codemod doesn't catch these because they're not `href`); breadcrumb URL strings; any other URL-shaped string used in JSON-LD construction.

### What NOT to update

- **Map / record keys** like `pillarPages["/mcp"]` — these are internal lookup identifiers, not URLs. Updating breaks the lookup.
- **Domain constants** — `DOMAIN` ends without slash by convention; don't add one.
- **External URLs** — `https://example.com/foo` shouldn't be touched.
- **Anchor-only hrefs** (`href="#section"`) — page-internal, no path component.
- **`mailto:` / `tel:` / `javascript:`** — different URI schemes.

A proper regex with the patterns above already excludes all of these.

## Search Console schema validation errors

Google Search Console flags structured-data errors per page after crawl. The most common error in practice is **"Either offers, review, or aggregateRating should be specified"** on a Product node. The trap: this error fires even when the offending Product is a tiny nested reference inside `Article.mentions` / `hasPart` / `about` — not necessarily the main Product schema you wrote.

**Quick diagnosis**: grep the dist HTML for `"@type":"Product"` and count by page. Any Product node that doesn't carry `name + image + description + offers/review/aggregateRating` is invalid.

**The standard mistake**: writing `mentions: [{"@type": "Product", "name": "Competitor"}, ...]` to attribute a comparison/review article to the vendors it discusses. Google validates every Product independently — minimal `{name}` Products fail with the missing-offers error. Fix by changing the type to `Organization` (preferred for known vendors — KG-linked, no required fields beyond name) or `Thing` (most generic). `Article.mentions` accepts any `Thing` so you have free choice.

```ts
// WRONG — Product requires offers/image/description even when nested
mentions: [content.a, content.b].map((name) => ({ "@type": "Product", name }))

// RIGHT — Organization only requires name; still links to Knowledge Graph
mentions: [content.a, content.b].map((name) => ({ "@type": "Organization", name }))
```

For the broader rules on which schema types have which required fields, and how `@id` references avoid double-validation of shared entities, see the **`seo-ld-json` skill** — that's the canonical reference for schema construction and Google's validation rules.

## What you can't fix from code

Acknowledge these without trying. Wasting cycles here loses CTO credibility:

| Audit finding | Why you can't fix it from code |
|---|---|
| "Forced reflow [unattributed] N ms" | Almost always Cloudflare Web Analytics' beacon.min.js querying layout. Disable Cloudflare Insights to remove (loses real-user perf data — usually not worth it). |
| Cloudflare beacon cache TTL too short | Cloudflare sets it; you don't control headers on `static.cloudflareinsights.com`. |
| Google Fonts cache TTL too short | Google sets it. **Self-host** to take control (see above). |
| `Maximum critical path latency: 200-300 ms` after fonts/CSS optimized | Diminishing returns. Below ~300 ms is healthy for SSG content. Beyond requires inlining critical CSS and serving HTML from edge — major work. |

## Decision tree

When you receive an audit dump, work in this order:

1. **Filter** — drop false positives (verify against actual rendered HTML), drop third-party / out-of-scope items, drop already-passing items printed as tables.
2. **Group remaining findings** by category: content / hierarchy / a11y / perf.
3. **Fix high-ROI items first**:
   - Thin content → FAQ + FAQPage schema (compounds: word count, H3, rich result, schema)
   - Image alt → batch-fix all in one pass per file
   - Color contrast → define `*-bright` variant once, migrate uses
4. **Fix perf items**:
   - Self-host fonts (eliminates 4+ findings simultaneously)
   - Inline CSS (eliminates render-blocking CSS)
   - Preload LCP fonts
5. **Verify**: run `astro check` / typecheck, run `build`, grep `dist/` to confirm the audit-flagged class / attribute / URL is no longer present.
6. **Tell the user to purge the CDN** before re-running the audit. Cached HTML is the #1 reason re-audits show "the same problem".

## After-fix verification ritual

For each batch of fixes:

```bash
npm run check   # or astro check / tsc — whichever the project uses
npm run build
# Verify the actual fix landed in dist/
grep -c "<class-or-attribute-the-audit-flagged>" dist/index.html
```

For SEO/structured data fixes, also verify the JSON-LD parses:

```bash
grep -o "FAQPage\|Article\|Product\|@graph" dist/index.html | sort | uniq -c
```

If a re-audit still shows the old finding after a fresh deploy, the problem is **CDN cache**, not your code. Purge the relevant URL in Cloudflare / Vercel / Netlify before declaring a fix broken.

## What this skill is NOT

- Not a guide for writing JSON-LD from scratch — see the `seo-ld-json` skill for schema construction details (`Product`, `Organization`, `BreadcrumbList`, `@id` references, etc.).
- Not a Lighthouse score chase — past ~90, the marginal cost of each point grows and many remaining findings are out-of-code (CDN config, third-party scripts).
- Not a substitute for actual content quality. SEO patterns can amplify good content but can't rescue thin or low-trust content from low rankings.
