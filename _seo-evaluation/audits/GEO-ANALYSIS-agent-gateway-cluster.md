# GEO Analysis — `/agent-gateway/` cluster

**Skill used**: `claude-seo/skills/seo-geo` v1.9.9 (AgriciDaniel)
**Date**: 2026-05-20
**Pages audited**: 3 (hub + 2 spokes)
**Test environment**: dev server `localhost:4321` (mirrors production)

---

## Cluster GEO Readiness Score: **53/100** (cluster average)

| Page | Score | Verdict |
|---|---|---|
| `/agent-gateway/` (hub) | **50/100** | C — strong infra, weak passage citability |
| `/agent-gateway/agent-registry-vs-agent-gateway/` | **51/100** | C — same shape; one architecture image |
| `/agent-gateway/enterprise-idp-agentic-auth/` | **59/100** | C+ — best of the three (2 tables + 2 images) |

---

## Platform breakdown (extrapolated per skill methodology)

| Platform | Hub | Reg-vs-Gw | IdP article | Why |
|---|---|---|---|---|
| **Google AI Overviews** | 55 | 56 | 64 | Strong schema, but no tables on hub/registry-vs-gateway; AI Overviews cite tables/lists 156% more often |
| **ChatGPT search** | 40 | 42 | 50 | Wikipedia presence for ASCENDING / Jarvis AI = nil; ChatGPT's citation pool weights Wikipedia at 47.9% |
| **Perplexity** | 45 | 48 | 55 | Perplexity weights Reddit (46.7%) — no detectable Reddit presence for brand/topics |
| **Bing Copilot** | 55 | 56 | 62 | Bing index well-served by SSR + schema |

---

## 1. AI Crawler Access Status

✅ **All major AI crawlers allowed** (via wildcard `User-agent: *  Allow: /`).

| Crawler | Status |
|---|---|
| GPTBot (OpenAI) | ✅ Allow (wildcard) |
| OAI-SearchBot | ✅ Allow (wildcard) |
| ChatGPT-User | ✅ Allow (wildcard) |
| ClaudeBot (Anthropic) | ✅ Allow (wildcard) |
| PerplexityBot | ✅ Allow (wildcard) |
| anthropic-ai | ✅ Allow (wildcard) |
| Bytespider | ✅ Allow (wildcard) |
| cohere-ai | ✅ Allow (wildcard) |
| CCBot (training) | ✅ Allow (wildcard) |

⚠️ **Note**: No named-bot directives. Wildcard works today but if the project ever wants to selectively block training crawlers (CCBot, anthropic-ai) while keeping search crawlers (PerplexityBot, ClaudeBot), it'll need explicit blocks. Currently all-or-nothing.

---

## 2. llms.txt Status

🔴 **Broken — robots.txt references it but file returns 404.**

`robots.txt` contains:
```
# AI / LLM-readable index of this site:
# https://www.exploreagentic.ai/llms.txt
# Full content: https://www.exploreagentic.ai/llms-full.txt
```

But `GET /llms.txt → 404`. This is the **single most actionable finding** in this audit — a free GEO signal that the site advertises but doesn't deliver.

**Recommended `/llms.txt` template** (drop-in ready):

```markdown
# Explore Agentic — The Field Guide to Enterprise Agentic AI
> Independent, practitioner-led research on Agentic AI, Model Context Protocol (MCP), AI Governance, and Enterprise RAG. Published by ASCENDING Inc., the AWS Advanced Consulting Partner that builds Jarvis AI.

## Pillars
- [Agentic AI](https://www.exploreagentic.ai/agentic-ai/): Field guide to enterprise agent runtimes, agent washing, observability
- [Model Context Protocol](https://www.exploreagentic.ai/mcp/): MCP spec, OAuth 2.1 auth model, gateway category
- [AI Governance](https://www.exploreagentic.ai/ai-governance/): Policy templates, ISO 42001, CISO-ready playbooks
- [Enterprise RAG](https://www.exploreagentic.ai/enterprise-rag/): Pipelines, re-rankers, evals, agentic RAG

## Topic hubs
- [Agent Registry](https://www.exploreagentic.ai/agent-registry/): Catalog plane for enterprise agents
- [Agent Gateway](https://www.exploreagentic.ai/agent-gateway/): Data plane for enterprise agentic AI
- [MCP Gateway](https://www.exploreagentic.ai/mcp-gateway/): Vendor selection guide

## Key facts
- ASCENDING Inc. is an AWS Advanced Consulting Partner based in Fairfax, VA, founded 2018
- Jarvis AI is ASCENDING's MCP-native, multi-LLM, governance-first agent platform
- All comparison tables cite public documentation, vendor statements, and analyst commentary
```

