---
name: seo-guide-page
description: |
  Build an "SEO Strategy Showcase" page (`/seo-guide`) for a local business website. This is a single-page,
  10-section landing that turns the SEO work you've done for a client into a visible, sellable artifact:
  market overview, competitor cards, target-keyword grid, 4-tier strategy pyramid, long-tail page directory
  with Active/Planned badges, internal-link diagram, Google Map ranking factors, and a wintrabiz.com upsell CTA.

  Triggers: "build an SEO guide page", "add /seo-guide", "create SEO showcase", "SEO strategy page",
  "客户展示SEO工作", "SEO案例展示", "竞争对手展示页", or any request to turn a competitive SEO audit /
  keyword blueprint into a client-facing visual page.

  This skill is the self-contained spec — you can drop it into any React + Vite + Tailwind project that
  already has a Layout/Navbar/Footer in place. It assumes the project follows the no-`useEffect`-for-SEO,
  build-time-prerender architecture from `local-biz-website`. If that infra isn't in place, set it up first.
---

# SEO Guide Page Skill

A `/seo-guide` page is a sales surface, not just a content page. Its job is:

1. **Prove the work** — show the client (or anyone landing on the page) that real competitive analysis, keyword research, and architectural planning went into the site.
2. **Map the strategy** — give a one-screen visual of *why* the site has the pages it has (pyramid + long-tail directory + link structure).
3. **Surface what's done vs. what's next** — the Active/Planned badges turn the page directory into an honest roadmap.
4. **Upsell** — section S9 is a CTA to wintrabiz.com. The whole page exists because clients who see it understand the value of organic SEO and tend to retain.

Reference implementation: `crystal-herndon/src/pages/SeoGuidePage.tsx` (Crystal Massage and Beauty Spa, Herndon VA).

---

## Page Anatomy — 10 Sections

| # | Section | Background | Purpose |
|---|---------|------------|---------|
| S1 | Hero | `bg-primary` (dark) | Title + 2 CTAs (Visit Site / Explore Services) |
| S2 | Market Overview | default | 3 competitor archetype cards |
| S3 | Local Competitors | `bg-muted` | Grid of 4–6 named competitor cards |
| S4 | SEO Opportunity | default | Grid of 6–8 target keywords |
| S5 | Strategy Pyramid | `bg-primary` (dark) | 4-tier visual: Brand → Geo+Service → Service Categories → Long-tail |
| S6 | Long-Tail SEO Pages | default | Numbered grid of all long-tail pages with Active/Planned badges |
| S7 | Internal Link Structure | `bg-muted` | Vertical flow: Home → Locations → Services → Long-tail |
| S8 | Google Map Ranking | default | 4 factor cards: Reviews / Local Keywords / Website SEO / NAP |
| S9 | Business Impact (UPSELL) | `bg-primary` (dark) | 4 outcome cards + tiffany-blue CTA to wintrabiz.com |
| S10 | Visit CTA | default | Address, phone, email, Book button + wintrabiz credit line |

The dark/light/muted alternation (S1 dark → S2 light → S3 muted → S4 light → S5 dark → S6 light → S7 muted → S8 light → S9 dark → S10 light) gives the page natural rhythm without needing imagery.

---

## Required Inputs (gather before writing)

You need this data — pull from the project's `project.json`, the SEO blueprint, or a competitive audit doc the user hands you:

```ts
business: { name, address, phone, email, bookingUrl }
city: string                    // e.g. "Herndon"
state: string                   // e.g. "VA"
businessType: string            // e.g. "Massage & Spa", "Rehab Clinic"
competitors: Competitor[]       // 4–6 entries
targetKeywords: string[]        // 6–8 short keywords
longTailPages: LongTailPage[]   // typically 25–35 entries
servicePills: string[]          // 6–10 service category names for pyramid tier 3
```

