# Lead Enrichment + Customer Match Retargeting Workflow

Day-one infrastructure. Without this, Google Ads spend on B2B SaaS is at most 30% as efficient as it should be.

## The 9-step funnel

| # | Step | Tool | Cadence | Owner |
|---|---|---|---|---|
| 1 | Form submit on LP (must capture work email + company) | HubSpot / Marketo / Pardot | Real-time | Marketing Ops |
| 2 | Email validation + reject free providers | NeverBounce / ZeroBounce | Real-time webhook | Marketing Ops |
| 3 | Enrichment (firmographics + technographics) | **Apollo.io** (best $/value); ZoomInfo if budget allows | Real-time API | Marketing Ops |
| 4 | ICP scoring | Custom rubric (see below) | Real-time | RevOps |
| 5 | Routing by score | Score ≥60 → SDR 24h SLA; 30-59 → nurture; <30 → drop | Real-time | Sales |
| 6 | Customer Match upload | Score ≥30 emails → SHA-256 hash → Google Ads API | Weekly | Marketing Ops |
| 7 | Retargeting messaging | High-score: "Book 15-min architecture review"; Mid: "Download Reference Architecture" | Continuous | Marketing |
| 8 | Lookalike (`Similar audiences` / `Performance Max`) | Customer Match seed (≥60 score, 1000+ list) | When seed reaches 500 | Marketing |
| 9 | Offline conversion upload | CRM stage transitions (demo→opp→closed-won) → Google Ads enhanced conversions, weighted | Daily cron | RevOps |

## ICP Scoring Rubric (default for enterprise B2B SaaS)

Sum the points; use score 0-100. Override per-product as needed.

| Signal | Points |
|---|---|
| Employee count >500 | +30 |
| Employee count 100-500 | +15 |
| Industry: FinServ / Healthcare / Government / Top SaaS | +20 |
| Industry: Other regulated | +10 |
| Tech stack includes AWS (or your hyperscaler partner) | +15 |
| Title contains: VP / Director / Head | +20 |
| Title function: AI / Data / Platform / Security / Engineering | +25 |
| Funding: Series B+ / Public / Profitable | +10 |
| Funding: Pre-Series B | 0 |
| Free email provider (gmail, yahoo, outlook.com) | -100 (auto-reject) |
| Geo: US / CA / UK / AU | +0 (neutral, on target) |
| Geo: outside English-language enterprise markets | -10 |

Score thresholds:
- **≥60**: SDR queues for 24h SLA. Customer Match audience "high-fit". Retargeting message = direct demo CTA.
- **30-59**: Nurture sequence (3-touch email + retargeting). Customer Match audience "mid-fit". Retargeting message = content offer.
- **<30**: Drop from CRM. Optionally include in lookalike-seed exclusions.

## Customer Match audience structure

In Google Ads, build:

- `cm_high_fit_active_30d` — score ≥60, last activity ≤30 days. Receives premium retargeting bids.
- `cm_mid_fit_60d` — score 30-59, last activity ≤60 days. Receives content-focused retargeting.
- `cm_demo_booked` — booked a demo, no-show or post-demo not-yet-closed. Receives "see live setup" retargeting.
- `cm_lost_opp_180d` — closed-lost in last 6 months. Receives win-back creative every 3 months.
- `cm_existing_customer` — current paying customers. **Excluded** from prospecting campaigns (don't pay for clicks from existing customers).

## gclid → form → CRM passthrough (CTO must verify before launch)

1. Google Ads auto-tagging on (`?gclid=...` appended to all ad clicks).
2. LP captures gclid in hidden form field on page load (JavaScript: `URLSearchParams`).
3. Form submission posts gclid alongside contact data to CRM.
4. CRM stores gclid on Contact + Opportunity records.
5. Daily cron: query CRM for stage changes → POST to Google Ads enhanced conversions endpoint with `{gclid, conversion_action_id, conversion_value, conversion_time}`.
6. Validate weekly: Google Ads → Tools → Conversions → look for "imported" entries matching CRM activity.

## UTM canonical (Account-level Tracking Template)

```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={_campaign}&utm_content={adgroupid}&utm_term={keyword}&gclid={gclid}
```

Set this at the Account level in Google Ads, NOT in the CSV's Final URL field. That keeps the CSV's Final URLs clean (just the destination path) and centralizes UTM logic.

## Failure early-warning watchlist

Set up Slack/email alerts for:

- **Week 2:** Search Term Report shows >40% impressions on terms NOT in your keyword list → negative list incomplete; pause + add negatives.
- **Week 4:** Average Quality Score <5/10 OR average CPC > bid × 1.4 → LP–keyword mismatch; review LP relevance.
- **Week 4:** Form submission rate <0.5% on BoFu campaigns → LP CTA broken or LP not loading; smoke-test the funnel.
- **Week 8:** Cost per MQL >$1,500 AND SDR feedback "ICP match <30%" → targeting wrong audience; revisit keyword set + ICP scoring.

## Attribution

- **Google Ads internal:** Data-Driven Attribution (DDA). Never `last-click` for B2B SaaS — too long a sales cycle.
- **Cross-channel:** HubSpot W-shaped or U-shaped multi-touch.
- **Reporting cadence:** Monthly review of `Assisted Conversions` + `Time to Conversion` reports — these reveal the true value of MoFu/ToFu campaigns that look bad on last-click.
