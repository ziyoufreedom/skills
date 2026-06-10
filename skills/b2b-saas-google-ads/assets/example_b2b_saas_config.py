"""Generic example config for the b2b-saas-google-ads skill.

Demonstrates every entity type with a fictional product 'Acme MCP Platform'.
Copy and modify for your real product. See references/config_schema.md for the
full schema.
"""

config = {
    "account": {
        "languages": ["English"],
        "geo_targeting": ["United States", "Canada", "United Kingdom", "Australia"],
        # Tracking template goes in Google Ads UI at account level, not in the CSV.
    },

    # Account-level shared negatives. Generator replicates these into every campaign.
    # See references/b2b_negatives.md for the universal B2B SaaS list to copy from.
    "shared_negatives": [
        ("free", "Exact"),
        ("jobs", "Exact"),
        ("training", "Exact"),
        ("course", "Exact"),
        ("salary", "Exact"),
        ("aws consulting", "Phrase"),
        ("managed services", "Phrase"),
        ("implementation services", "Phrase"),
    ],

    "sitelinks": [
        {"text": "Schedule a Demo",
         "description_1": "30-min walkthrough",
         "description_2": "See it on your data",
         "final_url": "https://acme.com/demo"},
        {"text": "Documentation",
         "description_1": "Quickstart in 5 minutes",
         "description_2": "Self-host or cloud",
         "final_url": "https://acme.com/docs"},
        {"text": "Compare vs Competitor",
         "description_1": "Side-by-side scorecard",
         "description_2": "Cited 3rd-party data",
         "final_url": "https://acme.com/compare"},
    ],

    "callouts": [
        "Apache 2.0 Licensed",
        "AWS Marketplace Listed",
        "Self-Host or Cloud",
        "Multi-LLM Support",
        "OAuth + RBAC + Audit",
    ],

    "structured_snippets": [
        {"header": "Services",
         "values": ["MCP Gateway", "Agent Registry", "Multi-LLM Chat"]},
    ],

    "campaigns": [
        {
            "name": "C1_BoFu_Brand_Defense",
            "campaign_type": "Search",
            "status": "Paused",
            "daily_budget": 10.00,
            "bid_strategy": "Manual CPC",
            "networks": "Google search",
            "ad_groups": [
                {
                    "name": "Brand_Core",
                    "default_max_cpc": 2.00,
                    "final_url": "https://acme.com/",
                    "intent": "BoFu",
                    "keywords": [
                        ("acme mcp platform", "Phrase", 2.00),
                        ("acme platform", "Exact", 2.00),
                    ],
                    "rsa": {
                        "headlines": [
                            "Acme MCP Platform Official",
                            "Open Source MCP Gateway",
                            "Self-Host Today",
                            "Multi-LLM Support",
                            "Available on AWS Marketplace",
                            "By AWS Advanced Partner",
                            "Schedule a Demo",
                            "Apache 2.0 Licensed",
                        ],
                        "descriptions": [
                            "Official Acme site. Open-source MCP gateway. Apache 2.0.",
                            "Multi-LLM. Self-host or cloud. Available on AWS Marketplace.",
                            "Schedule a 30-minute demo with the Acme team.",
                        ],
                        "path_1": "acme",
                        "path_2": "official",
                    },
                },
            ],
        },
    ],
}
