# Business-Line Guardrails

The most common B2B SaaS ad failure: parent company's other revenue lines bleed into product ads. The ad pitches "AWS Advanced Consulting Partner" as a credibility signal, but Google's algorithm interprets the headline literally and starts serving the ads to people searching "aws consulting" — burning budget on the wrong intent.

## Forbidden phrasing in RSA headlines / descriptions

These phrases are auto-flagged by the validator. **Do not use:**

| ❌ Avoid | ✅ Replace with |
|---|---|
| "AWS Advanced Consulting Partner" | "AWS Advanced Partner" |
| "AWS Consulting Partner" | "AWS Advanced Partner" |
| "Cloud Consulting" | "Cloud Native" |
| "Migration Services" | "Migration-Ready Architecture" |
| "Implementation Services" | "5-Min Setup" / "Self-Host Today" |
| "Expert Implementation" | (delete; let the product speak) |
| "Professional Services" | (delete; never in product ads) |
| "Training Available" | "Self-Serve Onboarding" |

## Allowed credibility signals (B2B SaaS product ads)

These DO NOT imply a service line; they're product trust signals:

- "Available on AWS Marketplace" ← preferred when applicable
- "AWS Advanced Partner" (no "Consulting")
- "Apache 2.0 Licensed"
- "Open Source"
- "SOC2-Ready"
- "ISO 27001"
- "HIPAA-Eligible"
- "Self-Host or Cloud"
- "Multi-Cloud" / "AWS, Azure, GCP"
- "AWS Bedrock Integrated"

## Rationale

Google's Quality Score considers landing page relevance, keyword relevance, AND ad text relevance to the searcher's intent. When an ad headline says "AWS Advanced Consulting Partner", Google models this as "advertiser offers AWS consulting" → starts matching searches for "aws consulting", "aws migration", "managed AWS services". Those searchers click, find a product page (not consulting), bounce, and Quality Score craters.

The fix is upstream: don't write "Consulting" into the ad in the first place.

## Enforcement

Validator regex check:

```python
import re
FORBIDDEN = re.compile(
    r"\b(consulting partner|consulting services|professional services|"
    r"managed services|migration services|implementation services|"
    r"training available|expert implementation)\b",
    re.IGNORECASE,
)
```

If any RSA headline or description matches this regex → validation error.

## When parent company does sell services

If the parent legitimately sells AWS consulting AND the product (e.g. ASCENDING sells both Jarvis and AWS consulting), the two should run as **completely separate Google Ads accounts** or at minimum **separate manager-account labels** with disjoint negative lists. Never let them share campaigns. The product brand and service brand have different ICPs, different conversion paths, and different KPIs.

If running one account with both, this skill is the wrong tool — use a generic Google Ads workflow with explicit campaign labels and run negatives on each side blocking the other's queries.
