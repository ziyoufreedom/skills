---
name: local-biz-website
description: |
  Full-stack SEO website production workflow for local service businesses (spa, massage, salon, clinic, etc.).
  Triggers when user mentions: building a website for a client, spa/salon website, local business SEO site,
  "run the website workflow", "new client website", or any mention of the 8-phase SOP for local business sites.
  Covers all 4 automation phases: SEO Blueprint → Page Content Generation → Technical SEO Pack → Launch Checklist.
  Always use this skill when JJ mentions a new client, a spa/massage business website, or wants to run any phase of the local business website pipeline.
---

# Local Business SEO Website Skill

This skill automates the full website production pipeline for local service businesses.
Each phase produces a structured JSON output that feeds into the next phase.

## Core Concept: The Project Package

All data lives in a single JSON object called the **Project Package** (`project.json`).
Each phase reads from it and writes back to it. At the end, it contains everything needed to build and deploy.

```
project.json schema:
{
  "business": { ...Step 1 intake data },
  "seo": { ...Step 2-4 blueprint + page list },
  "content": { ...Step 5-6 generated page content },
  "technical": { ...Step 7 generated files },
  "status": { ...Step 8 checklist }
}
```

---

## Phase Overview

| Phase | What Claude Does | Output |
|-------|-----------------|--------|
| **INTAKE** | Interactive intake form / parse provided info | `project.json` with business data |
| **SEO BLUEPRINT** | Generate full keyword map + 15-25 page URLs + site structure | SEO section of project.json |
| **CONTENT GEN** | Write all page content (H1/H2/body/FAQ/schema) | Content section of project.json + individual .html/.md files |
| **TECH PACK** | Generate sitemap.xml, robots.txt, schema.json, OG tags template | /technical/ output folder |
| **LAUNCH** | Full pre-launch checklist, GSC submission guide | checklist.md |

---

## PHASE 1 — INTAKE

### Trigger phrases
"new client", "start a website", "收集客户信息", "Phase 1"

### Process
1. If user provides business info as text/form → parse it directly into project.json
2. If nothing provided → present the intake checklist below and ask user to fill it in
3. Validate all required fields before proceeding

### Required Fields
```
business_name, address, phone, email, hours, services[], price_range,
service_area (primary city + nearby neighborhoods), booking_link,
target_customer, competitors[], google_business_url
```

### Output
Save as `project.json` with structure:
```json
{
  "business": {
    "name": "...",
    "address": "...",
    "phone": "...",
    "email": "...",
    "hours": {},
    "services": [],
    "price_range": "...",
    "service_area": { "primary": "...", "neighborhoods": [], "nearby_cities": [] },
    "booking_link": "...",
    "target_customer": "...",
    "competitors": [],
    "google_business_url": "..."
  }
}
```

---

## PHASE 2 — SEO BLUEPRINT

### Trigger phrases
"SEO blueprint", "keyword map", "page structure", "Phase 2", or automatically after Phase 1

### Process
Read `project.json` business data. Then:

1. **Generate Primary Keyword** → `{service_type} + {primary_city}`
2. **Generate Service Keywords** → for each service in services[]: `{service} + {city}`
3. **Generate Location Keywords** → for each neighborhood: `{service_type} + {neighborhood}`
4. **Generate Authority Keywords** → `best/top-rated {service_type} {city}`
5. **Generate 15-25 page slugs** using the URL patterns below
6. **Build internal link tree** (Home → Services → Locations → Guides → Contact)

### URL Naming Convention
```
Service pages:    /services/{service-slug}-{city}
Location pages:   /locations/{service-type}-{neighborhood-or-city}
Authority pages:  /guides/{topic-slug}
Core pages:       /about, /contact, /faq
```

### Page Count Targets
- Core pages: 5 (Home, About, Services hub, Contact, FAQ)
- Service pages: 1 per service (aim for 6-10)
- Location pages: 1 per neighborhood + 1 "near me" + 1 primary city
- Authority/guide pages: 3-5 evergreen topics

### SEO Blueprint Template per Page
For each page, generate:
```json
{
  "slug": "/services/deep-tissue-massage-knoxville",
  "title": "Deep Tissue Massage in Knoxville | {Business Name}",
  "meta_description": "...(150-160 chars, includes primary keyword + CTA)...",
  "h1": "Deep Tissue Massage in Knoxville",
  "target_keyword": "deep tissue massage knoxville",
  "secondary_keywords": [],
  "internal_links_to": [],
  "page_type": "service|location|authority|core"
}
```

