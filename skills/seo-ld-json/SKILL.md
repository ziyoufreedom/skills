---
name: seo-ld-json
description: |
  Add or fix JSON-LD structured data for SEO on websites. Triggers when: user wants to add schema.org
  structured data, fix Google Search Console rich result errors, add Product/Organization/WebSite/
  BreadcrumbList/SoftwareApplication schemas, or mentions "ld+json", "structured data", "rich results",
  "schema.org", or "Google Search Console validation errors".
---

# SEO JSON-LD Structured Data Skill

This skill handles adding, fixing, and validating JSON-LD structured data for websites to pass Google Rich Results validation.

## Core Rules

### Architecture: Global vs Page-Specific

- **Global schemas** (Organization, WebSite) go in the root layout — loaded once on every page.
- **Page-specific schemas** (WebPage, Product, SoftwareApplication, BreadcrumbList, ItemList) go in each individual page file.
- Page-specific schemas reference global schemas via `@id`, never duplicate them.
- Use `@graph` array to group multiple schemas in one `<script>` block.

### @id Convention

Every reusable entity gets a stable `@id` so other schemas can reference it without duplication:

```
Organization:  https://example.com/#organization
WebSite:       https://example.com/#website
Product:       https://example.com/product-page/#product
WebPage:       https://example.com/product-page/#webpage
BreadcrumbList: https://example.com/product-page/#breadcrumb
SoftwareApplication: https://example.com/product-page/#softwareapplication
```

Reference with: `{ "@id": "https://example.com/#organization" }`

### Google Product Schema Requirements

Google requires **every** `Product` node to pass validation — including nested ones inside `hasPart` or `isPartOf`. Each Product node MUST have:

1. **`name`** — required
2. **`image`** — required (CRITICAL, will error without it)
3. **At least one of**: `offers`, `review`, or `aggregateRating` — required (CRITICAL)
4. **`description`** — recommended (warning if missing)

### Offers / Pricing Rules

When a product has a public price, use it directly. For B2B / enterprise / contact-for-pricing products:

```json
"offers": {
  "@type": "Offer",
  "url": "https://example.com/contact/",
  "availability": "https://schema.org/InStock",
  "description": "Contact sales for enterprise pricing",
  "priceSpecification": {
    "@type": "PriceSpecification",
    "price": 0,
    "priceCurrency": "USD"
  }
}
```

- `price: 0` is officially valid per Google docs, means "free" / "free to inquire".
- **Never** omit `price` from `Offer` — Google will error.
- `url` should point to a contact/sales page, not the product page itself.
- Add `description` to clarify the pricing model.

### Avoiding Nested Product Pitfalls

Google validates **every** Product node independently — even ones nested inside `hasPart`, `isPartOf`, `mentions`, `about`, `subjectOf`, or any other relationship property. A minimal `{"@type": "Product", "name": "X"}` reference will fail validation with "Either offers, review, or aggregateRating should be specified" because Google sees it as a standalone Product missing required fields.

This is the most common Search Console "Either offers, review, or aggregateRating should be specified" error. The fix depends on what you're trying to express:

**1. Listing sub-products you own** (`hasPart`) — supply ALL Product required fields on each sub-product:

```json
"hasPart": [
  {
    "@type": "Product",
    "name": "Sub Product",
    "url": "https://example.com/sub-product/",
    "image": "https://example.com/img/product.webp",
    "description": "Short description of this sub-product.",
    "offers": { ... }
  }
]
```

**2. Referencing a parent product** (`isPartOf`) — use an `@id` reference instead of inlining the Product:

```json
"isPartOf": {
  "@id": "https://example.com/parent-product/#product"
}
```

**3. Mentioning competitors / vendors** (`Article.mentions`, `about`) — DO NOT use `Product` for entities you don't own and don't have offers for. Use `Organization` (preferred for known vendors — links to Knowledge Graph) or `Thing` (most generic). Both have no strict required fields beyond `name`:

```json
"mentions": [
  { "@type": "Organization", "name": "Moveworks" },
  { "@type": "Organization", "name": "Glean" }
]
```

**The general rule**: never emit `@type: "Product"` unless the surrounding object has `name`, `image`, `description`, AND (`offers` OR `review` OR `aggregateRating`). If you can't supply all four — pick a different schema type. `Article.mentions` accepts any `Thing` so you have free choice.

