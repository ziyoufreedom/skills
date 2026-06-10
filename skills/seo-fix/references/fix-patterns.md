# Fix Patterns Reference

Concrete templates for the self-owned fixes that `seo-fix` applies directly.

## Astro-specific patterns

### Self-canonical in SiteLayout

```astro
---
// src/layouts/SiteLayout.astro
const canonical = new URL(Astro.url.pathname, Astro.site).toString();
---
<link rel="canonical" href={canonical} />
```

Requires `site:` in `astro.config.mjs`:
```js
export default defineConfig({
  site: 'https://www.example.com',
  build: { format: 'directory' },
});
```

### Bilingual hreflang triple

```astro
---
const altLang = lang === 'en' ? 'zh' : 'en';
const altPath = lang === 'en'
  ? (pathname === '/' ? '/zh' : `/zh${pathname}`)
  : (pathname === '/zh' ? '/' : pathname.replace(/^\/zh/, ''));
const otherHref = new URL(altPath, Astro.site).toString();
---
<link rel="alternate" hreflang={lang === 'en' ? 'en' : 'zh-Hans'} href={canonical} />
<link rel="alternate" hreflang={altLang === 'en' ? 'en' : 'zh-Hans'} href={otherHref} />
<link rel="alternate" hreflang="x-default" href={lang === 'en' ? canonical : otherHref} />
```

### Astro redirects (server-side, dev + prod)

```js
// astro.config.mjs
export default defineConfig({
  redirects: {
    '/old-path': '/new-path',
    '/seo': '/manhattan/wellness-guide',
  },
});
```

For Cloudflare Pages real 301 (faster than meta-refresh), also write `public/_redirects`:
```
/old-path  /new-path  301
```

## Sitemap with hreflang (post-build script)

```js
// scripts/generate-sitemap.mjs
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const DOMAIN = (process.env.SITE_DOMAIN || 'https://www.example.com').replace(/\/$/, '');

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== '_astro') out.push(...walk(full));
    else if (e.isFile() && e.name === 'index.html') out.push(full);
  }
  return out;
}

const routes = walk(DIST).map(f =>
  '/' + path.relative(DIST, f).replace(/\\/g, '/').replace(/\/?index\.html$/, '')
).filter(r => !r.includes('/404')).sort();

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${routes.map(r => {
  const loc = `${DOMAIN}${r === '' ? '/' : r + '/'}`;
  // ... hreflang alternates per route ...
  return `  <url>
    <loc>${loc}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
}).join('\n')}
</urlset>`;

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), xml);
console.log(`Wrote sitemap.xml (${routes.length} URLs)`);
```

Wire to build:
```json
{
  "scripts": {
    "build": "astro build && node scripts/generate-sitemap.mjs"
  }
}
```

## llms.txt template

```markdown
# {Business Name}

> {One-sentence elevator pitch covering what + where + who}

{2–3 sentences: location, key practitioners/founders, brand essence.}

## Pages

- [Home](/): Brand overview + booking.
- [About](/about): Practice philosophy.
- [Services](/services): Full service menu.
- [Practitioners](/practitioners): Bios + credentials.
- [FAQ](/faq): Common questions.
- [Contact](/contact): NAP + booking.

## {Category} Pages

- [Service A](/category/service-a): One-sentence purpose.
- ...
```

Rules:
- Use relative URLs (portable across staging/prod)
- Order: most important first
- One-sentence summaries (not paragraphs)
- Keep under 200 lines total

## NAP source-of-truth pattern

`src/lib/content/business.ts`:
```ts
export const business = {
  name: 'Acme Co',
  address: {
    street: '123 Main St, Suite 1A',
    city: 'New York', region: 'NY', postalCode: '10019', country: 'US',
  },
  phone: '+1-212-555-0100',
  phoneDisplay: '(212) 555-0100',
  email: 'hello@acme.co',
  hours: { Monday: '09:00-19:00', /* ... */ Sunday: 'Closed' },
} as const;
```

Every render (footer, header, contact, schema) imports from this. **Never hardcode NAP in JSX.**

## Image fixes (alt + dims + WebP)

### Convert PNG to WebP (Python)
```python
from PIL import Image
import glob, os

for png in glob.glob('public/img/*.png'):
    im = Image.open(png).convert('RGBA')
    im.save(png.replace('.png', '.webp'), 'WEBP', quality=85, method=6)
```

### Add width/height + alt to img tags
```astro
{/* Read natural dims from the source file with PIL; pass into the template. */}
<img
  src="/img/hero.webp"
  alt="Descriptive alt — what's in the image AND why it's here"
  width={1200}
  height={630}
  loading="lazy"
  decoding="async"
/>
```

For above-fold images (hero, header logo): NO `loading="lazy"`.

## Thin content expansion checklist

Use these section types to bring a service page above 400 words without padding:

1. **Conditions treated** — name 5–10 specific conditions; never "various conditions"
2. **What to expect (3 steps)** — Intake (5 min) → Session (60 min) → Aftercare (5 min). Concrete time + activity.
3. **Benefits** — bullet list, name the mechanism not just outcome ("releases trigger points in scalenes" not "feels good")
4. **Why choose us** — verifiable trust signals (years in practice, credentials, approach)
5. **FAQ (3-5)** — actual patient questions; plain-language answers
6. **Related services** — 2–3 internal links to thematically-near pages

Each section averages 80–120 words. Six sections = 480–720 words.

## Adding hero CTAs to bio/info pages

For pages that lack a primary conversion path (e.g., /about, /faq, /practitioners), append before the closing layout:

```astro
<section class="bg-gradient-hero py-16 text-center">
  <div class="container mx-auto px-6 max-w-2xl">
    <h2 class="text-3xl font-serif mb-4">Ready to start?</h2>
    <p class="text-muted-foreground mb-8">Book a session or call us directly.</p>
    <div class="flex flex-wrap gap-4 justify-center">
      <a href="/contact" class="bg-terracotta text-white px-8 py-4 rounded-full font-medium">Book Now</a>
      <a href={`tel:${business.phone}`} class="border border-terracotta text-terracotta px-8 py-4 rounded-full font-medium">Call {business.phoneDisplay}</a>
    </div>
  </div>
</section>
```

## When NOT to fix (anti-patterns)

- **Don't pad content with filler** — readability tanks; better to leave the page short and own it
- **Don't add FAQ schema where there's no FAQ in the visible page** — Google requires the content to match
- **Don't auto-translate without review** — bad ZH translations hurt brand more than missing them
- **Don't rewrite working titles for "keyword optimization"** — if the page is already ranking, leave the title alone
- **Don't add `noindex` to "fix" duplicate content** — fix the duplication or add canonical instead