(Also produce `llms-full.txt` with full article texts if the team wants the maximum GEO surface — but the index version above is the priority.)

---

## 3. Brand Mention Analysis

| Signal | Status | Note |
|---|---|---|
| Jarvis brand mentions in article body | ✅ 4–7 per page | Solid in-body density |
| ASCENDING brand mentions in body | 🔴 **0 per page** | Only in JSON-LD + footer disclosure; **not in editorial copy** |
| Author (Mehrdad Faqiri) in body | ⚠️ Only via byline component | Schema captures it; AI crawlers will read it |
| Wikipedia entry for ASCENDING | 🔴 None | High-impact GEO gap — ChatGPT weights Wikipedia 47.9% |
| Wikipedia entry for Jarvis AI | 🔴 None | Same |
| Reddit presence (brand + product) | 🔴 Unknown / none detected | Perplexity weights Reddit 46.7% |
| YouTube channel mentions | ⚠️ /videos/ page exists on site, but external YouTube footprint unclear | Skill cites YouTube correlation ~0.737 (strongest signal) |
| LinkedIn presence (authors) | ✅ Person schema has LinkedIn `sameAs` | Moderate signal — present |

**Verdict**: schema-level brand attribution is good. **Non-owned-platform presence is the cluster's biggest GEO weakness.** Wikipedia + Reddit + YouTube are weighted 3× more than backlinks for AI citation per the Ahrefs Dec 2025 study cited in the skill.

---

## 4. Passage-Level Citability

🔴 **Zero paragraphs across all 3 pages fall in the optimal 134–167 word citation zone.**

| Page | Paragraphs | Mean | Max | In 134–167 zone | In 100–200 zone |
|---|---|---|---|---|---|
| Hub | 19 | 40w | 83w | 0 | 0 |
| Reg-vs-Gw | 25 | 41w | 68w | 0 | 0 |
| IdP article | 39 | 49w | 104w | 0 | **1** |

**Definition pattern in first 60 words** (skill flags this as a strong signal):

| Page | First 60w opening | Has "X is..." definition? |
|---|---|---|
| Hub | "An agent gateway is the data plane of enterprise agent infrastructure..." | ✅ **YES** — clean definition |
| Reg-vs-Gw | "When enterprises in 2026 evaluate agent infrastructure, the most common confusion..." | ❌ Editorial framing |
| IdP article | "When your security team asks whether your AI agent platform is 'using proper OAuth'..." | ❌ Conversational framing |

**Verdict**: hub does the opener well; the two spokes start with editorial / conversational hooks that read well to humans but **do not give AI a clean quotable definition block in the first 60 words**.

---

## 5. Structural Readability

| Page | H1 | H2 | H3 | Tables | OL | UL | FAQ schema | Question-format H2 |
|---|---|---|---|---|---|---|---|---|
| Hub | 1 | 8 | 10 | **0** | 4 | 6 | ✅ | 0 |
| Reg-vs-Gw | 1 | 9 | 8 | **0** | 6 | 5 | ✅ | 0 |
| IdP article | 1 | 11 | 8 | **2** | 7 | 5 | ✅ | 0 |

**Strengths**:
- Clean H1 → H2 → H3 hierarchy across all 3 (no skipping levels)
- Lists are abundant (4–7 ordered, 5–6 unordered per page)
- FAQ schema with question-format Q&As at the bottom of every page (high AI extraction value)

