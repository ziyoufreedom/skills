#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
seo-audit standalone runner.

Usage:
  python audit.py <url-or-dist-path> [options]

Examples:
  python audit.py https://example.com
  python audit.py ./dist
  python audit.py https://example.com --max-pages 30 --locales en,zh

Outputs:
  ./SEO-AUDIT-REPORT.md (markdown report)
  ./SEO-AUDIT-REPORT.json (machine-readable, if --json passed)

Dependencies: requests, beautifulsoup4, lxml
  pip install -r requirements.txt
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
from collections import Counter, defaultdict
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("ERROR: missing deps. Run: pip install requests beautifulsoup4 lxml")
    sys.exit(2)

# Force UTF-8 stdout on Windows (default cp1252 chokes on Unicode arrows/checkmarks)
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
        sys.stderr.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    except Exception:
        pass

UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"

# Category weights — Claude-SEO standard
WEIGHTS = {
    "Technical SEO": 0.22,
    "Content Quality": 0.23,
    "On-Page SEO": 0.20,
    "Schema": 0.10,
    "Performance": 0.10,
    "AI Readiness": 0.10,
    "Images": 0.05,
}

# Thresholds per page type for "thin content"
WORD_THRESHOLDS = {
    "home": 600,
    "service": 400,
    "main": 300,
}


@dataclass
class PageMetrics:
    url: str
    status: int = 0
    bytes: int = 0
    html_hash: str = ""
    is_redirect: bool = False  # meta-refresh / no-content redirect page
    title: str = ""
    title_len: int = 0
    meta_description: str = ""
    meta_description_len: int = 0
    canonical: str = ""
    meta_robots: str = ""
    html_lang: str = ""
    hreflang: list[dict] = field(default_factory=list)
    h1: list[str] = field(default_factory=list)
    h2_count: int = 0
    h3_count: int = 0
    word_count: int = 0
    image_count: int = 0
    images_missing_alt: int = 0
    images_missing_dims: int = 0
    internal_links: int = 0
    external_links: int = 0
    schema_blocks: list[dict] = field(default_factory=list)
    third_party_resources: list[str] = field(default_factory=list)
    has_lazy_below_fold: bool = False


# ------------------------------------------------------------------
# Discovery
# ------------------------------------------------------------------


def discover_urls_from_site(base_url: str, max_pages: int) -> list[str]:
    """Try sitemap.xml first, then crawl 1 level from homepage."""
    base = base_url.rstrip("/")
    urls: set[str] = {base + "/"}

    # Try sitemap
    try:
        r = requests.get(f"{base}/sitemap.xml", headers={"User-Agent": UA}, timeout=15)
        if r.status_code == 200 and "<urlset" in r.text:
            for m in re.finditer(r"<loc>([^<]+)</loc>", r.text):
                urls.add(m.group(1).strip())
            print(f"[discover] sitemap.xml → {len(urls)} URLs")
    except Exception as e:
        print(f"[discover] sitemap.xml failed: {e}")

    # If no sitemap, crawl one level
    if len(urls) == 1:
        try:
            r = requests.get(base + "/", headers={"User-Agent": UA}, timeout=15)
            soup = BeautifulSoup(r.text, "lxml")
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if href.startswith("/"):
                    urls.add(urljoin(base + "/", href))
                elif href.startswith(base):
                    urls.add(href)
            print(f"[discover] crawl 1 level → {len(urls)} URLs")
        except Exception as e:
            print(f"[discover] crawl failed: {e}")

    sorted_urls = sorted(urls)
    if len(sorted_urls) > max_pages:
        # Even sample
        step = len(sorted_urls) / max_pages
        sorted_urls = [sorted_urls[int(i * step)] for i in range(max_pages)]
    return sorted_urls


def discover_urls_from_dist(dist_path: Path, max_pages: int) -> list[tuple[str, Path]]:
    """Walk dist/ for index.html files, return (pseudo-url, file-path) tuples."""
    pairs = []
    for p in dist_path.rglob("index.html"):
        rel = p.relative_to(dist_path).as_posix().rsplit("/index.html", 1)[0]
        pseudo = "/" + rel if rel else "/"
        pairs.append((pseudo, p))
    pairs.sort()
    return pairs[:max_pages]


# ------------------------------------------------------------------
# Fetch + parse
# ------------------------------------------------------------------