```ts
type Competitor = {
  name: string;
  type: string;        // "Independent Holistic Day Spa", "National Chain", etc.
  distance: string;    // "~1 mile", "~4 miles"
  strengths: string[]; // 3–4 bullet points
};

type LongTailPage = {
  keyword: string;     // display name, e.g. "Deep Tissue Massage Herndon"
  route?: string;      // "/services/deep-tissue-massage-herndon" — omit = Planned
  description: string; // one-sentence value prop
};
```

**Active vs. Planned** — `route` present = Active (clickable card, gold badge). `route` absent = Planned (dimmed card, muted badge). The mix communicates that the SEO program is ongoing, not finished.

---

## Component Skeleton

The page uses one local helper component, `Section`, with a scroll-triggered fade-in. Use whatever scroll-reveal mechanism the host project already has — `useScrollReveal` (Crystal-style), `useInView` from framer-motion, or plain Intersection Observer. **Do not introduce a new animation dep just for this page.**

```tsx
// Crystal-Herndon style — uses project's useScrollReveal hook
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [ref, isVisible] = useScrollReveal<HTMLElement>({ threshold: 0.1 });
  return (
    <section
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </section>
  );
}
```

Icons are all from `lucide-react`: `Search, MapPin, Star, TrendingUp, Globe, Target, BarChart3, Link2, Map, ChevronRight, ExternalLink, Building2, Heart, FileCheck, Phone, Mail, Stethoscope`. Pick the ones you actually use — don't import the full set.

---

## Section-by-Section Build Order

### S1 — Hero

```
bg-primary text-primary-foreground section-padding
└── max-w-4xl mx-auto text-center
    ├── subtitle-elegant         — "SEO Strategy & Local Guide"
    ├── h1 heading-display       — "{City} <em class='text-gold italic'>{BusinessType} Guide</em>"
    ├── text-body                — 2-3 sentence market summary
    └── 2 CTAs (flex)
        ├── Primary: bg-gold text-primary px-12 py-4 → "/" — "Visit {Business}"
        └── Secondary: border border-primary-foreground/30 → "/services" — "Explore Services"
```

CTA button class for both: `font-body text-xs uppercase tracking-[0.25em]`.

### S2 — Market Overview

3 cards of competitor archetypes. Pick 3 that fit the industry:
- **Spa**: National Chains / Medical Spas / Independent Studios
- **Rehab clinic**: Hospital Networks / Multi-location Practices / Solo Owner-Operated
- **Salon**: Franchise Salons / Luxury Boutiques / Home-based Stylists

Card layout: `bg-secondary border border-border p-8 text-center` with icon (`w-8 h-8 text-gold`), `font-display` title, `text-body text-sm` description.

### S3 — Local Competitors

`bg-muted`. Grid `md:grid-cols-2 gap-6`. Each card:
```
bg-background border border-border p-6
├── flex justify-between
│   ├── h3 font-display text-lg          — competitor name
│   └── span bg-gold/15 text-gold rounded-full text-xs px-3 py-1 — type badge
└── ul space-y-1.5
    └── li flex gap-2 text-sm text-muted-foreground
        ├── ChevronRight w-3.5 h-3.5 text-gold
        └── strength text
```

Use 4–6 real competitors with researched strengths — generic platitudes ("good service", "experienced staff") undermine the page's credibility.

### S4 — SEO Opportunity (Keyword Research)

This is the **money grid**. Eight short, high-intent commercial keywords — what a buyer types when they're 30 seconds from booking. These are NOT blog topics or guides (those go in S6's long-tail directory).

**Layout** — `sm:grid-cols-2 lg:grid-cols-4 gap-4`. Each card:
```
border border-border p-4 flex items-center gap-3 hover:border-gold/40
├── Search w-4 h-4 text-gold
└── span font-body text-sm — keyword (lowercase, no punctuation)
```

**Keyword formulas** — pick 6–8 from these patterns, weighted toward whatever the business actually competes on:

| Pattern | Example | When to use |
|---------|---------|-------------|
| `{service category} {city} {state}` | `massage spa herndon va` | Always — the #1 brand-level commercial term |
| `{specific service} {city}` | `deep tissue massage herndon` | For each top-revenue service |
| `{specific service} {city} {state}` | `facial spa herndon va` | When the city name alone is ambiguous (multiple states have a "Springfield") |
| `{niche/specialty} {city}` | `head scalp spa herndon` | For services that differentiate vs. competitors |
| `{audience-specific service} {city}` | `couples massage herndon`, `prenatal massage herndon va` | High-intent + lower competition |
| `{cultural/modality} {city}` | `thai massage herndon` | When the business has a real specialization |
| `best {service} {city} {state}` | `best massage herndon va` | The "comparison-shopper" query |

**Reference example — Crystal Massage and Beauty Spa, Herndon VA** (use this exact 8-keyword shape as the default; substitute services for other industries):

```ts
const targetKeywords = [
  "massage spa herndon va",          // brand-level
  "deep tissue massage herndon",     // top-revenue service
  "facial spa herndon va",           // second category
  "head scalp spa herndon",          // differentiator
  "couples massage herndon",         // audience
  "prenatal massage herndon va",     // audience + safety-conscious
  "thai massage herndon",            // modality
  "best massage herndon va",         // comparison shopper
];
```

**Rules**:
- All lowercase, no punctuation, no em-dashes — these are how people *type*, not how they speak.
- Mix `{city}` and `{city} {state}` variants (about 50/50). Both rank, and the variation looks like real research instead of one mechanically-applied pattern.
- Don't include long-tail or guide-style queries here — `benefits of deep tissue massage` belongs in S6, not S4.
- Don't include the business's own name — branded search is solved, this section is about non-branded demand.

### S5 — Strategy Pyramid (Content Architecture)

The signature visual. 4 narrowing tiers on a dark background — this single graphic is what most clients screenshot and forward. Each tier answers a different search intent and sits at a different point in the funnel.

**Tier logic — what each tier represents**:

| Tier | Width | Background | Represents | Search intent |
|------|-------|------------|-----------|---------------|
| 1 — Brand | `max-w-[200px]` | `bg-gold text-primary` | The business name | Branded — "Crystal Spa" |
| 2 — Geo + Category | `max-w-[320px]` | `bg-primary-foreground/10` | "{City} {State} {BusinessType}" | Head term — "Herndon VA Massage & Beauty Spa" |
| 3 — Service Categories | `max-w-[480px]` | `bg-primary-foreground/5` | 6–10 service pills | Mid-tail — "deep tissue", "facial", "thai" |
| 4 — Long-Tail Pages | `w-full` | `bg-primary-foreground/5` | All long-tail keyword pages, inline | Long-tail — every page in S6 |

The shape — narrow at top, wide at bottom — visually makes the argument: one brand, one positioning, a handful of service categories, *but a wide net of long-tail pages catching every variation*.

**Tier 3 — Service Pills**

6–10 short labels, ideally **one or two words each**. Use the project's actual service categories, not blog topics. Example from Crystal-Herndon:

```ts
const servicePills = [
  "Massage",
  "Facials",
  "Head Scalp Spa",
  "Acupuncture",
  "Lymphatic Drainage",
  "Hot Stone",
  "Prenatal",
  "Thai Combo",
];
```

Render each as a rounded pill: `text-xs border border-primary-foreground/20 rounded-full px-3 py-1`. No icons, no descriptions — they need to *fit a pyramid*, not explain themselves.

**Tier 4 — Long-Tail Pages (inline text)**

Take the full `longTailPages` array from S6 and render each `keyword` inline, separated by a middle dot `·`. Style: `text-[11px] text-primary-foreground/60`.

