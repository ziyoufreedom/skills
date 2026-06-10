"""Generate Google Ads Editor unified master CSV from a B2B SaaS config dict.

The output is ONE wide CSV with rows for every entity type (campaigns, ad
groups, keywords, negatives, RSAs, sitelinks, callouts, structured snippets).
Each row has only its own entity's columns filled; other columns are empty.
Editor matches rows by which columns are populated.

Usage:
    python build_master_csv.py <config.py> <output.csv>

The config module must define a top-level `config` dict matching the schema
in references/config_schema.md.
"""
import csv
import importlib.util
import sys
from pathlib import Path


HEADER = (
    [
        "Campaign", "Campaign type", "Status", "Daily budget", "Bid strategy type",
        "Networks", "Languages", "Locations",
        "Ad group", "Default max CPC",
        "Keyword", "Match type", "Max CPC", "Final URL",
        "Ad type",
    ]
    + [f"Headline {i}" for i in range(1, 16)]
    + [f"Description {i}" for i in range(1, 5)]
    + [
        "Path 1", "Path 2",
        # Sitelink: uses shared "Final URL" column above. Description columns
        # are named "Description Line 1/2" so they don't collide with RSA "Description 1-4".
        "Sitelink text", "Description Line 1", "Description Line 2",
        # Callout
        "Callout text",
        # Snippet: Header + 10 separate Value columns (Editor canonical format).
        "Snippet header",
    ]
    + [f"Value {i}" for i in range(1, 11)]
    + [
        # Asset-level language (sitelinks/callouts/snippets); defaults to English
        "Language",
        # Campaign-only
        "EU political advertising",
    ]
)


def _empty():
    return {k: "" for k in HEADER}


def _normalize_keyword(kw, ad_group_url):
    """Accept tuple (keyword, match, cpc) OR dict with optional final_url."""
    if isinstance(kw, dict):
        return (
            kw["keyword"],
            kw["match"],
            float(kw["cpc"]),
            kw.get("final_url", ad_group_url),
        )
    keyword, match, cpc = kw
    return (keyword, match, float(cpc), ad_group_url)


def build(config):
    rows = []
    account = config.get("account", {})
    languages = "; ".join(account.get("languages", ["English"]))

    # 1. Campaigns
    for c in config["campaigns"]:
        r = _empty()
        r["Campaign"] = c["name"]
        r["Campaign type"] = c.get("campaign_type", "Search")
        r["Status"] = c.get("status", "Paused")
        r["Daily budget"] = f"{c['daily_budget']:.2f}"
        r["Bid strategy type"] = c.get("bid_strategy", "Manual CPC")
        r["Networks"] = c.get("networks", "Google search")
        r["Languages"] = languages
        r["Locations"] = ";".join(account.get("geo_targeting", ["United States"]))
        r["EU political advertising"] = "No"
        rows.append(r)

    # 2. Ad groups
    for c in config["campaigns"]:
        for ag in c["ad_groups"]:
            r = _empty()
            r["Campaign"] = c["name"]
            r["Status"] = "Enabled"
            r["Ad group"] = ag["name"]
            r["Default max CPC"] = f"{ag['default_max_cpc']:.2f}"
            rows.append(r)

    # 3. Keywords (positive)
    for c in config["campaigns"]:
        for ag in c["ad_groups"]:
            for kw in ag.get("keywords", []):
                keyword, match, cpc, final_url = _normalize_keyword(kw, ag["final_url"])
                r = _empty()
                r["Campaign"] = c["name"]
                r["Status"] = "Enabled"
                r["Ad group"] = ag["name"]
                r["Keyword"] = keyword
                r["Match type"] = match
                r["Max CPC"] = f"{cpc:.2f}"
                r["Final URL"] = final_url
                rows.append(r)

    # 4. Shared negatives — replicated per campaign
    for c in config["campaigns"]:
        for kw, match in config.get("shared_negatives", []):
            r = _empty()
            r["Campaign"] = c["name"]
            r["Status"] = "Enabled"
            r["Keyword"] = kw
            r["Match type"] = f"Negative {match.lower()}"
            rows.append(r)

    # 5. RSA ads
    for c in config["campaigns"]:
        for ag in c["ad_groups"]:
            rsa = ag.get("rsa")
            if not rsa:
                continue
            r = _empty()
            r["Campaign"] = c["name"]
            r["Status"] = "Enabled"
            r["Ad group"] = ag["name"]
            r["Ad type"] = "Responsive search ad"
            r["Final URL"] = rsa.get("final_url", ag["final_url"])
            for i, h in enumerate(rsa["headlines"][:15], start=1):
                r[f"Headline {i}"] = h
            for i, d in enumerate(rsa["descriptions"][:4], start=1):
                r[f"Description {i}"] = d
            r["Path 1"] = rsa.get("path_1", "")
            r["Path 2"] = rsa.get("path_2", "")
            rows.append(r)

    # 6. Sitelinks — per-campaign override beats account-level fallback
    account_sitelinks = config.get("sitelinks", [])
    for c in config["campaigns"]:
        sitelinks = c.get("sitelinks", account_sitelinks)
        for sl in sitelinks:
            r = _empty()
            r["Campaign"] = c["name"]
            r["Status"] = "Enabled"
            r["Sitelink text"] = sl["text"]
            r["Description Line 1"] = sl.get("description_1", "")
            r["Description Line 2"] = sl.get("description_2", "")
            r["Final URL"] = sl["final_url"]
            r["Language"] = sl.get("language", "English")
            rows.append(r)

    # 7. Callouts
    for c in config["campaigns"]:
        for callout in config.get("callouts", []):
            r = _empty()
            r["Campaign"] = c["name"]
            r["Status"] = "Enabled"
            r["Callout text"] = callout
            r["Language"] = "English"
            rows.append(r)

    # 8. Structured snippets — values split into separate Value 1..N columns
    for c in config["campaigns"]:
        for snippet in config.get("structured_snippets", []):
            r = _empty()
            r["Campaign"] = c["name"]
            r["Status"] = "Enabled"
            r["Snippet header"] = snippet["header"]
            for i, v in enumerate(snippet["values"][:10], start=1):
                r[f"Value {i}"] = v
            r["Language"] = snippet.get("language", "English")
            rows.append(r)

    return rows


def write_csv(rows, out_path):
    with open(out_path, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=HEADER)
        w.writeheader()
        w.writerows(rows)


def load_config(config_path):
    spec = importlib.util.spec_from_file_location("b2b_config", config_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.config


def main():
    if len(sys.argv) != 3:
        print("Usage: python build_master_csv.py <config.py> <output.csv>")
        sys.exit(1)
    config = load_config(sys.argv[1])
    rows = build(config)
    write_csv(rows, sys.argv[2])

    counts = {"campaign": 0, "ad_group": 0, "keyword": 0, "negative": 0,
              "ad": 0, "sitelink": 0, "callout": 0, "snippet": 0}
    for r in rows:
        if r["Campaign type"]:
            counts["campaign"] += 1
        elif r["Ad type"]:
            counts["ad"] += 1
        elif r["Match type"].startswith("Negative"):
            counts["negative"] += 1
        elif r["Keyword"]:
            counts["keyword"] += 1
        elif r["Sitelink text"]:
            counts["sitelink"] += 1
        elif r["Callout text"]:
            counts["callout"] += 1
        elif r["Snippet header"]:
            counts["snippet"] += 1
        elif r["Ad group"] and r["Default max CPC"]:
            counts["ad_group"] += 1

    print(f"Wrote {len(rows)} rows to {sys.argv[2]}")
    for k, v in counts.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
