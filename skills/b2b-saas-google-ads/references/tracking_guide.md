# Tracking + Attribution Setup Guide

This is the template for the `tracking_setup.md` deliverable that ships alongside the master CSV. Customize per product.

## Pre-launch checklist (Phase 0 — before unpausing any campaign)

- [ ] **Auto-tagging enabled** in Google Ads → Account Settings → Auto-tagging = ON.
- [ ] **Account-level Tracking Template** set: `{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={_campaign}&utm_content={adgroupid}&utm_term={keyword}&gclid={gclid}`
- [ ] **Final URL Suffix** clear (no double UTMs).
- [ ] **Conversion actions defined** in Google Ads:
  - `Demo Booked` — primary, $500 value (or your assumed CPL ceiling)
  - `Marketplace Click` — secondary, $50 value
  - `Email Capture` — secondary, $20 value
  - `Free Trial Signup` (if applicable) — primary, $200 value
- [ ] **Enhanced Conversions** enabled (matches gclid → CRM data on conversion upload).
- [ ] **Data-Driven Attribution** chosen (Account → Tools → Attribution).
- [ ] **gclid form field** present in LP form schema, captures from URL on page load.
- [ ] **CRM integration verified**: post a test form → confirm gclid arrives at CRM Contact record.
- [ ] **Offline conversion uploader** scheduled (daily cron, posts CRM stage changes).
- [ ] **Customer Match list** seeded with first existing-customer email batch (excluded from prospecting).
- [ ] **Apollo enrichment** webhook hits a test form within 30s.
- [ ] **ICP scorer** unit-tested against 10 hand-graded historical leads.
- [ ] **SDR routing rules** in CRM: ≥60 → 24h SLA queue; 30-59 → nurture seq; <30 → drop.
- [ ] **Account-level shared negative list** applied to all campaigns (verify in Editor: Shared Library → Negative Keyword Lists).

## Smoke test (run before unpausing)

1. From a clean browser (incognito + VPN to home country), Google search a brand-defense keyword that triggers your ad.
2. Click the ad. Verify:
   - URL has `?gclid=...` appended.
   - LP loads correctly, no 404, no JS errors, demo CTA visible above the fold.
   - Submit the form with test data (email: `test+gads_smoke_2026MMDD@yourcompany.com`).
3. Within 60 seconds, verify:
   - Form data lands in CRM with gclid populated.
   - Apollo enrichment webhook fires and writes firmographic fields.
   - ICP scorer ran (score field populated).
   - Routing fired: SDR queue notification OR nurture sequence enrolled.
4. Within 24 hours, verify:
   - Google Ads Conversions tab shows the test conversion (after enhanced-conversion upload).

If any step fails, do NOT unpause campaigns. Fix the funnel first.

## Weekly cadence (post-launch)

| Day | Task |
|---|---|
| Mon | Search Term Report → add 5-10 negatives |
| Mon | Customer Match list refresh (upload new ≥30-score emails) |
| Tue | Quality Score scan → flag any keyword <5/10 |
| Wed | Bid review per ad group (raise winners, lower losers) |
| Thu | LP A/B variant review (if running) |
| Fri | Demo pipeline → CRM stage update → confirm offline conversions uploaded |

## Monthly cadence

- **Day 1:** Performance review with leadership. Compare to boss SEMrush dashboard.
- **Day 5:** Failure-threshold check (see `references/retargeting_workflow.md` early-warning watchlist).
- **Day 10:** Phase ramp decision (Phase 1 → 2 → 3) based on prior month's data.
- **Day 15:** Lookalike audience eligibility check (Customer Match seed ≥500?).
- **Day 25:** Budget realloc proposal for next month based on Cost-per-Demo by campaign.

## Reporting templates

Build these dashboards (Looker Studio / GA4 / HubSpot):

1. **Funnel by Campaign** — Impressions → Clicks → LP visits → Form submits → Demo booked → Opp → Closed-won. Per-campaign and overall.
2. **Cost per MQL** by campaign by week. Watch trend line.
3. **Search Term Quality** — top 50 search terms by spend, manually graded relevant/irrelevant. Goal: >85% relevant.
4. **Boss Dashboard Mirror** — for each tracked SEMrush keyword: organic rank, paid rank, paid spend last 30d, paid clicks, paid conversions. Ensures leadership sees ad impact alongside organic visibility.
5. **Multi-Touch Attribution** — assisted conversions + time-to-conversion. Re-evaluate ToFu/MoFu campaign value monthly.

## Failure thresholds → response

| Threshold | Response |
|---|---|
| Week 2: SearchTerm relevance <60% | Pause campaign. Add negatives. Re-launch. |
| Week 4: Avg QS <5 | LP-keyword audit. May need new LP. |
| Week 4: Avg CPC > bid × 1.4 | Likely Broad-match leak (shouldn't happen here) OR competitor bid war. Lower bids 20%. |
| Week 4: Form submit <0.5% on BoFu | LP CTA broken / form too long / slow load. Fix funnel. |
| Week 8: Cost-per-MQL >$1,500 AND ICP match <30% | Targeting wrong. Revisit keyword set. |
| Week 8: Cost-per-Demo >$3,000 (B2B SaaS reality range) | Bid review; consider pausing weakest ad group. |
