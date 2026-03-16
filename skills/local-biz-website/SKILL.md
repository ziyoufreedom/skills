---
name: local-biz-website
description: |
  Full-stack SEO website production workflow for local service businesses (spa, massage, salon, clinic, etc.).
  Triggers when user mentions: building a website for a client, spa/salon website, local business SEO site,
  "run the website workflow", "new client website", or any mention of the 5-phase pipeline for local business sites.
  Covers all 5 phases: Intake → SEO Blueprint → Content & Code Generation → Technical SEO Pack → Launch Checklist.
  Always use this skill when the user mentions a new client, a spa/massage/salon business website, or wants to run any phase of the local business website pipeline.
---

# Local Business SEO Website Skill

This skill automates the full website production pipeline for local service businesses.
Each phase produces structured output that feeds into the next phase. The central data file is `project.json`.

## Phase Overview

| Phase | What Claude Does | Output |
|-------|-----------------|--------|
| **1 INTAKE** | Parse provided info + web-verify + competitor research | `project.json` with business data |
| **2 SEO BLUEPRINT** | Keyword map + 15-25 page slugs + site structure | SEO section of project.json + `seo-blueprint.md` |
| **3 CONTENT & CODE** | React components + page content + routing | `src/pages/`, `src/components/`, `src/lib/` |
| **4 TECH PACK** | Prerender script, sitemap, robots.txt, JSON-LD, OG tags | `scripts/prerender.mjs` + build output |
| **5 LAUNCH** | Pre-launch checklist + post-deploy guide | `checklist.md` |

---

## PHASE 1 — INTAKE

### Process
1. If user provides business info → parse into project.json
2. **Web-verify**: Search the business online (MassageBook, Yelp, Google Business, official site) to cross-reference and fill gaps. Only use verified data on the website.
3. If user provides multiple data sources, flag discrepancies and resolve with user
4. **Proactively research competitors** in the area — don't just ask the user for a list
5. Ask user about **content restrictions** (e.g., "don't show prices") before Phase 3

### Required Fields
```
business_name, address, phone, email, hours, services[],
service_area (primary city + neighborhoods + nearby_cities),
booking_link, target_customer, competitors[],
google_business_url, social_media {facebook, instagram, ...}
```

### Optional Fields (gather if available)
```
add_on_services[], content_restrictions[], ratings {},
reviews_highlights[], payment_methods[], established_year,
owner_name, certifications[]
```

### Output: `project.json`
```json
{
  "business": {
    "name": "...", "address": "...", "phone": "...", "email": "...",
    "hours": {}, "services": [], "add_ons": [],
    "service_area": { "primary": "...", "neighborhoods": [], "nearby_cities": [] },
    "booking_link": "...", "google_business_url": "...",
    "social_media": {}, "ratings": {}, "reviews_highlights": [],
    "content_restrictions": [],
    "competitors": [], "target_customer": "..."
  }
}
```

---

## PHASE 2 — SEO BLUEPRINT

### Process
1. **Primary Keyword** → `{service_type} + {primary_city}`
2. **Service Keywords** → for each service: `{service} + {city}`
3. **Location Keywords** → for each nearby_city: `{service_type} + {city}`
4. **Authority Keywords** → `best/top-rated {service_type} {city}` + evergreen topics
5. **Generate 15-25 page slugs** using URL patterns below
6. **Build internal link tree** with cross-linking strategy

### URL Patterns
```
Service pages:    /services/{service-slug}-{city}
Location pages:   /locations/{service-type}-{neighborhood-or-city}
Authority pages:  /guides/{topic-slug}
Core pages:       /about, /contact, /faq
```

### Page Count Targets
- Core: 5 (Home, About, Services hub, Contact, FAQ)
- Service: 1 per main service (6-10)
- Location: 1 per nearby city + 1 "near me" (4-6)
- Authority/guide: 3-5 evergreen topics

### Location Pages — include driving distance/time from each city to the business

### Per-Page Blueprint
```json
{
  "slug": "/services/deep-tissue-massage-newberg",
  "title": "Deep Tissue Massage in Newberg, OR | {Business Name}",
  "meta_description": "...(150-160 chars, keyword + CTA)...",
  "h1": "Deep Tissue Massage in Newberg",
  "target_keyword": "deep tissue massage newberg",
  "secondary_keywords": [],
  "internal_links_to": [],
  "page_type": "service|location|authority|core"
}
```

