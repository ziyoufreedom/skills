---
name: google-biz-integration
description: |
  Integrate Google Business Profile data (maps, reviews, directions) into local business websites.
  Triggers when: user wants to add Google Maps, Google reviews, Google directions links, or connect a
  Google Business Profile to a website. Also triggers for "fix the map", "add Google reviews",
  "get directions link", or "Google Business" mentions in the context of a local business website.
---

# Google Business Profile Integration Skill

This skill automates the process of discovering a business's Google Business Profile and integrating
Google Maps, reviews, directions, and rating badges into a local business website.

## Overview

For local businesses, Google Business Profile (GBP) integration is critical for SEO and UX:
- Accurate embedded maps with proper place IDs (not just coordinates)
- "Get Directions" links that open Google Maps with the destination pre-filled
- "Leave a Review" CTAs that link directly to the Google review form
- Rating badges showing real Google ratings with the recognizable G icon
- Proper JSON-LD structured data referencing the Google place ID

## Step 1: Discover the Google Business Profile

Given a business name and address, find the Google Place ID and profile data.

### Method A: From a Google share link
If the user provides a `share.google/...` or `g.co/...` or `maps.google.com/...` URL:
1. Use `WebFetch` to follow the redirect chain
2. Extract the Place ID from the resolved URL (format: `ChIJ...`)
3. Extract coordinates, rating, review count from the page content

### Method B: From business name + address
1. Use `WebSearch` for `"<business name>" "<address>" site:google.com/maps`
2. Alternatively, construct a Google Maps search URL:
   `https://www.google.com/maps/search/<business+name+address>`
3. Use `WebFetch` to load and extract the Place ID

### Method C: From Google Maps Embed API
1. Try the embed URL: `https://www.google.com/maps/embed/v1/place?key=API_KEY&q=place_id:PLACE_ID`
2. Or search-based: `https://www.google.com/maps/embed/v1/place?key=API_KEY&q=Business+Name+Address`

### What to extract
For each location, collect:
| Field | Example | How to build |
|---|---|---|
| `placeId` | `ChIJHWDIXgmxxokRUBzuOSQBgvM` | From Google Maps URL or search |
| `mapsUrl` | `https://www.google.com/maps/place/?q=place_id:ChIJ...` | Template with placeId |
| `directionsUrl` | `https://www.google.com/maps/dir/?api=1&destination=...&destination_place_id=ChIJ...` | Template with name+address+placeId |
| `reviewUrl` | `https://search.google.com/local/writereview?placeid=ChIJ...` | Template with placeId |
| `rating` | `4.7` | From Google profile |
| `reviewCount` | `200+` | From Google profile |

### URL Templates

```
# Google Maps link (opens the business listing)
https://www.google.com/maps/place/?q=place_id:{PLACE_ID}

# Directions (opens Google Maps directions to the business)
https://www.google.com/maps/dir/?api=1&destination={BUSINESS_NAME_ENCODED},+{ADDRESS_ENCODED}&destination_place_id={PLACE_ID}

# Write a review (opens the Google review form)
https://search.google.com/local/writereview?placeid={PLACE_ID}

# Embed map (for iframe) — use the pb= format from Google's "Share > Embed a map" feature
# Do NOT use the ?q=Name+Address&output=embed format — Google blocks it in iframes with X-Frame-Options.
# The pb= format is the only reliable embed method. Get it by:
#   1. Go to Google Maps and find the business
#   2. Click Share → Embed a map → Copy HTML
#   3. Extract the src URL (starts with https://www.google.com/maps/embed?pb=...)
# The pb= URL includes the Place ID, coordinates, and timestamp, and renders the full business card.
https://www.google.com/maps/embed?pb=!1m14!1m8!...!2s{PLACE_ID_HEX}!5e0!3m2!1sen!2sus!4v{TIMESTAMP}!5m2!1sen!2sus

# Example (Crystal Massage):
https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d6204.249619906343!2d-77.36649!3d38.966818!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b637e32e916ee1%3A0xbf6cd075020ef9b5!2sCrystal%20Massage!5e0!3m2!1sen!2sus!4v1775936888582!5m2!1sen!2sus
```