The inline-text style is intentional — it should look dense, like a sitemap exploded into a single paragraph. Crystal-Herndon has 34 entries, which fills 4–5 visual lines of small text. That density is the point: the client sees, at a glance, how *many* doors the SEO strategy is opening.

```jsx
<div className="flex flex-wrap justify-center gap-2">
  {longTailPages.map((p) => (
    <span key={p.keyword} className="text-[11px] text-primary-foreground/60">
      {p.keyword} &middot;
    </span>
  ))}
</div>
```

**Reference example — full pyramid for Crystal Massage and Beauty Spa**:

```
            ┌─────────────────┐
            │  Crystal Spa    │              ← Tier 1: brand
            └─────────────────┘
        ┌─────────────────────────┐
        │ Herndon VA Massage      │          ← Tier 2: geo + category
        │ & Beauty Spa            │
        └─────────────────────────┘
    ┌─────────────────────────────────┐
    │ Service Pages                   │      ← Tier 3: 8 service pills
    │ ( Massage )( Facials )          │
    │ ( Head Scalp Spa )( Acupuncture)│
    │ ( Lymphatic )( Hot Stone )      │
    │ ( Prenatal )( Thai Combo )      │
    └─────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Long-Tail SEO Pages                     │  ← Tier 4: full long-tail list
│ Herndon Massage & Spa Guide ·           │
│ Best Massage Spa Herndon ·              │
│ Benefits Deep Tissue Massage ·          │
│ Head Scalp Spa Treatment Guide ·        │
│ HSA FSA Massage Spa ·                   │
│ Deep Tissue Massage Herndon ·           │
│ Couples Massage Herndon ·               │
│ Swedish Massage Herndon ·               │
│ Prenatal Massage Herndon ·              │
│ Hot Stone Massage Herndon ·             │
│ Facial Spa Herndon ·                    │
│ Head Scalp Spa Herndon ·                │
│ Thai Massage Herndon ·                  │
│ Acupuncture Herndon VA ·                │
│ Lymphatic Drainage Massage Herndon ·    │
│ Post-Surgery Massage Herndon ·          │
│ Anti-Aging Facial Herndon VA ·          │
│ Hydrating Facial Herndon VA ·           │
│ Aromatherapy Massage Herndon ·          │
│ Sports Massage Herndon VA ·             │
│ Himalayan Salt Stone Massage Herndon ·  │
│ Lymphatic Drainage Massage Reston ·     │
│ Hydrating Facial Reston ·               │
│ Massage Spa Reston ·                    │
│ Massage Spa Sterling ·                  │
│ Massage Spa Ashburn ·                   │
│ Massage Spa Chantilly ·                 │
│ Massage Spa Near Me ·                   │
│ Massage Spa Great Falls ·               │
│ Massage Spa Fairfax VA ·                │
│ Massage Spa Vienna VA ·                 │
│ Massage Spa Tysons VA ·                 │
│ Massage Spa Centreville VA ·            │
│ Massage Spa Leesburg VA ·               │
└─────────────────────────────────────────┘
```

Notice how Tier 4 mixes 4 *types* of long-tail keywords — that mix is what makes the strategy look comprehensive:

| Long-tail type | Examples from above | Search intent |
|---------------|---------------------|---------------|
| **Guide / informational** | "Herndon Massage & Spa Guide", "Benefits Deep Tissue Massage", "HSA FSA Massage Spa" | Top-of-funnel research |
| **Service + city** | "Deep Tissue Massage Herndon", "Couples Massage Herndon", "Hot Stone Massage Herndon" | High-intent local |
| **Service + nearby city** | "Lymphatic Drainage Massage Reston", "Hydrating Facial Reston" | Geo-expansion |
| **City landing pages** | "Massage Spa Reston", "Massage Spa Sterling", "Massage Spa Near Me", "Massage Spa Tysons VA" | Map pack + nearby capture |