### Output
Write SEO section into project.json. Also output `seo-blueprint.md` for user review.
See `references/seo-blueprint-example.md` for a worked example.

---

## PHASE 3 — CONTENT & CODE GENERATION

This is the biggest phase. It produces all React components and page content.

### Architecture: Reusable Component System
Build these shared components first — they're used across all pages:

| Component | Purpose |
|-----------|---------|
| `Layout.tsx` | Wraps Navbar + Footer around all pages, handles scroll-to-top |
| `PageHero.tsx` | Inner page hero banner (tag, h1 title, subtitle) |
| `FAQSection.tsx` | Accordion FAQ component, reused on every page |
| `BookingCTA.tsx` | Call-to-action section with phone + booking link |

### Data-Driven Content
Create `src/lib/page-content.ts` — a centralized file exporting all page text content as TypeScript objects. This separates content from components, making updates easier.

### Code Splitting
Use `React.lazy()` + `Suspense` for all pages except Home. This keeps the initial bundle small:
```tsx
const SwedishMassage = lazy(() => import("./pages/services/SwedishMassage"));
```

### Parallelization Strategy
Phase 3 involves many files. Maximize speed by launching parallel agents:
- Agent 1: `seo-config.ts` (SEO metadata + JSON-LD schemas)
- Agent 2: `page-content.ts` (all page text content)
- Agent 3: Service page components (7+ files)
- Agent 4: Location + Guide page components (9+ files)
- Agent 5: Core pages (ServicesHub, About, Contact, FAQ) + App.tsx routing

### ⚠️ Slug Consistency Rule
Every agent prompt MUST include the complete slug list from `project.json.seo.pages[]`.
Internal links between pages are the #1 source of bugs — agents that don't see the exact
slugs will guess shorter paths (e.g., `/services/swedish-massage` instead of
`/services/swedish-massage-newberg`) and produce broken links across the entire site.

When writing agent prompts, always include a block like:
```
VALID SLUGS (use these EXACT paths for all internal links):
/services/swedish-massage-newberg
/services/deep-tissue-massage-newberg
...full list from project.json...
```

After all agents complete, grep for orphan links that don't match any registered route:
```bash
grep -roh 'to="[^"]*"' src/pages/ | sort -u  # compare against App.tsx routes
```

### Content Rules
- Respect `content_restrictions` from project.json (e.g., if "no_prices" → never show dollar amounts)
- Target keyword appears naturally 3-5x per page, no stuffing
- Tone: professional but warm, local and approachable
- Word count: Home 600-800w, Service 500-700w, Location 400-600w, Guide 700-1000w
- Always use actual city/neighborhood names — never "your city"
- Every page ends with a booking CTA

### Page Component Template
Each service/location/guide page follows this structure:
```
<PageHero tag="..." title="..." subtitle="..." />
<ContentSection> (intro + image, side by side)
<BenefitsSection> (bg-secondary, card grid)
<WhyChooseUs> (trust signals)
<FAQSection faqs={[...]} />
<RelatedServices> (links to 2-3 related pages)
<BookingCTA />
```

### Update Existing Components
Update the template project's existing Navbar, Footer, Hero, Services, About, Testimonials, and BookingCTA with real business data. Replace all placeholder text (business name, phone, address, hours, reviews).

### Routing: App.tsx
Register all routes in App.tsx with Layout wrapper:
```tsx
<Layout>
  <Suspense fallback={<Spinner />}>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/services" element={<ServicesHub />} />
      {/* ...all 21+ routes... */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
</Layout>
```

### Build Verification
Run `npm run build` after all files are created. Fix any TypeScript/import errors before proceeding.

---

## PHASE 4 — TECHNICAL SEO PACK

### The Prerender Script
The prerender script (`scripts/prerender.mjs`) is the core of the SEO pipeline. It runs after `vite build` and does three things in one pass:

1. **Prerenders every route** — generates `dist/{route}/index.html` with page-specific `<title>`, `<meta description>`, `<link canonical>`, OG tags, and JSON-LD
2. **Generates `sitemap.xml`** — with priority tiers (Home 1.0 > Core 0.9 > Service 0.8 > Location 0.7 > Guide 0.6)
3. **Generates `robots.txt`** — with sitemap reference

The script must be **self-contained plain JavaScript** — it runs in Node.js outside the Vite/TS pipeline, so it cannot import `.ts` files. SEO data is duplicated in the script from `seo-config.ts`. This is intentional and unavoidable.

See `references/prerender-script.mjs` for the reference implementation.