**Past incident** — comparison pages were emitting `mentions: [{"@type": "Product", "name": "Moveworks"}, ...]` with only `name`. Search Console flagged every comparison page for "Jarvis AI" and "Moveworks" Product validation. Fix was changing `@type` to `Organization` (single keyword change, 10 invalid nodes resolved at once).

### SaaS — prefer SoftwareApplication over Product

For B2B SaaS / enterprise software, **don't use `Product`** as the @type — even if you fix `brand`, `priceSpecification`, and `hasMerchantReturnPolicy`, validators will still warn about missing `shippingDetails`, `review`, and `aggregateRating` fields that are required for shopping-eligible Product snippets but irrelevant for hosted software.

The clean answer is to switch the @type:

```json
{
  "@type": ["SoftwareApplication", "WebApplication"],
  "@id": "https://example.com/product/#software",
  "name": "Product Name",
  "url": "https://example.com/product/",
  "applicationCategory": "BusinessApplication",
  "applicationSubCategory": "Specific category — e.g., Enterprise AI Agent Platform",
  "operatingSystem": "Web",
  "browserRequirements": "Requires a modern web browser",
  "description": "...",
  "image": "https://example.com/img/product.webp",
  "screenshot": "https://example.com/img/product.webp",
  "featureList": [
    "Feature 1",
    "Feature 2",
    "Feature 3"
  ],
  "publisher": { "@type": "Organization", "name": "Vendor Inc.", "url": "https://vendor.com" },
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "1500",
    "highPrice": "2800",
    "priceCurrency": "USD",
    "offerCount": 3,
    "url": "https://aws.amazon.com/marketplace/...",
    "availability": "https://schema.org/OnlineOnly"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5",
    "ratingCount": "1",
    "bestRating": "5"
  },
  "review": {
    "@type": "Review",
    "author": { "@type": "Person", "name": "Verified AWS Customer" },
    "datePublished": "2026-01-09",
    "name": "Short headline of the review",
    "reviewBody": "Full review text...",
    "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" }
  }
}
```

Why this passes cleanly:

- **No `shippingDetails` / `hasMerchantReturnPolicy` warnings** — those are merchant-listing fields tied to Product, not expected on SoftwareApplication.
- **No `brand` type confusion** — SoftwareApplication doesn't take `brand`; ownership is expressed via `publisher`.
- **No `referenceQuantity` unit-code rejection** — `AggregateOffer` doesn't carry referenceQuantity at all; the price range with `offerCount` says everything Google needs about pricing tiers.
- **Multi-typed `["SoftwareApplication", "WebApplication"]`** — the more specific WebApplication says "this runs in a browser" without requiring binary install fields like `downloadUrl` or `installUrl`.

### Mandatory: visible content for `aggregateRating` and `review`

Adding `aggregateRating` / `review` to JSON-LD is **only valid if the same rating and review text are visibly rendered on the page**. Google penalizes invisible-markup fabrication harder than missing schema. Pattern:

1. Source one real review (e.g., from AWS Marketplace, G2, Capterra, or a direct customer testimonial with permission).
2. Render a `<figure><blockquote>` block on the page with the review headline, body, author, date, and source link.
3. Render the rating (e.g., "5.0 / 5 ★★★★★") with proper `aria-label="N out of M stars"` for accessibility.
4. Embed the same data in JSON-LD via `aggregateRating` + `review`.

If you can't show the review visibly, **don't put it in schema** — drop the aggregateRating/review fields entirely and accept the "missing optional" warning. Invisible-markup penalty risk > information-completeness gain.

### Older Product pattern (still useful for non-software products)

For physical or merchant-listing-eligible products, keep `Product`. Google's strict validators flag several optional fields. The minimal schema that passes cleanly:

```json
"@type": "Product",
"brand": { "@type": "Brand", "name": "Vendor Inc." },
"offers": [{
  "@type": "Offer",
  "name": "Basic",
  "description": "Per month, billed monthly",
  "availability": "https://schema.org/InStock",
  "hasMerchantReturnPolicy": {
    "@type": "MerchantReturnPolicy",
    "applicableCountry": "US",
    "returnPolicyCategory": "https://schema.org/MerchantReturnNotPermitted"
  },
  "priceSpecification": {
    "@type": "UnitPriceSpecification",
    "price": "1500",
    "priceCurrency": "USD"
  }
}]
```

