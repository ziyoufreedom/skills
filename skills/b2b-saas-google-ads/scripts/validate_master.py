"""Validate a B2B SaaS Google Ads master CSV for Editor compliance.

Run after build_master_csv.py. Exits non-zero on any error.

Checks:
- Headline ≤30, Description ≤90, Path ≤15
- Sitelink text ≤25, descriptions ≤35
- Callout ≤25
- Structured snippet values ≤25 each
- No duplicate keywords (campaign + ad group + keyword + match)
- No "Consulting Partner" / "Consulting Services" / "Professional Services"
- No Broad match type (Phrase + Exact only)
- EU political advertising = No on every campaign row
- Networks canonical
- Bid strategy canonical
- Status: campaigns Paused
- All Final URLs HTTPS

Usage: python validate_master.py <master.csv>
"""
import csv
import re
import sys
from collections import defaultdict


CANONICAL_BID = {
    "Manual CPC", "Maximize clicks", "Maximize conversions",
    "Target CPA", "Target ROAS", "Target impression share",
}
CANONICAL_NET_TOKENS = {"Google search", "Search partners", "Display Network"}
FORBIDDEN_AD_COPY = re.compile(
    r"\b("
    r"consulting partner|consulting services|professional services|"
    r"managed services|migration services|implementation services|"
    r"training available|expert implementation"
    r")\b",
    re.IGNORECASE,
)
ALLOWED_MATCH = {"Phrase", "Exact", "Negative phrase", "Negative exact"}


def main():
    if len(sys.argv) != 2:
        print("Usage: python validate_master.py <master.csv>")
        sys.exit(2)

    path = sys.argv[1]
    with open(path, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    errors = []
    warnings = []

    def err(line, msg):
        errors.append(f"L{line}: {msg}")

    def warn(line, msg):
        warnings.append(f"L{line}: {msg}")

    seen_keywords = defaultdict(int)
    rsa_rows = 0
    campaign_rows = 0

    for i, r in enumerate(rows, start=2):
        is_campaign = r["Campaign type"].strip() != ""
        is_ad = r["Ad type"].strip() != ""
        is_kw = r["Keyword"].strip() != ""
        is_neg = is_kw and r["Match type"].startswith("Negative")
        is_pos_kw = is_kw and not is_neg
        is_sitelink = r["Sitelink text"].strip() != ""
        is_callout = r["Callout text"].strip() != ""
        is_snippet = r["Snippet header"].strip() != ""

        if is_campaign:
            campaign_rows += 1
            if r["Status"].strip() != "Paused":
                err(i, f"Campaign {r['Campaign']} must launch as Paused, got '{r['Status']}'")
            if r["EU political advertising"].strip().lower() != "no":
                err(i, f"Campaign {r['Campaign']} missing 'EU political advertising = No'")
            if r["Bid strategy type"] not in CANONICAL_BID:
                err(i, f"Bid strategy '{r['Bid strategy type']}' not canonical")
            for tok in r["Networks"].split(";"):
                tok = tok.strip()
                if tok and tok not in CANONICAL_NET_TOKENS:
                    err(i, f"Networks token '{tok}' not canonical")

        if is_pos_kw:
            if r["Match type"] not in ("Phrase", "Exact"):
                err(i, f"Positive keyword '{r['Keyword']}' has non-Phrase/Exact match: {r['Match type']!r} (Broad is forbidden)")
            seen_keywords[(r["Campaign"], r["Ad group"], r["Keyword"], r["Match type"])] += 1
            if r["Final URL"] and not r["Final URL"].startswith("https://"):
                err(i, f"Keyword '{r['Keyword']}' Final URL not HTTPS: {r['Final URL']}")

        if is_neg:
            if r["Match type"] not in ("Negative phrase", "Negative exact"):
                err(i, f"Negative '{r['Keyword']}' invalid match: {r['Match type']!r}")

        if is_ad:
            rsa_rows += 1
            for h in range(1, 16):
                v = r[f"Headline {h}"]
                if v and len(v) > 30:
                    err(i, f"Headline {h} length {len(v)}>30: {v!r}")
                if v and FORBIDDEN_AD_COPY.search(v):
                    err(i, f"Headline {h} contains forbidden phrase: {v!r}")
            for d in range(1, 5):
                v = r[f"Description {d}"]
                if v and len(v) > 90:
                    err(i, f"Description {d} length {len(v)}>90: {v!r}")
                if v and FORBIDDEN_AD_COPY.search(v):
                    err(i, f"Description {d} contains forbidden phrase: {v!r}")
            if r["Path 1"] and len(r["Path 1"]) > 15:
                err(i, f"Path 1 length {len(r['Path 1'])}>15")
            if r["Path 2"] and len(r["Path 2"]) > 15:
                err(i, f"Path 2 length {len(r['Path 2'])}>15")
            non_empty_h = sum(1 for h in range(1, 16) if r[f"Headline {h}"])
            non_empty_d = sum(1 for d in range(1, 5) if r[f"Description {d}"])
            if non_empty_h < 3:
                err(i, f"RSA needs ≥3 headlines, got {non_empty_h}")
            if non_empty_d < 2:
                err(i, f"RSA needs ≥2 descriptions, got {non_empty_d}")
            if r["Final URL"] and not r["Final URL"].startswith("https://"):
                err(i, f"RSA Final URL not HTTPS: {r['Final URL']}")

        if is_sitelink:
            if len(r["Sitelink text"]) > 25:
                err(i, f"Sitelink text length {len(r['Sitelink text'])}>25: {r['Sitelink text']!r}")
            for k in ("Description Line 1", "Description Line 2"):
                if r[k] and len(r[k]) > 35:
                    err(i, f"{k} length {len(r[k])}>35: {r[k]!r}")
            if not r["Final URL"].startswith("https://"):
                err(i, f"Sitelink Final URL not HTTPS: {r['Final URL']}")

        if is_callout:
            if len(r["Callout text"]) > 25:
                err(i, f"Callout length {len(r['Callout text'])}>25: {r['Callout text']!r}")

        if is_snippet:
            value_count = 0
            for n in range(1, 11):
                v = r.get(f"Value {n}", "").strip()
                if v:
                    value_count += 1
                    if len(v) > 25:
                        err(i, f"Snippet Value {n} length {len(v)}>25: {v!r}")
            if value_count < 3:
                err(i, f"Snippet '{r['Snippet header']}' has only {value_count} values (Google requires ≥3)")

    for key, count in seen_keywords.items():
        if count > 1:
            errors.append(f"Duplicate positive keyword: {key} x{count}")

    print(f"=== Validate {path} ===")
    print(f"  Total rows: {len(rows)}")
    print(f"  Campaigns: {campaign_rows}")
    print(f"  RSA ads: {rsa_rows}")
    print(f"  Unique positive keywords: {len(seen_keywords)}")

    if warnings:
        print(f"\n--- Warnings ({len(warnings)}) ---")
        for w in warnings:
            print(" *", w)

    if errors:
        print(f"\n--- Errors ({len(errors)}) ---")
        for e in errors:
            print(" !", e)
        sys.exit(1)

    print("\nOK — no errors.")


if __name__ == "__main__":
    main()