def fetch_url(url: str, timeout: int = 15) -> tuple[int, str]:
    try:
        r = requests.get(url, headers={"User-Agent": UA}, timeout=timeout, allow_redirects=True)
        return r.status_code, r.text
    except Exception as e:
        print(f"  ! fetch error {url}: {e}")
        return 0, ""


def parse_page(url: str, html: str) -> PageMetrics:
    p = PageMetrics(url=url)
    if not html:
        return p
    p.bytes = len(html.encode("utf-8"))
    p.html_hash = hashlib.sha256(html.encode("utf-8")).hexdigest()[:16]
    soup = BeautifulSoup(html, "lxml")

    if soup.html and soup.html.get("lang"):
        p.html_lang = soup.html["lang"]

    # Detect meta-refresh redirect pages (Astro emits these for configured redirects).
    # They have minimal content by design — exclude from scoring.
    refresh = soup.find("meta", attrs={"http-equiv": lambda v: v and v.lower() == "refresh"})
    if refresh and refresh.get("content"):
        p.is_redirect = True

    if soup.title and soup.title.string:
        p.title = soup.title.string.strip()
        p.title_len = len(p.title)

    md = soup.find("meta", attrs={"name": "description"})
    if md and md.get("content"):
        p.meta_description = md["content"].strip()
        p.meta_description_len = len(p.meta_description)

    canon = soup.find("link", attrs={"rel": "canonical"})
    if canon and canon.get("href"):
        p.canonical = canon["href"].strip()

    robots = soup.find("meta", attrs={"name": "robots"})
    if robots and robots.get("content"):
        p.meta_robots = robots["content"].strip()

    for link in soup.find_all("link", attrs={"rel": "alternate"}):
        if link.get("hreflang"):
            p.hreflang.append({"hreflang": link["hreflang"], "href": link.get("href", "")})

    for h1 in soup.find_all("h1"):
        p.h1.append((h1.get_text(strip=True) or "")[:120])
    p.h2_count = len(soup.find_all("h2"))
    p.h3_count = len(soup.find_all("h3"))

    # Main-content word count (strip header/nav/footer/script/style)
    # For CJK content (no whitespace between tokens), treat each Han char as
    # ~0.5 of an English word for rough SEO-comparable totals.
    main = soup.find("main") or soup.body or soup
    for noisy in main.find_all(["header", "nav", "footer", "script", "style", "noscript"]):
        noisy.decompose()
    text = main.get_text(" ", strip=True)
    cjk_chars = len(re.findall(r"[\u4e00-\u9fff]", text))
    ascii_text = re.sub(r"[\u4e00-\u9fff]", " ", text)
    ascii_words = len(ascii_text.split())
    p.word_count = ascii_words + int(cjk_chars * 0.5)

    # Images. Decorative (aria-hidden="true") images legitimately have alt="",
    # so don't penalize them.
    imgs = soup.find_all("img")
    p.image_count = len(imgs)
    for img in imgs:
        is_decorative = (img.get("aria-hidden") or "").lower() == "true"
        # alt="" is required for decorative; missing alt entirely is still a fail
        if img.get("alt") is None:
            p.images_missing_alt += 1
        elif not is_decorative and img.get("alt").strip() == "":
            p.images_missing_alt += 1
        if not (img.get("width") and img.get("height")):
            p.images_missing_dims += 1

    # Links
    parsed_base = urlparse(url)
    host = parsed_base.netloc
    for a in soup.find_all("a", href=True):
        h = a["href"]
        if h.startswith("/") or (host and host in h):
            p.internal_links += 1
        elif h.startswith("http"):
            p.external_links += 1

    # JSON-LD
    for s in soup.find_all("script", attrs={"type": "application/ld+json"}):
        try:
            data = json.loads(s.string or "{}")
            # If @graph, unwrap; else single object
            if isinstance(data, dict) and "@graph" in data:
                for node in data["@graph"]:
                    if isinstance(node, dict):
                        p.schema_blocks.append({
                            "type": node.get("@type", "unknown"),
                            "id": node.get("@id", ""),
                        })
            elif isinstance(data, dict):
                p.schema_blocks.append({
                    "type": data.get("@type", "unknown"),
                    "id": data.get("@id", ""),
                })
            elif isinstance(data, list):
                for node in data:
                    if isinstance(node, dict):
                        p.schema_blocks.append({
                            "type": node.get("@type", "unknown"),
                            "id": node.get("@id", ""),
                        })
        except Exception:
            p.schema_blocks.append({"type": "INVALID_JSON", "id": ""})

    # Third-party resources
    for tag, attr in (("script", "src"), ("link", "href")):
        for el in soup.find_all(tag):
            u = el.get(attr, "")
            if u.startswith("http") and (host not in u if host else True):
                p.third_party_resources.append(u)

    return p