Aim for 25–35 entries total, with rough mix: **~15% guides, ~50% service+city, ~10% service+nearby-city, ~25% city landing pages**. This composition is what makes the pyramid look like a real strategy and not a keyword dump.

### S6 — Long-Tail Pages Directory

Title: `"{N} Long-Tail SEO Pages"` where N is `longTailPages.length`. Crystal-Herndon has 31.

Grid: `sm:grid-cols-2 lg:grid-cols-3 gap-5`. Each card:
```
border border-border bg-background p-5
├── flex justify-between
│   ├── span bg-primary text-primary-foreground w-7 h-7 — index number
│   └── status badge:
│       ├── Active:  bg-gold/15 text-gold
│       └── Planned: bg-muted text-muted-foreground (whole card opacity-70)
├── h3 font-display text-base — keyword
└── p text-xs text-muted-foreground — description
```

Active cards wrap in `<Link to={page.route}>` with `hover:border-gold/40` + `hover:shadow-sm`. Planned cards are static `<div>`s.

### S7 — Internal Link Structure

`bg-muted`. Vertical flow, centered, with thin gold connector lines.

```
flex flex-col items-center
└── for each level (Home, Locations, Services, Long-Tail):
    ├── if not first: <div class="w-px h-8 bg-gold/40" />
    └── div border border-border bg-background px-8 py-5 min-w-[280px] text-center
        ├── icon w-5 h-5 text-gold
        ├── p font-display text-lg — level label
        └── p text-xs text-muted-foreground — sub examples
```

Level icons: `Globe → MapPin → Target → BarChart3`.

### S8 — Google Map Ranking Strategy

4 cards, `sm:grid-cols-2 lg:grid-cols-4 gap-6`:

| Card | Icon | Message |
|------|------|---------|
| Reviews | `Star` | Steady stream of authentic 5-star Google reviews |
| Local Keywords | `Search` | Geo-targeted keywords in GBP description / posts / Q&A |
| Website SEO | `Globe` | Align on-site content with GBP categories |
| NAP Consistency | `FileCheck` | Identical Name/Address/Phone across directories |

Each card: `border border-border p-6 text-center` with icon (`w-7 h-7 text-gold mx-auto mb-4`), `font-display text-lg` title, `text-xs text-muted-foreground leading-relaxed` body.

### S9 — Business Impact (THE UPSELL)

Dark bg. 4 outcome cards + the tiffany-blue CTA. This is the section the page exists for.

| Card | Icon | Message |
|------|------|---------|
| Capture Local Demand | `Target` | Rank for high-intent searches from {City} + nearby cities |
| Reduce Paid Ads | `TrendingUp` | Organic visibility lowers CPA |
| Map Pack Visibility | `Map` | Top 3 Google Map results |
| Expand Ranking | `Link2` | "{N} long-tail pages create a wide net" — use real N |

Card style: `bg-primary-foreground/5 border border-primary-foreground/10 p-6 text-center`.

CTA — **must use exactly this style**:
```tsx
<a
  href="https://wintrabiz.com"
  target="_blank"
  rel="noopener"
  title="Wintra — local business websites & digital growth"
  className="inline-flex items-center gap-2 font-body text-xs uppercase tracking-[0.25em] bg-[#81D8D0] text-primary px-12 py-4 hover:opacity-90 transition-all duration-500"
>
  Start Booking Growth Plan
  <ExternalLink className="w-3.5 h-3.5" />
</a>
```

The `bg-[#81D8D0]` is Tiffany blue — chosen so the CTA stands out from the gold accents used everywhere else.

### S10 — Visit CTA

Centered. `max-w-3xl mx-auto text-center`.

```
├── subtitle-elegant — "Come See Us"
├── h2 heading-section — "Visit {Business Name}"
├── flex flex-col gap-3 (contact info)
│   ├── span: MapPin + full address
│   ├── a tel: Phone + number
│   └── a mailto: Mail + email
├── 2 buttons (flex):
│   ├── Primary: bg-gold text-primary-foreground → bookingUrl — "Book Appointment"
│   └── Secondary: border border-border → "/services" — "View Services"
└── p text-xs italic — "SEO strategy and website by [wintrabiz.com](https://wintrabiz.com)"
```