Three traps worth noting:

- **`brand` should be `Brand`, not `Organization`**. Schema.org accepts both, but the strict validators specifically prefer `Brand` (the more specific subtype). Keep `manufacturer` as `Organization` — that one actually wants Organization.

- **Don't put `referenceQuantity` with `unitCode: "MON"` on a SaaS Offer's priceSpecification**. "MON" is a valid UN/CEFACT code for "month" but Google's Product validator emits "Invalid or unsupported unit pricing measure" — the validator only accepts unit codes for tangible measurable quantities (KGM, MTR, etc.), not subscription cadence. Move "per month" into the Offer's `description` field instead.

- **`hasMerchantReturnPolicy: MerchantReturnNotPermitted`** is the right declaration for digital subscriptions — it tells Google "we don't accept returns" without claiming we do shipping. Skip `shippingDetails` entirely; declaring shipping rates on a non-shipped digital product is misleading and the missing-field warning is purely informational, not a critical error.

### Schema Types Cheat Sheet

| Type | When to use | Key fields |
|---|---|---|
| Organization | Once globally, in layout | name, url, email, telephone, address |
| WebSite | Once globally, in layout | name, url, publisher (@id ref to Org) |
| WebPage | Per page | name, url, isPartOf (@id ref to WebSite), breadcrumb |
| Product | Per product page | name, image, description, offers, brand (@id ref to Org) |
| SoftwareApplication | Per software product | name, applicationCategory, operatingSystem, url, featureList |
| BreadcrumbList | Per page (for hierarchy) | itemListElement with ListItem (position, name, item) |
| ItemList | Optional, for listing features/integrations/use-cases | itemListElement with ListItem |

### What NOT to Do

- **No FAQPage** unless FAQ content is actually visible on the page. Google penalizes invisible FAQ markup.
- **No `review` or `aggregateRating`** unless real reviews/ratings are visible on the page. Fabricating these violates Google guidelines.
- **No duplicate schemas** — don't put Organization in both layout and page files.
- **Don't use `next/script` with `strategy="afterInteractive"`** for JSON-LD — it won't be in the static HTML for crawlers on SSG sites. Use `<Script type="application/ld+json">` without strategy, or inline `<script>` tags.
- **Don't put `citation` on a Product node**. `citation` is a `CreativeWork` (and `Article` / `Book` / etc.) property — Google's Rich Results Test reports "The property citation is not recognized by Schema.org vocabulary" for Product. The visible footnotes / sources block can still render to readers; just don't attach the structured `citation` array to the Product LD. If you want crawler-visible citations on a product page, emit a separate `WebPage` or `Article` schema in the same `@graph` and put `citation` there.
- **Don't omit `price` + `priceCurrency` on an Offer's `priceSpecification`**. Even for "contact for pricing" / enterprise tiers without a public number, Google requires both fields. The accepted pattern is `price: "0"` + `priceCurrency: "USD"` + a `description` like "Custom pricing — contact sales for quote". A `priceSpecification` with only `description` and no price triggers "A value for the price or priceSpecification.price field is required for a nested Offer".

## Validation Checklist

Before committing, verify every JSON-LD block:

1. Valid JSON (no trailing commas, proper quoting)
2. Every `Product` node has: name, image, offers (with price), description
3. Every `Offer` has `priceSpecification` with `price` and `priceCurrency`
4. `hasPart` sub-products have all required fields
5. `isPartOf` uses `@id` reference, not inline Product
6. `@id` references match actual schema `@id` values
7. No duplicate schema types across layout and page files
8. Build passes without errors

## Common Google Search Console Errors and Fixes

| Error | Fix |
|---|---|
| "Either offers, review, or aggregateRating should be specified" | Add `offers` with `priceSpecification` to the Product node |
| "Missing field image" | Add `image` URL to the Product node |
| "Missing field description" | Add `description` string to the Product node |
| "Missing field review / aggregateRating" | Non-critical warning, ignore unless you have real review data |