### Output
Write seo section into project.json. Also output a readable markdown summary for user review.
See `references/seo-blueprint-example.md` for a complete worked example.

---

## PHASE 3 — CONTENT GENERATION

### Trigger phrases
"generate content", "write pages", "批量生成页面", "Phase 3"

### Process
For each page in `project.json.seo.pages[]`:

1. Read the page blueprint (title, H1, target keyword, page_type)
2. Generate full page content using the template below
3. Save each page as an individual file: `content/{slug}.md`
4. After all pages done, write summary index

### Page Content Template

```markdown
# {H1}

## Introduction (80-120 words)
Local-focused opening paragraph. Mention business name, city, and primary service.
Naturally include target keyword in first 100 words.

## {Service/Topic Section 1} (150-200 words)
H2 with secondary keyword variation. 2-3 paragraphs covering benefits, process, or details.

## {Service/Topic Section 2} (150-200 words)
Another H2. More depth, social proof angle, or local specifics.

## Why Choose {Business Name}? (100-150 words)
Trust signals: years in business, certifications, reviews, unique differentiators.

## FAQ (5 questions minimum)
**Q: {keyword-rich question}?**
A: {concise answer, 2-3 sentences}

## Book Your Appointment
CTA section. Booking link. Phone number. Address.

---
Internal links: {list 3-4 related pages}
Schema type: {LocalBusiness|Service|FAQPage}
```

### Batch Execution Note
Generate pages in this priority order:
1. Home page (most important, do this first)
2. Core service pages
3. Location pages
4. Authority/guide pages
5. FAQ and Contact

---

## PHASE 4 — TECHNICAL SEO PACK

### Trigger phrases
"technical SEO", "generate sitemap", "tech pack", "Phase 4"

### Process
Read all pages from project.json. Generate these files:

#### sitemap.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- One <url> entry per page, with lastmod, changefreq, priority -->
  <!-- Home: priority 1.0, weekly -->
  <!-- Service pages: priority 0.8, monthly -->
  <!-- Location pages: priority 0.7, monthly -->
  <!-- Guide pages: priority 0.6, monthly -->
</urlset>
```

#### robots.txt
```
User-agent: *
Allow: /
Sitemap: https://{domain}/sitemap.xml
Disallow: /admin/
Disallow: /wp-admin/
```

#### schema-local-business.json
Generate LocalBusiness schema with:
- `@type`: Spa / MassageTherapist / HealthAndBeautyBusiness (pick most specific)
- name, address, phone, url, openingHours, priceRange, geo, sameAs (Google Business URL)

#### og-tags-template.html
Open Graph + Twitter Card meta tags template for copy-paste into `<head>`.

#### google-analytics-snippet.html
GA4 + GTM placeholder with instructions.

---

## PHASE 5 — LAUNCH CHECKLIST

### Trigger phrases
"launch checklist", "pre-launch", "ready to go live", "Phase 5"

### Output: `checklist.md`

Pre-launch technical:
- [ ] All pages have unique title + meta description
- [ ] sitemap.xml submitted to Google Search Console
- [ ] robots.txt accessible at /robots.txt
- [ ] Canonical tags on all pages
- [ ] Schema markup validated (schema.org validator)
- [ ] No broken internal links
- [ ] All images have alt text
- [ ] Mobile responsive check
- [ ] Page speed test (target >80 on PageSpeed Insights)
- [ ] SSL certificate active (https://)

Google ecosystem setup:
- [ ] Google Analytics property created + GA4 tag firing
- [ ] Google Tag Manager container published
- [ ] Google Search Console verified
- [ ] Sitemap submitted in GSC
- [ ] Request indexing on Home + top 5 pages

Post-launch (ongoing):
- [ ] Google Business Profile updated with website URL
- [ ] NAP (Name/Address/Phone) consistent across all citations
- [ ] Request first 5 reviews from existing customers
- [ ] Set up monthly GSC performance review

---

## Running the Full Pipeline

When user says "run full pipeline" or "做完整网站":
1. Start Phase 1 (intake)
2. Automatically continue Phase 2 when intake confirmed
3. Ask user: "SEO Blueprint ready. Approve to continue to content generation?"
4. Generate content in batches of 5 pages, show progress
5. Generate tech pack
6. Present launch checklist

## File Output Structure
```
/outputs/
├── project.json          ← master data file
├── seo-blueprint.md      ← human-readable SEO plan
├── content/
│   ├── home.md
│   ├── services/
│   ├── locations/
│   └── guides/
├── technical/
│   ├── sitemap.xml
│   ├── robots.txt
│   ├── schema-local-business.json
│   └── og-tags-template.html
└── checklist.md
```

---

## ⚠️ CRITICAL: React SPA SEO Architecture (Read Before Writing Any Code)

This section is mandatory if the project uses React (Vite + React Router). Skipping it causes SEO to silently fail.

### The Problem
React SPA 默认只有一个 `index.html`。如果用 `useEffect` 或 `document.title` 注入 SEO 标签：
- `view-source:` 只会看到首页 HTML
- 不执行 JS 的爬虫、社交预览、SEO 审计工具全部看不到正确的 title/description/schema
- Google 虽然能渲染 JS，但不保证每次执行，有延迟索引风险

### The Fix: Build-Time Prerender
构建时为每个路由生成独立 HTML 文件，把正确的 `<head>` 内容直接写进静态 HTML。

### Architecture Rules (enforce from Day 1)

**1. SEO 数据必须是纯数据**
```ts
// ✅ CORRECT — pure functions, importable by Node.js build script
// src/lib/seo.ts
export function getServicePageSEO(service: string, city: string) {
  return {
    title: `${service} in ${city} | Business Name`,
    description: `Professional ${service} in ${city}...`,
    jsonLd: buildServiceSchema(service, city),
  }
}

