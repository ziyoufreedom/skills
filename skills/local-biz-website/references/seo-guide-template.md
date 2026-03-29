# SEO Guide Page Template

Reference specification for the SEO strategy showcase page generated in Phase 4.

## Input: What to extract

From the competitive SEO audit report (or Phase 1-2 data), extract:
- **Business name**, city, state/province, address, phone, email
- **Services offered** (for pyramid tier 3)
- **Local competitors** (name, type, strengths, distance)
- **Target keywords** (6-8 top transactional + informational keywords)
- **Long-tail keyword pages** — list all routes from Phase 2-3, marking each as Active (route exists) or Planned (future)
- **Sub-services / long-tail topics** (for pyramid tier 4)

## Section-by-Section Specification

### S1 — Hero
```
bg-primary, text-primary-foreground
```
- Subtitle: `text-gold uppercase tracking-widest text-sm` — "SEO Strategy & Local Guide"
- Title: `font-heading text-4xl md:text-5xl lg:text-6xl` — "{City} *{Business Type} Guide*" (italic gold accent on the guide/type text)
- Description paragraph about the local market (2-3 sentences)
- Two CTA buttons:
  - Primary: `bg-gold text-primary` — "Visit {Business Name}" → `/`
  - Secondary: `border border-primary-foreground/30` — "Explore Services" → `/services`

### S2 — Market Overview
```
default bg
```
- Title: "{City} {Business Type} Market"
- 3 cards describing the competitor landscape archetypes relevant to the business. Examples:
  - For rehab: Chain Franchises, Legacy Practices, Independent Clinics
  - For spa: Massage Chains, Medical Spas, Independent Studios
- Each card: icon (`text-gold`), title (`font-heading`), description

### S3 — Competitor Landscape
```
bg-muted
```
- Title: "Local Competitors"
- Grid of competitor cards (`md:grid-cols-2`)
- Each card contains:
  - Name (`font-heading`)
  - Type badge (`bg-gold/15 text-gold rounded-full text-xs`)
  - Strengths list (bullet points with gold chevron icons)
  - Distance line (`text-xs text-muted-foreground/70` with MapPin icon)

### S4 — SEO Opportunity
```
default bg
```
- Title: "SEO Opportunity"
- Grid of 6-8 keyword cards (`sm:grid-cols-2 lg:grid-cols-4`)
- Each card: Search icon + keyword text in a bordered card

### S5 — SEO Strategy Map (Pyramid)
```
bg-primary, text-primary-foreground
```
- Title: "SEO Strategy Map"
- Visual pyramid with 4 tiers, narrowest at top:
  - Tier 1 (`max-w-[200px] bg-gold text-primary`): Home → Business Name
  - Tier 2 (`max-w-[320px] bg-primary-foreground/10`): Location → "{City} {State} {Business Type}"
  - Tier 3 (`max-w-[480px] bg-primary-foreground/5`): Service Categories (flex-wrap pills)
  - Tier 4 (`w-full bg-primary-foreground/5`): Long-tail keyword pages (inline text list)

### S6 — Long-Tail SEO Pages
```
default bg
```
- Title: "{N} Long-Tail SEO Pages" (N = total count)
- Grid of keyword cards (`sm:grid-cols-2 lg:grid-cols-3`)
- Each card:
  - Number badge (`bg-gold/15 text-gold rounded-full`)
  - Active/Planned status badge (Active: `bg-green-100 text-green-700`; Planned: `bg-muted text-muted-foreground`)
  - Keyword (`font-heading text-sm`)
  - Concept description (`text-xs text-muted-foreground`)
  - Active cards: wrapped in `<Link to={route}>` with hover ExternalLink icon
  - Planned cards: static `<div>`, no link

### S7 — Internal Link Structure
```
bg-muted
```
- Title: "Internal Link Structure"
- Vertical flow with connecting lines (`h-6 w-px bg-border`):
  - Home (Globe icon, `bg-gold text-primary`)
  - Location Pages (MapPin icon, `bg-primary text-primary-foreground`)
  - Service Pages (Target icon, `bg-primary text-primary-foreground`)
  - Long-Tail SEO Pages (BarChart3 icon, `bg-primary text-primary-foreground`)
- Description paragraph about internal linking strategy

### S8 — Google Map Ranking Strategy
```
default bg
```
- Title: "Google Map Ranking Strategy"
- 4 factor cards (`sm:grid-cols-2`):
  1. **Reviews** (Star icon) — mention actual review count/rating
  2. **Local Keywords** (Search icon) — service + city in titles/H1s/FAQ
  3. **Website SEO** (Globe icon) — JSON-LD, canonical, mobile
  4. **NAP Consistency** (FileCheck icon) — unified name/address/phone

### S9 — Expected Business Impact (UPSELL)
```
bg-primary, text-primary-foreground
```
- Title: "Expected Business Impact"
- Subtitle: "This strategy is built for long-term search dominance and sustainable booking growth, not short-term keyword spikes."
- 4 impact cards (`border-primary-foreground/15 bg-primary-foreground/5`):
  1. **Capture Segmented Local Demand** (Target icon)
  2. **Reduce Reliance on Paid Ads** (TrendingUp icon)
  3. **Increase Map Pack Visibility** (Map icon)
  4. **Expand Ranking Footprint** (Link2 icon) — mention nearby cities/sub-markets
- CTA button: **"Start Booking Growth Plan"** → `https://wintrabiz.com`
  - Style: `bg-[#81D8D0] text-primary` (tiffany blue)
  - Include ExternalLink icon

### S10 — Visit CTA
```
default bg, text-center
```
- Title: "Visit {Business Name}"
- Contact info with icons (MapPin, Phone, Mail) — all `text-gold`
- Two buttons:
  - Primary: `bg-gold text-primary` — "Book Appointment" → booking platform URL
  - Secondary: `border border-border` — "View Services" → `/services`
- Closing italic text (`text-xs text-muted-foreground/60`): "This guide was created to provide a transparent view of the local {business type} market in {City}... For questions, visit wintrabiz.com."

## File & Route Conventions

- **File:** `src/pages/SeoGuidePage.tsx`
- **Route:** `/seo-guide`
- **Redirect:** `/seo` → `/seo-guide` via `<Navigate to="/seo-guide" replace />`
- **SEO title:** "{City} {Business Type} SEO Guide | Local Market & Strategy | {Business Name}"
- **SEO description:** "SEO strategy and local market guide for {business type} services in {City}, {State}. Competitor analysis, keyword opportunities, and growth roadmap by {Business Name}."
- **JSON-LD:** Article schema

## Component Pattern

```tsx
// Reusable Section wrapper with scroll-triggered animation
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7 }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
```

## Reference Implementation

The reference implementation is the `SeoGuidePage.tsx` created for:
- **spa-lux** project (carehealinghands.com / Westlake, OH) — original
- **yonge-rehab** project (yongerehab.com / Richmond Hill, ON) — adapted for rehab clinic