### iframe rendering notes (React / JSX)
- Always use `<iframe ...></iframe>` with a closing tag, NOT self-closing `<iframe ... />`. Self-closing iframes can fail to render in some browsers.
- Set a fixed container height via a wrapper div (`style={{ height: 300 }}`), then use `width="100%" height="100%"` on the iframe.
- Always add `referrerPolicy="no-referrer-when-downgrade"` — Google Maps may refuse to load without it.
- Use `loading="lazy"` for below-fold maps.
- **IMPORTANT**: Always get the embed URL from Google Maps Share → Embed a map. Do not construct embed URLs manually.

```tsx
{/* Correct iframe pattern — use pb= URL from Google's Share > Embed */}
<div className="relative w-full" style={{ height: 300 }}>
  <iframe
    src="https://www.google.com/maps/embed?pb=!1m14!1m8!..."
    width="100%"
    height="100%"
    style={{ border: 0 }}
    allowFullScreen={true}
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
    title="Business Name map"
  ></iframe>
</div>
```

## Step 2: Add Google data to the location data model

In the project's central location data file (e.g., `src/lib/locations.ts`), add a `google` field:

```typescript
export interface GoogleProfile {
  placeId: string;
  mapsUrl: string;
  directionsUrl: string;
  reviewUrl: string;
  rating: string;
  reviewCount: string;
}

export interface LocationData {
  // ... existing fields ...
  google: GoogleProfile;
}
```

## Step 3: Fix the map embed

Update the Google Maps embed component to:
1. Use the correct Place ID in the embed URL (not just `0x0:0x0`)
2. Add a "Get Directions" link below the map
3. Add a "View on Google Maps" link with the Google G icon
4. Lazy-load the iframe with IntersectionObserver

### Google G Icon (SVG component)

Use the official Google "G" logo with brand colors:

```tsx
export const GoogleGIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);
```

## Step 4: Add Google integration points across pages

### Where to add Google elements

| Page | Integration |
|---|---|
| **Location home** (hero) | Google rating badge with G icon, clickable to Maps listing |
| **Location home** (reviews section) | "Leave a Review on Google" button after review cards |
| **Location home** (map section) | "Get Directions" link with G icon below map |
| **Locations hub** | Per-location Google rating in each card |
| **Homepage** (reviews section) | Per-location "Review on Google" buttons |
| **Homepage** (location cards) | Get Directions links below maps |
| **Contact page** | Get Directions link below map |
| **About page** | Get Directions links below maps |
| **JSON-LD schemas** | Use per-location `google.rating` and `google.reviewCount` |

### Button styles

**Google review button** — white background with Google branding (works on both light and dark themes):
```tsx
<a
  href={loc.google.reviewUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-6 py-3 text-sm tracking-wide font-body rounded-full hover:shadow-md hover:border-gray-400 transition-all duration-300"
>
  <GoogleGIcon className="w-5 h-5" />
  Leave a Review on Google
</a>
```

**Inline rating badge** — compact, for hero sections and cards:
```tsx
<a
  href={loc.google.mapsUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-1.5 hover:text-gold transition-colors"
>
  <GoogleGIcon className="w-4 h-4" />
  <Star className="w-4 h-4 text-gold fill-gold" />
  {loc.google.rating} Stars ({loc.google.reviewCount} reviews)
</a>
```

**Get Directions link** — single link with G icon below map (don't add a separate "View on Google Maps" — the directions link already opens Google Maps):
```tsx
<a
  href={loc.google.directionsUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-2 text-sm font-body tracking-wide text-foreground/60 hover:text-gold transition-colors"
>
  <GoogleGIcon className="w-4 h-4" />
  Get Directions
</a>
```

## Step 5: Update JSON-LD structured data

In location-specific schemas, use the real Google profile data:

```typescript
aggregateRating: {
  "@type": "AggregateRating",
  ratingValue: loc.google.rating,
  bestRating: "5",
  ratingCount: loc.google.reviewCount.replace(/[^\d]/g, ""),
},
```

## Checklist

- [ ] Google Place ID found for each location
- [ ] `google` field added to location data model with all URLs
- [ ] Map embed uses `?q=Name+Address&output=embed` format (not broken `pb=` format)
- [ ] GoogleGIcon SVG component created and exported
- [ ] Single "Get Directions" link with G icon under every map embed (no redundant "View on Google Maps")
- [ ] Google rating badge in location hero sections
- [ ] "Leave a Review on Google" button in review sections
- [ ] Per-location rating in location cards/hub pages
- [ ] JSON-LD schemas use per-location Google rating data
- [ ] All Google links open in new tab with `rel="noopener noreferrer"`
- [ ] TypeScript compiles with zero errors
- [ ] Build succeeds