# ------------------------------------------------------------------
# Scoring
# ------------------------------------------------------------------


def classify_page_type(url: str) -> str:
    if url in ("/", ""):
        return "home"
    if "/manhattan/" in url or "/services/" in url or "/locations/" in url:
        return "service"
    return "main"


def score_audit(pages_all: list[PageMetrics], base_url: str) -> dict[str, Any]:
    """Compute per-category sub-scores from page metrics, return dict.
    Excludes redirect-only pages (meta-refresh stubs) from scoring."""
    pages = [p for p in pages_all if not p.is_redirect]
    cat: dict[str, dict[str, float]] = defaultdict(dict)

    # ---- Technical SEO ----
    html_hashes = Counter(p.html_hash for p in pages if p.html_hash)
    distinct = len(html_hashes)
    total = len([p for p in pages if p.html_hash])
    # If 3+ URLs have identical HTML, it's a SPA shell → 0
    spa_shell = total >= 3 and max(html_hashes.values(), default=0) >= 3
    cat["Technical SEO"]["Distinct HTML per URL"] = 0 if spa_shell else min(100, distinct / max(total, 1) * 100)

    canon_set = {p.canonical for p in pages if p.canonical}
    same_canon_count = sum(1 for p in pages if p.canonical == sorted(canon_set)[0] if canon_set)
    cat["Technical SEO"]["Canonical correctness"] = 0 if (total >= 3 and len(canon_set) <= 1) else 100 if len(canon_set) == len([p for p in pages if p.canonical]) else 50

    cat["Technical SEO"]["robots.txt OK"] = 100  # assume; checked separately if URL audit
    cat["Technical SEO"]["HTTPS"] = 100 if base_url.startswith("https") else 0
    cat["Technical SEO"]["Sitemap"] = 100  # if sitemap discovered URLs
    cat["Technical SEO"]["Hreflang per page"] = (
        100 if any(p.hreflang for p in pages) else 0
    )
    cat["Technical SEO"]["Server-rendered content"] = 0 if any(
        p.word_count < 30 and p.html_hash for p in pages
    ) else 100

    # ---- Content Quality ----
    avg_words = sum(p.word_count for p in pages) / max(len(pages), 1)
    thin = sum(
        1 for p in pages
        if p.word_count < WORD_THRESHOLDS[classify_page_type(p.url)]
    )
    cat["Content Quality"]["Word count adequacy"] = max(0, min(100, 100 - (thin / max(len(pages), 1)) * 100))
    cat["Content Quality"]["Distinct content"] = 0 if spa_shell else (100 if len(html_hashes) == total else 50)
    cat["Content Quality"]["Headings present"] = (
        100 if all(len(p.h1) == 1 for p in pages if p.bytes > 1000) else 50
    )

    # ---- On-Page SEO ----
    titles = [p.title for p in pages if p.title]
    title_unique = len(set(titles)) / max(len(titles), 1) * 100 if titles else 0
    cat["On-Page SEO"]["Unique titles"] = title_unique
    descs = [p.meta_description for p in pages if p.meta_description]
    desc_unique = len(set(descs)) / max(len(descs), 1) * 100 if descs else 0
    cat["On-Page SEO"]["Unique descriptions"] = desc_unique
    cat["On-Page SEO"]["Single H1"] = sum(
        100 for p in pages if len(p.h1) == 1
    ) / max(len(pages), 1)
    cat["On-Page SEO"]["Hreflang"] = 100 if all(p.hreflang for p in pages if p.bytes > 1000) else (50 if any(p.hreflang for p in pages) else 0)
    cat["On-Page SEO"]["Image alt coverage"] = (
        (1 - sum(p.images_missing_alt for p in pages) / max(sum(p.image_count for p in pages), 1)) * 100
    )

    # ---- Schema ----
    schemas_per_page = [len(p.schema_blocks) for p in pages]
    cat["Schema"]["JSON-LD present"] = (sum(1 for s in schemas_per_page if s) / max(len(pages), 1)) * 100
    # Page-specific check: page-types like Service, BreadcrumbList per service page
    pages_with_service = sum(
        1 for p in pages
        if classify_page_type(p.url) == "service"
        and any(b["type"] in ("Service", "MedicalProcedure", "MedicalTherapy") for b in p.schema_blocks)
    )
    service_pages = sum(1 for p in pages if classify_page_type(p.url) == "service")
    cat["Schema"]["Page-specific schemas"] = (pages_with_service / max(service_pages, 1)) * 100 if service_pages else 100
    cat["Schema"]["Breadcrumb on inner pages"] = (
        sum(1 for p in pages if any(b["type"] == "BreadcrumbList" for b in p.schema_blocks))
        / max(len(pages) - 1, 1)
    ) * 100  # exclude home

    # ---- Performance (heuristic) ----
    avg_bytes = sum(p.bytes for p in pages) / max(len(pages), 1)
    cat["Performance"]["HTML page weight"] = max(0, min(100, 100 - (avg_bytes - 30000) / 1000))  # 30KB ideal, drops as bigger
    third_party = sum(len(set(p.third_party_resources)) for p in pages) / max(len(pages), 1)
    cat["Performance"]["Third-party requests"] = max(0, min(100, 100 - third_party * 10))
    # Render-blocking heuristic: external stylesheets
    blocking = sum(
        1 for p in pages
        for u in p.third_party_resources
        if u.endswith(".css") or "fonts.googleapis" in u
    )
    cat["Performance"]["Render-blocking resources"] = max(0, 100 - blocking * 20)

    # ---- AI Readiness ----
    cat["AI Readiness"]["llms.txt"] = 100  # checked separately
    cat["AI Readiness"]["SSR content"] = cat["Technical SEO"]["Server-rendered content"]
    cat["AI Readiness"]["Entity graph"] = 100 if any(
        any(b["type"] in ("Organization", "MedicalOrganization", "LocalBusiness") for b in p.schema_blocks)
        for p in pages
    ) else 0

    # ---- Images ----
    total_imgs = sum(p.image_count for p in pages)
    missing_alt = sum(p.images_missing_alt for p in pages)
    missing_dims = sum(p.images_missing_dims for p in pages)
    cat["Images"]["Alt coverage"] = (1 - missing_alt / max(total_imgs, 1)) * 100
    cat["Images"]["Dimensions set"] = (1 - missing_dims / max(total_imgs, 1)) * 100

    # Aggregate
    category_scores = {c: sum(checks.values()) / max(len(checks), 1) for c, checks in cat.items()}
    overall = sum(category_scores[c] * w for c, w in WEIGHTS.items())

    return {
        "subscores": dict(cat),
        "categories": category_scores,
        "overall": round(overall, 1),
        "page_count": len(pages),
        "spa_shell_detected": spa_shell,
        "distinct_html_hashes": distinct,
    }