// ❌ WRONG — tied to browser/React
useEffect(() => { document.title = "..." }, [])
```

**2. Centralized route-to-SEO config**
```ts
// src/lib/seo-config.ts — one source of truth
export const routeSEO = {
  "/": { title: "...", description: "...", schema: "Spa" },
  "/services/deep-tissue-massage-knoxville": { ... },
  "/about": { ... },
  // all routes listed here
}
```

**3. Build pipeline**
```json
// package.json
{
  "scripts": {
    "build": "vite build && node scripts/prerender.mjs"
  }
}
```

**4. Prerender script template**
```js
// scripts/prerender.mjs
import fs from 'fs'
import path from 'path'
import { routeSEO } from '../src/lib/seo-config.ts' // via vite.ssrLoadModule or direct import

const template = fs.readFileSync('dist/index.html', 'utf-8')

for (const [route, seo] of Object.entries(routeSEO)) {
  const dir = path.join('dist', route)
  fs.mkdirSync(dir, { recursive: true })

  let html = template
    .replace(/<title>.*?<\/title>/, `<title>${seo.title}</title>`)
    .replace(/name="description" content=".*?"/, `name="description" content="${seo.description}"`)
    .replace('</head>', `<script type="application/ld+json">${JSON.stringify(seo.jsonLd)}</script>\n</head>`)

  fs.writeFileSync(path.join(dir, 'index.html'), html)
}
```

**5. Verification after every build**
```bash
# Must return page-specific title, NOT homepage title
grep '<title>' dist/services/deep-tissue-massage-knoxville/index.html

# Must show route-specific schema
grep 'ld+json' dist/about/index.html
```

### What This Changes in the Workflow
- **Phase 3 (Content Gen)**: When writing page components, NEVER put SEO in useEffect. Always export SEO data as a plain object alongside the component.
- **Phase 4 (Tech Pack)**: `technical/` output folder now includes `scripts/prerender.mjs` and `src/lib/seo-config.ts` template.
- **Phase 5 (Launch Checklist)**: Add prerender verification step before GSC submission.

---

## Important Notes

- **City name**: Always use the actual city/neighborhood in URLs and content — never "your city"
- **Services**: Generate content only for services explicitly listed by the client
- **Tone**: Professional but approachable. Not overly clinical. Local and warm.
- **Keyword density**: Target keyword appears naturally 3-5x per page. No stuffing.
- **Word count targets**: Home 600-800w, Service pages 500-700w, Location pages 400-600w, Guide pages 700-1000w

For detailed examples and templates, see:
- `references/seo-blueprint-example.md` — Full worked example for a spa
- `references/page-content-examples.md` — Sample content for each page type
- `references/schema-examples.json` — Schema markup templates