**Weaknesses**:
- 🔴 **Hub has zero tables**. Hub is a definitional page — a table comparing "Registry vs Gateway vs API Gateway" would be high-value
- 🔴 **Registry-vs-Gateway article has zero tables**. The whole article IS a comparison! A side-by-side matrix is missing
- 🟡 **All H2s in article body are statement-format**, not question-format. The skill notes question-format headings boost extraction because they match query patterns. Headings like "What an agent gateway has to enforce" could become "What does an agent gateway enforce?"

---

## 6. Multi-Modal Content (15% weight)

| Page | Images in `<article>` | Videos | Tables | Charts/diagrams |
|---|---|---|---|---|
| Hub | 🔴 **0** | 0 | 0 | 0 |
| Reg-vs-Gw | ✅ 1 (registry-vs-gateway-architecture) | 0 | 0 | 1 (the architecture diagram) |
| IdP article | ✅ **2** (AEL placement + MCP discovery sequence) | 0 | 2 | 2 |

The hub page has **no visual content at all** in its body. Skill data: multi-modal content sees 156% higher AI Overview selection. The two spokes are better; the hub is the weakest link.

---

## 7. Server-Side Rendering Check

✅ **Pure SSR** — zero `astro-island`, `client:*`, or hydration markers in article body.

Astro 4 builds static HTML at build time. All article content is in the initial HTML response, fully visible to AI crawlers that don't execute JavaScript. **This is one of the cluster's strongest GEO assets** — no change needed.

---

## 8. Authority & Brand Signals

| Page | Person schema | Date published | Date updated | External primary-source citations |
|---|---|---|---|---|
| Hub | ✅ | ✅ 2026-05-08 | ✅ May 8, 2026 | 🔴 **0** |
| Reg-vs-Gw | ✅ | ✅ 2026-05-05 | ✅ May 8, 2026 | 🔴 **0** |
| IdP article | ✅ | ✅ 2026-05-19 | ✅ May 20, 2026 | 🔴 **0** |

🔴 **Zero external citations to primary sources across all 3 pages.** The IdP article explicitly references RFC 7591, RFC 9728, RFC 7636, RFC 8628, RFC 8693, and MCP spec version 2025-11-05 — **all by number, none with links**. This is the second-most-actionable finding. The article's References table (in the source MD) was lost during the structured-content conversion to `ContentSection[]`.

---

## 9. Technical Accessibility (Schema)

✅ All 3 pages have:
- `Article` schema with author, datePublished, dateModified
- `Person` schema with LinkedIn `sameAs`
- `FAQPage` schema
- `BreadcrumbList` schema
- Hub has additional `ItemList` schema for resources

🔴 **Missing**:
- No `WebSite` or `Organization` schema visible per page (may exist site-wide via head)
- No `CreativeWork.citation` on the Article — schema.org supports linking citations as structured data
- No `mentions` array binding to external entities (Wikidata IDs for OAuth, RFCs, IdP vendors)

---

## TOP 5 HIGHEST-IMPACT CHANGES

### 🥇 #1 — Write `/public/llms.txt` (10 min)
robots.txt already advertises this file but it 404s. Write the file (template provided in Section 2). Drop-in static file. Zero risk. Unblocks the AI-readable index pattern that the skill prioritizes.

### 🥈 #2 — Add inline IETF citation links to the IdP article (15 min)
In `page-content.ts` for `/agent-gateway/enterprise-idp-agentic-auth/`, every RFC number mentioned should link to its spec:
- `RFC 7591` → `https://www.rfc-editor.org/rfc/rfc7591`
- `RFC 9728` → `https://www.rfc-editor.org/rfc/rfc9728`
- (Same for 7636, 8628, 8693, 7662, MCP spec)

The article in the source MD had a References table; bring it back as a final section. The skill weights "claims attributed with specific sources" heavily for citability.

### 🥉 #3 — Add a comparison table to the hub (`/agent-gateway/`) (30 min)
Hub has 0 tables. Add one comparing **Agent Gateway vs Agent Registry vs API Gateway vs MCP Gateway**. Columns: Identity propagation / Tool-level observability / Version-aware schema / Per-call audit record. The skill cites 156% higher Google AI Overview selection for content with comparison tables.