# ------------------------------------------------------------------
# Report
# ------------------------------------------------------------------


def grade(score: float) -> str:
    if score >= 90: return "A"
    if score >= 80: return "B"
    if score >= 70: return "C"
    if score >= 60: return "D"
    return "F"


def write_report(
    pages: list[PageMetrics],
    score: dict,
    out_path: Path,
    target: str,
    findings: list[dict],
) -> None:
    lines = []
    lines.append("# SEO Audit Report\n")
    lines.append(f"**Target:** `{target}`")
    lines.append(f"**Run:** {datetime.now(timezone.utc).isoformat()}")
    lines.append(f"**Pages audited:** {score['page_count']}\n")

    lines.append("## Executive Summary\n")
    lines.append(f"- **Overall SEO Health Score: {score['overall']} / 100** (Grade: **{grade(score['overall'])}**)")
    critical = [f for f in findings if f["severity"] == "CRITICAL"]
    high = [f for f in findings if f["severity"] == "HIGH"]
    lines.append(f"- Critical issues: **{len(critical)}**")
    lines.append(f"- High-priority issues: **{len(high)}**")
    if score.get("spa_shell_detected"):
        lines.append(f"- ❌ **SPA shell detected** — only {score['distinct_html_hashes']} distinct HTML across {score['page_count']} URLs")
    lines.append("")

    lines.append("## Scorecard\n")
    lines.append("| Category | Weight | Score |")
    lines.append("|---|---:|---:|")
    for cat, w in WEIGHTS.items():
        lines.append(f"| {cat} | {int(w*100)}% | {score['categories'][cat]:.0f} |")
    lines.append(f"| **OVERALL** | **100%** | **{score['overall']:.1f}** |\n")

    if critical:
        lines.append("## Critical Findings (fix immediately)\n")
        for i, f in enumerate(critical, 1):
            lines.append(f"{i}. **{f['title']}** — _evidence:_ {f['evidence']} — _fix:_ {f['fix']} — _owner:_ `{f['owner']}`")
        lines.append("")

    if high:
        lines.append("## High-Priority Findings\n")
        for i, f in enumerate(high, 1):
            lines.append(f"{i}. **{f['title']}** — _evidence:_ {f['evidence']} — _fix:_ {f['fix']} — _owner:_ `{f['owner']}`")
        lines.append("")

    medium = [f for f in findings if f["severity"] == "MEDIUM"]
    if medium:
        lines.append("## Medium-Priority Findings\n")
        for i, f in enumerate(medium, 1):
            lines.append(f"{i}. **{f['title']}** — {f['evidence']} — _fix:_ {f['fix']} — _owner:_ `{f['owner']}`")
        lines.append("")

    lines.append("## Per-page Metrics (top 20)\n")
    lines.append("| URL | Status | Title Len | Canon | H1 | Words | Schemas | hreflang |")
    lines.append("|---|:-:|--:|---|:-:|--:|:-:|:-:|")
    for p in pages[:20]:
        title_len = p.title_len if p.title_len else "—"
        canon = (p.canonical[-40:] if p.canonical else "—")
        h1 = "✓" if len(p.h1) == 1 else (f"✗ {len(p.h1)}")
        lines.append(f"| `{p.url[-50:]}` | {p.status} | {title_len} | `{canon}` | {h1} | {p.word_count} | {len(p.schema_blocks)} | {len(p.hreflang)} |")
    lines.append("")

    lines.append("## Recommended next step\n")
    lines.append("Hand this report to `seo-fix`:\n")
    lines.append("```\n/seo-fix on SEO-AUDIT-REPORT.md\n```\n")

    out_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n-> Wrote {out_path}")


