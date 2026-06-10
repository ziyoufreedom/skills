# Keyword Taxonomy + LP Routing

Every B2B SaaS keyword classifies into one of three funnel stages. The stage determines (a) Match Type, (b) Final URL, (c) bid envelope, (d) RSA tone, and (e) success metric.

## ToFu — Top of Funnel (Education / Research)

**Intent signal:** "what is", "how to", "vs RAG", "framework", "guide", concept words, glossary-style.

**Examples (from Jarvis tracked list):**
- `mcp vs rag`
- `what is an ai gateway`
- `agentic ai governance`
- `agentic ai orchestration`
- `agent squad`
- `aws agent squad`
- `mcp registry` (when low CPC)

**Match Type:** Phrase (sometimes Exact for cheap precision).

**Final URL:** Editorial / content hub (e.g., `exploreagentic.ai/mcp/`). Editorial pages typically don't have demo CTAs — that's OK for ToFu. The success metric here is **engagement → email capture → retargeting audience**, NOT direct demo bookings.

**Bid envelope:** $1–$5. Cheap keywords. If CPC is cheap relative to CPC for BoFu, ToFu is high ROI for retargeting seed.

**RSA tone:** Educational, authoritative. Lead with "Field guide to X", "Learn how X works", "Practitioner research on X". Avoid "Schedule a demo" as primary headline (it's pushy when intent is research).

**Success metric:** Click-through to editorial → time on page > 60s → email capture (newsletter / playbook download). Direct demo conversions are bonus, not target.

---

## MoFu — Middle of Funnel (Comparison / Evaluation)

**Intent signal:** "vs", "compare", "alternative to {competitor}", category leader names.

**Examples:**
- `jarvis vs moveworks`
- `jarvis vs glean`
- `jarvis vs copilot studio`
- `moveworks vs glean`
- `mcp gateway` (Phrase — buyer is evaluating gateway options)
- `agent gateway`

**Match Type:** Exact for `{brand} vs {brand}` pairs. Phrase for generic category words (`mcp gateway`, `agent gateway`).

**Final URL:** Comparison page (e.g., `exploreagentic.ai/comparisons/jarvis-vs-{competitor}/`). **Comparison pages MUST have a demo CTA** — sticky bar, in-content CTA, or floating button. If they don't, either:
1. CTO adds CTA before launch (1-2 weeks)
2. Re-route MoFu to product page (lower QS but functional CVR)

**Bid envelope:** $5–$15. Some `{competitor} pricing` keywords go higher ($20–$25) because they're effectively BoFu in disguise.

**RSA tone:** Direct comparison. Lead with "{Product} vs {Competitor}", "{Competitor} Alternative", "Open Source {Competitor} Alternative". Always include "Schedule a Demo" as one of the 15 headlines.

**Success metric:** Demo booked OR Marketplace listing visited within 7 days.

---

## BoFu — Bottom of Funnel (Purchase Intent)

**Intent signal:** Specific competitor + pricing/demo, brand defense, "buy", "free trial".

**Examples:**
- `moveworks demo`
- `moveworks pricing`
- `glean alternative`
- `glean pricing`
- `jarvis chat`
- `jarvis registry`
- `jarvis mcp gateway`

**Match Type:** Exact (these are precision strikes). Phrase only for the brand-name singular (e.g., `jarvis chat` Phrase to catch `jarvis ai chat`, `jarvis chat for enterprise`, etc.).

**Final URL:** Product page with demo CTA (e.g., `ascendingdc.com/jarvis-ai/`, `ascendingdc.com/jarvis-ai/jarvis-registry/`). Brand-defense keywords land on the most specific product subpage available. **Never route BoFu to editorial.**

**Bid envelope:** $2–$25. Brand defense is cheap ($1–$3); competitor pricing is expensive ($15–$25).

**RSA tone:** Direct CTA. Lead with "Schedule a Demo", "Open Source {Competitor} Alternative", "Multi-LLM AI Gateway", "Available on AWS Marketplace". Conversion-focused, not educational.

**Success metric:** Demo booked. Direct attribution. This is where Customer Match retargeting starts paying off — re-engage MoFu visitors who didn't convert with BoFu retargeting ads.

---

## Boss-tracked dashboard alignment

When a SEMrush position-tracking export exists:

- **Campaign keywords ≥80% from the tracked list.** Otherwise leadership can't see ad impact.
- Boss-tracked keywords NOT currently ranking are **first priority for ad coverage** — they're the explicit demand signal.
- Boss-tracked keywords WITH brand-defense rankings (pos 1-3) still go in the brand-defense campaign — defend share even if organic owns it (paid + organic together get 25% more clicks than organic alone, per Google's published research).
- Long-tail keywords outside the tracked list need explicit justification (high commercial intent + clear LP) to make Phase 1.

## Match Type matrix

| Keyword shape | Match Type | Reason |
|---|---|---|
| Single brand word (`jarvis`) | NEVER bid | Too polluted unless very tight Exact |
| `{brand}` (your product) | Phrase | Catches "jarvis chat", "jarvis ai", etc. |
| `{competitor}` alone | Skip | Too broad; do `{competitor} pricing/demo/alternative` instead |
| `{competitor} {modifier}` | Exact | Precision — pricing/demo are high-intent |
| `{brand} vs {competitor}` | Exact | Boss tracks these; Exact = cheap + intent-pure |
| `{category} {modifier}` (`mcp gateway`) | Phrase | Catches `mcp gateway aws`, `enterprise mcp gateway`, etc. |
| `{long-tail concept}` (`mcp vs rag`) | Phrase | Catches concept variations |
| `what is X` | Phrase | Educational; volume varies |
| Anything Broad | **REJECT** | B2B SaaS Broad pulls jobs/training/career trash |