### #4 — Add a "What problem each plane solves" table to registry-vs-gateway article (20 min)
That article is a direct comparison piece with **zero tables**. Add a side-by-side: question type / who answers it / what the audit record contains / what fails when missing. Easy structured-content win.

### #5 — Pad 1–2 paragraphs per page into the 134–167w optimal zone (45 min total)
Pick the most quotable paragraph on each page — the definition paragraph or a key-finding paragraph — and expand to 140–160 words. This gives AI engines a clean self-contained quote block. Don't bloat every paragraph; **3–4 strategically sized passages per article is the target**, not wholesale rewriting.

---

## Schema Recommendations

1. **Add `citation` array to Article schema** for the IdP piece — list IETF RFCs and the MCP spec as `CreativeWork` items with URLs. This is the structured-data equivalent of recommendation #2 and gives Gemini / ChatGPT additional confidence in the article's source pedigree.
2. **Add `mentions` array** linking key entities (RFC numbers, OAuth, Microsoft Entra, Okta, AWS Cognito, Anthropic MCP) to their Wikidata IDs where available. Strengthens entity recognition for Knowledge Graph.
3. **Consider `HowTo` schema** for the "Five questions for evaluating an AEL" section in the IdP article — it's a structured procedure and matches the schema shape exactly.

---

## Content Reformatting Suggestions

### `/agent-gateway/` (hub)
- **Expand the opening definition** from 82 → ~150 words. Current: "An agent gateway is the data plane of enterprise agent infrastructure: the inline component...". Add 2–3 concrete sentences after "should this invocation actually run right now?" — e.g., what happens when there's no gateway (sprawling per-agent IAM glue), what the alternative looks like (manual reconciliation across agent runtimes).
- **Add a comparison table** (see #3 above).
- **Add at least one diagram** — the hub is the visual entry point to the cluster but has zero images.

### `/agent-gateway/agent-registry-vs-agent-gateway/`
- **Reframe opening 60 words** with an "X is Y; gateway is Z" definition couplet, not the editorial hook. Move "When enterprises in 2026 evaluate..." to paragraph 2.
- **Add the cmp matrix** as a real `<table>` instead of two narrative sections.
- **Rephrase one H2** from statement to question — "Where the two planes must share state" → "Where do the registry and gateway planes have to share state?".

### `/agent-gateway/enterprise-idp-agentic-auth/`
- **Restore the References table** from the source MD (was dropped in the ContentSection conversion). Each RFC entry should be a row with: RFC number / title / link / what it solves for agents.
- **Rephrase 2–3 H2s as questions** — "How enterprise IdPs compare" → "How do enterprise IdPs compare on the six RFCs?"; "Five questions for evaluating an AEL" → already question-shaped, fine.
- **Pad the "Failure modes" numberedList descriptions** — currently 90–100 words each; pushing to 134–160 gives each one a quotable self-contained block.

---

## What's good (don't change)

- ✅ Pure SSR — AI crawlers see everything
- ✅ All AI crawlers allowed in robots.txt
- ✅ Full schema suite (Article + Person + FAQPage + BreadcrumbList + ItemList where relevant)
- ✅ Author byline with LinkedIn `sameAs` propagated through schema
- ✅ Update dates current
- ✅ FAQ schema present on every page (high AI extraction value)
- ✅ Headings hierarchy clean (no level-skipping)
- ✅ List density healthy (4–7 OL + 5–6 UL per page)

---

## Limitations of this audit

- No live SERP data — couldn't verify what's actually ranking for "agent gateway" or "enterprise IdP agentic auth" today. The `seo-geo` skill flags this as optional via DataForSEO integration; not configured here.
- Brand mention presence on Wikipedia / Reddit / YouTube was checked qualitatively (no entries found), not via dedicated mention-tracking APIs.
- Citability passage-length threshold (134–167 words) is from "industry data" cited in the skill — directionally sound but not gospel. The pattern matters more than the exact number.
- No live AI engine citation check (didn't query ChatGPT / Perplexity / Google AIO for "agent gateway" to see if our pages appear). That requires the DataForSEO `ai_optimization_chat_gpt_scraper` integration.