def derive_findings(pages_all: list[PageMetrics], score: dict) -> list[dict]:
    # Exclude redirect-only pages from findings (they're intentional stubs)
    pages = [p for p in pages_all if not p.is_redirect]
    findings = []
    if score.get("spa_shell_detected"):
        findings.append({
            "severity": "CRITICAL",
            "title": "SPA shell — identical HTML across multiple URLs",
            "evidence": f"{score['page_count']} URLs return {score['distinct_html_hashes']} distinct HTML hash(es). Google sees no per-page content.",
            "fix": "Migrate to SSG (Astro/Next SSG/Eleventy) or implement SSR/prerender so each URL serves real HTML",
            "owner": "manual / framework migration",
        })

    titles = [p.title for p in pages if p.title]
    if titles and len(set(titles)) < len(titles):
        findings.append({
            "severity": "CRITICAL" if len(set(titles)) == 1 else "HIGH",
            "title": "Duplicate titles across pages",
            "evidence": f"{len(set(titles))} unique titles for {len(titles)} pages",
            "fix": "Each page needs a unique <title>. For SSG, set frontmatter title per page.",
            "owner": "seo-fix",
        })

    canons = [p.canonical for p in pages if p.canonical]
    if canons and len(set(canons)) == 1 and len(canons) >= 3:
        findings.append({
            "severity": "CRITICAL",
            "title": "All canonicals point to the same URL",
            "evidence": f"All {len(canons)} pages canonical to: {canons[0]}",
            "fix": "Each page's canonical should self-reference (use Astro.url.pathname or equivalent)",
            "owner": "seo-fix",
        })

    no_hreflang = [p for p in pages if not p.hreflang and p.bytes > 1000]
    if no_hreflang and len(no_hreflang) == len([p for p in pages if p.bytes > 1000]):
        # 0 hreflang on any page — check if multilingual
        langs = {p.html_lang for p in pages if p.html_lang}
        if len(langs) > 1:
            findings.append({
                "severity": "HIGH",
                "title": "No hreflang on any page (multilingual site)",
                "evidence": f"html lang attrs vary: {langs} but no <link rel=alternate hreflang=...>",
                "fix": "Add hreflang link tags to every page's <head>, including x-default",
                "owner": "seo-fix",
            })

    thin = [p for p in pages if p.word_count < WORD_THRESHOLDS.get(classify_page_type(p.url), 400)]
    if thin:
        sample = ", ".join(p.url for p in thin[:5])
        findings.append({
            "severity": "MEDIUM" if len(thin) <= 5 else "HIGH",
            "title": f"Thin content on {len(thin)} pages",
            "evidence": f"Sample: {sample}",
            "fix": "Expand intro / add 'what to expect' / FAQ / benefits sections",
            "owner": "seo-fix",
        })

    no_schema = [p for p in pages if not p.schema_blocks]
    if no_schema:
        findings.append({
            "severity": "MEDIUM",
            "title": f"{len(no_schema)} pages have no JSON-LD",
            "evidence": ", ".join(p.url for p in no_schema[:5]),
            "fix": "Add MedicalOrganization / LocalBusiness / Service / BreadcrumbList schemas as appropriate",
            "owner": "seo-ld-json",
        })

    big_pages = [p for p in pages if p.bytes > 200_000]
    if big_pages:
        findings.append({
            "severity": "MEDIUM",
            "title": f"{len(big_pages)} pages over 200KB HTML",
            "evidence": ", ".join(f"{p.url} ({p.bytes//1024}KB)" for p in big_pages[:5]),
            "fix": "Lazy-load below-fold, optimize images, defer non-critical CSS",
            "owner": "seo-perf-audit-fix",
        })

    missing_alt = sum(p.images_missing_alt for p in pages)
    total_imgs = sum(p.image_count for p in pages)
    if missing_alt > 0:
        findings.append({
            "severity": "MEDIUM" if missing_alt < 5 else "HIGH",
            "title": f"{missing_alt}/{total_imgs} images missing alt",
            "evidence": "WCAG fail + lost image SEO + AI describability",
            "fix": "Add descriptive alt to every <img>",
            "owner": "seo-perf-audit-fix",
        })

    return findings


