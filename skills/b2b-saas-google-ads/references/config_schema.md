# Config Schema

The generator (`scripts/build_master_csv.py`) takes a Python dict matching this schema. See `assets/example_b2b_saas_config.py` for a complete working example.

```python
config = {
    # ── Account-level ─────────────────────────────────────────
    "account": {
        "languages": ["English"],
        "geo_targeting": ["United States", "Canada", "United Kingdom", "Australia"],
        "tracking_template": "{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={_campaign}&utm_content={adgroupid}&utm_term={keyword}&gclid={gclid}",
    },

    # ── Account-level shared negatives ─────────────────────────
    # List of (keyword, match_type) tuples; match_type ∈ {"Phrase", "Exact"}.
    # Generator auto-replicates these into every campaign as "Negative phrase" / "Negative exact" rows.
    "shared_negatives": [
        ("marvel", "Phrase"),
        ("aws consulting", "Phrase"),
        # ... see references/b2b_negatives.md for the universal B2B list
    ],

    # ── Account-level shared assets (apply to all campaigns) ───
    # NOTE: per-campaign sitelinks override account-level. If a campaign defines
    # its own `sitelinks` list, that REPLACES the account-level set for that
    # campaign (no merging). Use per-campaign sitelinks when each campaign has a
    # distinct theme — e.g., MCP campaign sitelinks to MCP-themed pages, Compare
    # campaign sitelinks to /comparisons/ pages. Use account-level when the
    # whole account has one product story.
    "sitelinks": [
        {
            "text": "Schedule a Demo",        # ≤25 chars
            "description_1": "Book a 30-min walkthrough",  # ≤35 chars
            "description_2": "See it on your data",        # ≤35 chars
            "final_url": "https://product.com/#demo",
        },
        # ... 7-9 more
    ],

    "callouts": [
        "Apache 2.0 Licensed",     # ≤25 chars each
        "Multi-LLM Support",
        # ... 7-9 more
    ],

    "structured_snippets": [
        {
            "header": "Services",   # canonical Google header (Services / Brands / Types / Featured / Insurance / etc.)
            "values": ["MCP Gateway", "Agent Registry", "Multi-LLM Chat"],  # ≤25 chars each, 3-10 values
        },
    ],

    # ── Campaigns ─────────────────────────────────────────────
    "campaigns": [
        {
            "name": "C3_MCP_Registry",
            "campaign_type": "Search",
            "status": "Paused",                 # ALWAYS launch Paused
            "daily_budget": 33.00,
            "bid_strategy": "Manual CPC",       # Phase 1: stick to Manual until winners emerge
            "networks": "Google search",        # canonical Editor value (NOT "Google Search Only")
            "ad_groups": [
                {
                    "name": "MCP_Gateway_Core",
                    "default_max_cpc": 5.00,
                    "final_url": "https://ascendingdc.com/jarvis-ai/jarvis-registry/",
                    "intent": "BoFu",           # ToFu | MoFu | BoFu — used by validator to assert LP fit
                    "keywords": [
                        # (keyword, match_type, max_cpc) — Final URL inherits ad-group default;
                        # use the dict form below if a specific keyword needs its own URL.
                        ("mcp gateway", "Phrase", 5.00),
                        ("enterprise mcp gateway", "Exact", 4.00),
                    ],
                    "rsa": {
                        "headlines": [   # 8-15 items, each ≤30 chars
                            "Open-Source MCP Gateway",
                            # ...
                        ],
                        "descriptions": [   # 2-4 items, each ≤90 chars
                            "Connect Cursor, Claude, Copilot to internal tools. Apache 2.0.",
                            # ...
                        ],
                        "path_1": "jarvis",   # ≤15 chars
                        "path_2": "registry", # ≤15 chars
                    },
                },
                # Keyword form with per-keyword override:
                # {
                #   "name": "Jarvis_Vs",
                #   "default_max_cpc": 5.00,
                #   "final_url": "https://exploreagentic.ai/comparisons/",  # fallback
                #   "intent": "MoFu",
                #   "keywords": [
                #     {"keyword": "jarvis vs moveworks", "match": "Exact", "cpc": 5.00,
                #      "final_url": "https://exploreagentic.ai/comparisons/jarvis-vs-moveworks/"},
                #   ],
                # ...
                # }
            ],
        },
        # ... more campaigns
    ],
}
```

## Field rules (validator enforces)

- `status` MUST be `"Paused"` for new campaigns. Validator fails on `"Enabled"` unless config sets `force_enabled=True` at account level (require explicit override).
- `bid_strategy` ∈ {`Manual CPC`, `Maximize clicks`, `Maximize conversions`, `Target CPA`, `Target ROAS`, `Target impression share`}.
- `networks` ∈ {`Google search`, `Google search; Search partners`, `Google search; Display Network`}.
- `match_type` ∈ {`Phrase`, `Exact`}. **`Broad` is rejected by the validator** in B2B SaaS context (see SKILL.md guardrail #2).
- `intent` ∈ {`ToFu`, `MoFu`, `BoFu`}. Validator cross-checks: BoFu ad groups should land on a URL containing `/jarvis-ai/`, `/product/`, `/pricing/`, or have a verified demo CTA via `web_fetch`. Editorial domains (e.g. `*.exploreagentic.ai`) for BoFu intent triggers a warning.
- Headline limits: 30 chars. Description: 90. Path 1/2: 15. Sitelink text: 25. Sitelink desc: 35. Callout: 25. Snippet value: 25.
- Negative match types in CSV become `Negative phrase` and `Negative exact` (generator handles the prefix).
- `EU political advertising = No` is auto-injected by the generator on every campaign row — do not put it in the config.