### Build Pipeline
```json
{
  "scripts": {
    "build": "vite build && node scripts/prerender.mjs"
  }
}
```

### Domain Configuration
The prerender script should read domain from `process.env.SITE_DOMAIN` with a sensible default:
```js
const DOMAIN = process.env.SITE_DOMAIN || "https://www.example.com";
```

### Verification Checklist (run after every build)
```bash
# Must show page-specific title, NOT homepage title
grep '<title>' dist/services/deep-tissue-massage-newberg/index.html

# Must show JSON-LD schema
grep 'ld+json' dist/about/index.html

# Must show canonical URL
grep 'canonical' dist/guides/best-massage-newberg-oregon/index.html

# Count total prerendered files
find dist -name "index.html" | wc -l  # Should match page count
```

---

## PHASE 5 — LAUNCH CHECKLIST

### Output: `checklist.md`

**Pre-launch technical:**
- [ ] All pages have unique title + meta description
- [ ] sitemap.xml generated with correct URLs
- [ ] robots.txt accessible
- [ ] Canonical tags on all pages
- [ ] JSON-LD schema validated (schema.org validator)
- [ ] OG tags on all pages
- [ ] No broken internal links
- [ ] All images have alt text
- [ ] Mobile responsive check
- [ ] Page speed test (target >80 PageSpeed Insights)
- [ ] SSL certificate active
- [ ] Code splitting verified (lazy-loaded chunks)
- [ ] Prerender verification passed (grep tests)

**Domain & Hosting:**
- [ ] Domain registered / DNS configured
- [ ] Hosting deployed
- [ ] SITE_DOMAIN env var configured
- [ ] SPA fallback 404 configured

**Google Ecosystem:**
- [ ] Google Analytics 4 + GA4 tag
- [ ] Google Search Console verified
- [ ] Sitemap submitted in GSC
- [ ] Request indexing on Home + top 5 pages

**External Profiles:**
- [ ] Google Business Profile — website URL updated, NAP consistent
- [ ] Booking platform — links back to new website
- [ ] Social media (Facebook, Instagram) — bio updated with new URL

**Post-launch (ongoing monthly):**
- [ ] GSC performance review
- [ ] Core Web Vitals monitoring
- [ ] Customer review requests
- [ ] Content refresh for guides (every 6 months)

---

## Running the Full Pipeline

When user says "run full pipeline" or "做完整网站":
1. Phase 1 — parse info + web-verify + competitor search
2. Phase 2 — present SEO blueprint for user approval
3. Phase 3 — generate all code (parallel agents), build-verify
4. Phase 4 — generate prerender script, verify build output
5. Phase 5 — present launch checklist

---

## ⚠️ CRITICAL: React SPA SEO Architecture

This section is mandatory for React (Vite + React Router) projects. Skipping it causes SEO to silently fail.

### The Problem
A React SPA has a single `index.html`. If SEO tags are set via `useEffect` or `document.title`:
- `view-source:` shows only the homepage HTML
- Crawlers that don't execute JS see wrong metadata
- Google renders JS but doesn't guarantee it, risking delayed indexing

### The Fix: Build-Time Prerender
Generate a static HTML file per route at build time with correct `<head>` content baked in.

### Rules
1. **SEO data = pure data** — never use `useEffect` for titles/descriptions. Export SEO as plain objects in `src/lib/seo-config.ts`
2. **Centralized route-to-SEO config** — one `routeSEO` map for all pages
3. **Self-contained prerender script** — plain `.mjs`, no TypeScript imports. Duplicates SEO data from seo-config.ts for Node.js compatibility.
4. **Build pipeline** — `vite build && node scripts/prerender.mjs`
5. **Verify after every build** — grep for page-specific titles in dist/

---

## Important Notes

- **City names**: Always use actual city names in URLs and content — never "your city"
- **Services**: Only generate pages for services the client actually offers
- **Content restrictions**: Respect any restrictions from project.json (e.g., no prices)
- **Driving distances**: Location pages should mention approximate drive time from target city
- **Insurance angle**: If the business accepts insurance, this is a major differentiator — dedicate pages to it
- **Reviews**: Use real customer reviews where available, with attribution

For detailed examples and templates, see:
- `references/seo-blueprint-example.md` — Full worked example
- `references/prerender-script.mjs` — Prerender script reference
- `references/seo-config-template.mjs` — SEO config template
- `references/schema-examples.json` — Schema markup templates