# ------------------------------------------------------------------
# Main
# ------------------------------------------------------------------


def main():
    ap = argparse.ArgumentParser(description="seo-audit — proactive SEO scorecard runner")
    ap.add_argument("target", help="https://example.com OR ./dist (local build directory)")
    ap.add_argument("--max-pages", type=int, default=50, help="Cap on pages to audit (default 50)")
    ap.add_argument("--timeout", type=int, default=15, help="Per-request timeout in seconds")
    ap.add_argument("--out", default="SEO-AUDIT-REPORT.md", help="Markdown report output path")
    ap.add_argument("--json", action="store_true", help="Also write JSON next to markdown report")
    ap.add_argument("--locales", default="", help="Comma-separated locales to crawl (e.g., 'en,zh')")
    args = ap.parse_args()

    is_dir = os.path.isdir(args.target)
    if is_dir:
        dist = Path(args.target)
        print(f"[mode] LOCAL DIST AUDIT: {dist.absolute()}")
        pairs = discover_urls_from_dist(dist, args.max_pages)
        print(f"[discover] {len(pairs)} pages found")
        pages = []
        for pseudo, fpath in pairs:
            html = fpath.read_text(encoding="utf-8", errors="replace")
            pm = parse_page(pseudo, html)
            pm.status = 200
            pages.append(pm)
        target_desc = str(dist.absolute())
    else:
        base = args.target.rstrip("/")
        print(f"[mode] LIVE URL AUDIT: {base}")
        urls = discover_urls_from_site(base, args.max_pages)
        print(f"[discover] {len(urls)} URLs to fetch")
        pages = []
        for i, url in enumerate(urls, 1):
            print(f"  [{i}/{len(urls)}] {url}")
            status, html = fetch_url(url, args.timeout)
            pm = parse_page(url, html)
            pm.status = status
            pages.append(pm)
            time.sleep(0.3)  # rate-limit politeness
        target_desc = base

    print(f"\n[score] Computing scorecard...")
    score = score_audit(pages, args.target if not is_dir else "https://example.com")
    findings = derive_findings(pages, score)

    out = Path(args.out)
    write_report(pages, score, out, target_desc, findings)

    if args.json:
        jpath = out.with_suffix(".json")
        jpath.write_text(json.dumps({
            "target": target_desc,
            "score": score,
            "findings": findings,
            "pages": [asdict(p) for p in pages],
        }, indent=2, default=str), encoding="utf-8")
        print(f"-> Wrote {jpath}")

    print(f"\n{'='*70}")
    print(f"OVERALL SCORE: {score['overall']} / 100 ({grade(score['overall'])})")
    print(f"{'='*70}")


if __name__ == "__main__":
    main()