The wintrabiz credit line at the very bottom is mandatory — it's the second touchpoint after S9 and converts the curious-but-not-ready reader.

---

## Integration Steps (after the page file is written)

1. **Lazy import + Route in `App.tsx`**:
   ```tsx
   const SeoGuidePage = lazy(() => import("./pages/SeoGuidePage"));
   // ...
   <Route path="/seo-guide" element={<SeoGuidePage />} />
   <Route path="/seo" element={<Navigate to="/seo-guide" replace />} />
   ```

2. **Register in `src/lib/seo-config.ts`**:
   ```ts
   "/seo-guide": {
     title: "{City} {BusinessType} SEO Guide | Local Market & Strategy | {Business}",
     description: "SEO strategy and local market guide for {businessType} services in {City}, {State}. Competitor analysis, keyword opportunities, and growth roadmap by {Business}.",
     canonical: "{DOMAIN}/seo-guide",
     jsonLd: articleSchema(...),
   }
   ```

3. **Register in `scripts/prerender.mjs`** — add the route to the prerender list so it gets a static HTML page with the right `<title>` / `<meta>` / JSON-LD.

4. **Build-verify**:
   ```bash
   npm run build
   grep '<title>' dist/seo-guide/index.html
   # should show the SEO guide title, not the homepage title
   ```

5. **Don't link from main nav** — `/seo-guide` is a sales surface for direct shares, not a regular site page. The reference impl in Crystal-Herndon is reachable only via direct URL.

---

## Industry Adaptations

The 10-section structure is industry-agnostic. The labels and archetypes change:

| Field | Spa/Massage | Rehab Clinic | Dental | Salon |
|-------|-------------|--------------|--------|-------|
| S1 title pattern | "Massage & Spa Guide" | "Rehab & Recovery Guide" | "Dental Care Guide" | "Hair & Beauty Guide" |
| S2 archetypes | Chains / Medical / Independent | Hospital / Multi-loc / Solo | DSO / Multi-doc / Solo | Franchise / Boutique / Home |
| S3 strengths | Modalities, hours, reviews | Specialties, insurance, outcomes | Tech, insurance, hours | Stylists, brands, niches |
| S4 keywords | "{service} {city}" + "{city} massage" | "{condition} therapy {city}" | "{procedure} {city}" | "{service} {city}" |
| S5 tier 3 pills | Massage / Facials / Acupuncture … | PT / OT / Chiro … | Cleanings / Implants / Ortho … | Cuts / Color / Extensions … |
| S8 NAP card stays | ✓ same for all local businesses |

The Tiffany-blue CTA in S9 and the wintrabiz credit in S10 stay regardless of industry.

---

## Common Pitfalls

- **Don't link `/seo-guide` from main nav.** It's a sales artifact, not a customer-facing page. Distribute the URL directly to clients/leads.
- **Don't fake the Active badges.** A card marked Active must have a real route that exists. A 404 from this page destroys credibility.
- **Don't omit the Planned cards.** A directory of all-Active pages looks suspiciously round. Planned cards make the roadmap honest.
- **Don't reword "Start Booking Growth Plan".** It's tested CTA copy. Other section copy is fine to localize/translate.
- **Don't introduce framer-motion** if the host project doesn't already have it. Use the project's existing scroll-reveal hook or write a 10-line Intersection Observer wrapper.
- **Don't put images in any section.** The visual interest comes from the typography + pyramid + numbered grid. Adding stock photos breaks the "this is data, not marketing" feel.
- **Don't skip the prerender registration.** A `/seo-guide` page that 404s on `view-source:` defeats its own purpose.
