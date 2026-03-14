# SEO Blueprint — Worked Example
## Business: Serenity Spa & Massage, Knoxville TN

### Primary Keyword
`massage spa knoxville`

### Keyword Map

**Service Keywords**
| Keyword | Monthly Vol. Est. | Page Slug |
|---------|------------------|-----------|
| deep tissue massage knoxville | medium | /services/deep-tissue-massage-knoxville |
| couples massage knoxville | medium | /services/couples-massage-knoxville |
| relaxation massage knoxville | low-medium | /services/relaxation-massage-knoxville |
| therapeutic massage knoxville | low | /services/therapeutic-massage-knoxville |
| facial knoxville | medium | /services/facial-knoxville |
| hydrofacial knoxville | low-medium | /services/hydrofacial-knoxville |
| swedish massage knoxville | medium | /services/swedish-massage-knoxville |

**Location Keywords**
| Keyword | Page Slug |
|---------|-----------|
| massage spa farragut | /locations/massage-spa-farragut |
| massage spa cedar bluff | /locations/massage-spa-cedar-bluff |
| massage spa west knoxville | /locations/massage-spa-west-knoxville |
| massage spa near me knoxville | /locations/massage-spa-near-me |
| massage spa knoxville tn | /locations/massage-spa-knoxville |

**Authority Keywords**
| Keyword | Page Slug |
|---------|-----------|
| best massage spa knoxville | /guides/best-massage-spa-knoxville |
| massage for back pain knoxville | /guides/massage-for-back-pain |
| benefits of regular massage | /guides/benefits-of-massage |
| stress relief massage | /guides/stress-relief-massage |
| couples spa day knoxville | /guides/couples-spa-day-knoxville |

---

### Full Page List (22 pages)

**Core Pages (5)**
1. Home — `/`
2. About — `/about`
3. Services Hub — `/services`
4. Contact — `/contact`
5. FAQ — `/faq`

**Service Pages (7)**
6. `/services/deep-tissue-massage-knoxville`
7. `/services/couples-massage-knoxville`
8. `/services/relaxation-massage-knoxville`
9. `/services/therapeutic-massage-knoxville`
10. `/services/facial-knoxville`
11. `/services/hydrofacial-knoxville`
12. `/services/swedish-massage-knoxville`

**Location Pages (5)**
13. `/locations/massage-spa-farragut`
14. `/locations/massage-spa-cedar-bluff`
15. `/locations/massage-spa-west-knoxville`
16. `/locations/massage-spa-near-me`
17. `/locations/massage-spa-knoxville`

**Authority/Guide Pages (5)**
18. `/guides/best-massage-spa-knoxville`
19. `/guides/massage-for-back-pain`
20. `/guides/benefits-of-massage`
21. `/guides/stress-relief-massage`
22. `/guides/couples-spa-day-knoxville`

---

### Internal Link Tree

```
Home (/)
 ├── Services (/services)
 │   ├── Deep Tissue → /services/deep-tissue-massage-knoxville
 │   ├── Couples → /services/couples-massage-knoxville
 │   ├── Relaxation → /services/relaxation-massage-knoxville
 │   ├── Therapeutic → /services/therapeutic-massage-knoxville
 │   ├── Facial → /services/facial-knoxville
 │   ├── Hydrofacial → /services/hydrofacial-knoxville
 │   └── Swedish → /services/swedish-massage-knoxville
 │
 ├── Locations
 │   ├── Farragut → /locations/massage-spa-farragut
 │   ├── Cedar Bluff → /locations/massage-spa-cedar-bluff
 │   └── West Knoxville → /locations/massage-spa-west-knoxville
 │
 ├── Guides
 │   ├── Best Spa in Knoxville → /guides/best-massage-spa-knoxville
 │   ├── Back Pain Relief → /guides/massage-for-back-pain
 │   ├── Massage Benefits → /guides/benefits-of-massage
 │   ├── Stress Relief → /guides/stress-relief-massage
 │   └── Couples Spa Day → /guides/couples-spa-day-knoxville
 │
 ├── About → /about
 ├── FAQ → /faq
 └── Contact → /contact
```

---

### Page Priority for Content Generation

**Tier 1 (Do first — highest traffic potential)**
- Home
- /services/deep-tissue-massage-knoxville
- /services/couples-massage-knoxville
- /locations/massage-spa-near-me
- /guides/best-massage-spa-knoxville

**Tier 2 (Second batch)**
- All remaining service pages
- /locations/massage-spa-knoxville (primary city)

**Tier 3 (Fill in)**
- Neighborhood location pages
- Guide/authority pages
- FAQ, About, Contact

---

### Sample Page Blueprints (JSON)

```json
[
  {
    "slug": "/",
    "page_type": "core",
    "title": "Serenity Spa & Massage | Knoxville TN | Book Today",
    "meta_description": "Serenity Spa & Massage in Knoxville TN. Deep tissue, couples massage, facials & more. Professional therapists, relaxing environment. Book online today.",
    "h1": "Knoxville's Premier Massage & Spa Experience",
    "target_keyword": "massage spa knoxville",
    "secondary_keywords": ["knoxville massage", "spa knoxville tn", "massage knoxville tn"],
    "internal_links_to": ["/services", "/services/deep-tissue-massage-knoxville", "/services/couples-massage-knoxville", "/contact"],
    "schema_type": "Spa"
  },
  {
    "slug": "/services/deep-tissue-massage-knoxville",
    "page_type": "service",
    "title": "Deep Tissue Massage in Knoxville | Serenity Spa",
    "meta_description": "Professional deep tissue massage in Knoxville TN. Relieve chronic pain, muscle tension & stress. Certified therapists. Book your appointment today.",
    "h1": "Deep Tissue Massage in Knoxville, TN",
    "target_keyword": "deep tissue massage knoxville",
    "secondary_keywords": ["deep tissue massage knoxville tn", "therapeutic massage knoxville"],
    "internal_links_to": ["/services", "/services/therapeutic-massage-knoxville", "/guides/massage-for-back-pain", "/contact"],
    "schema_type": "Service"
  },
  {
    "slug": "/locations/massage-spa-near-me",
    "page_type": "location",
    "title": "Massage Spa Near Me in Knoxville | Serenity Spa",
    "meta_description": "Looking for a massage spa near you in Knoxville? Serenity Spa is conveniently located serving Farragut, Cedar Bluff & West Knoxville. Book online now.",
    "h1": "Massage Spa Near You in Knoxville, TN",
    "target_keyword": "massage spa near me",
    "secondary_keywords": ["massage near me knoxville", "spa near me knoxville tn"],
    "internal_links_to": ["/locations/massage-spa-farragut", "/locations/massage-spa-cedar-bluff", "/contact"],
    "schema_type": "LocalBusiness"
  }
]
```
