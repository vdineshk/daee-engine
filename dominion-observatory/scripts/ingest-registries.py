#!/usr/bin/env python3
"""
Dominion Observatory — High-Quality Registry Ingestion

Crawls MCP server registries with strict quality gates.
Only registers servers that pass quality filters.

Usage:
    python scripts/ingest-registries.py [--dry-run] [--source=all|npm|smithery|github|pypi]
"""

import sys
import json
import time
import re
import urllib.request
import urllib.parse
import urllib.error
from collections import Counter

OBSERVATORY_URL = "https://dominion-observatory.sgdata.workers.dev"
REGISTER_ENDPOINT = f"{OBSERVATORY_URL}/api/register"
USER_AGENT = "DominionObservatory/1.0 (trust-registry-crawler)"

args = sys.argv[1:]
DRY_RUN = "--dry-run" in args
source_flag = [a for a in args if a.startswith("--source=")]
SOURCE = source_flag[0].split("=")[1] if source_flag else "all"

# ─── Quality Gates ─────────────────────────────────────────────────

# Spam/junk patterns in package names
SPAM_NAME_PATTERNS = re.compile(r"""
    \b(test|testing|example|demo|sample|dummy|fake|mock|stub|
    my-first|hello[-_]?world|tutorial|playground|sandbox|
    homework|assignment|practice|exercise|experiment|
    temp|tmp|wip|draft|broken|deprecated|archived|
    xxx|asdf|qwer|foo[-_]?bar|baz|
    copy[-_]?of|clone[-_]?of|fork[-_]?of|
    untitled|unnamed|noname)\b
""", re.IGNORECASE | re.VERBOSE)

# Spam patterns in descriptions
SPAM_DESC_PATTERNS = re.compile(r"""
    \b(todo|work.in.progress|do.not.use|not.ready|
    placeholder|boilerplate.only|learning.project|
    just.a.test|ignore.this|proof.of.concept.only)\b
""", re.IGNORECASE | re.VERBOSE)

# Known spam publishers / low-quality patterns
SPAM_SCOPES = {"@test", "@example", "@fake", "@dummy", "@tmp"}

CATEGORY_PATTERNS = [
    ("search", r"\b(search|tavily|brave|exa|serper|firecrawl|crawl|scraper|jina|perplexity|kagi|duckduckgo|google.search|bing|web.search)\b"),
    ("code", r"\b(github|gitlab|code|developer|ide|lint|format|debug|compiler|vscode|neovim|typescript|python|javascript|sql|database|postgres|mysql|sqlite|redis|mongodb|prisma|supabase)\b"),
    ("communication", r"\b(slack|discord|email|gmail|outlook|teams|telegram|whatsapp|sms|twilio|sendgrid|notification|chat|message)\b"),
    ("data", r"\b(data|analytics|csv|json|xml|spreadsheet|excel|google.sheets|airtable|notion|obsidian|markdown|pdf|document|file)\b"),
    ("productivity", r"\b(calendar|todo|task|project|trello|asana|jira|linear|clickup|todoist|scheduling|meeting|zoom|time)\b"),
    ("finance", r"\b(finance|payment|stripe|crypto|bitcoin|ethereum|trading|stock|bank|invoice|accounting|currency|wallet)\b"),
    ("media", r"\b(image|video|audio|music|photo|youtube|spotify|podcast|media|generation|dall-e|midjourney|stable.diffusion|canvas|figma)\b"),
    ("weather", r"\b(weather|climate|forecast|temperature)\b"),
    ("transport", r"\b(map|location|gps|navigation|flight|travel|hotel|booking|transit|route)\b"),
    ("security", r"\b(security|auth|oauth|encryption|password|vulnerability|scan|threat|trust|compliance)\b"),
    ("education", r"\b(learn|education|course|tutorial|knowledge|wikipedia|arxiv|academic|research|paper)\b"),
    ("health", r"\b(health|medical|fitness|nutrition|mental|therapy)\b"),
]


def infer_category(name, desc):
    text = f"{name} {desc}".lower()
    for cat, pattern in CATEGORY_PATTERNS:
        if re.search(pattern, text):
            return cat
    return "other"


def is_quality_npm_package(obj):
    """Strict quality gate for npm packages."""
    pkg = obj.get("package", {})
    score = obj.get("score", {})
    search_score = obj.get("searchScore", 0)
    name = pkg.get("name", "")
    desc = pkg.get("description", "")
    version = pkg.get("version", "0.0.0")
    keywords = pkg.get("keywords", [])
    links = pkg.get("links", {})

    # REJECT: no name
    if not name:
        return False, "no name"

    # REJECT: spam name patterns
    if SPAM_NAME_PATTERNS.search(name):
        return False, f"spam name: {name}"

    # REJECT: spam scopes
    scope = name.split("/")[0] if "/" in name else ""
    if scope in SPAM_SCOPES:
        return False, f"spam scope: {scope}"

    # REJECT: no description or very short description
    if not desc or len(desc.strip()) < 15:
        return False, "no/short description"

    # REJECT: spam description
    if SPAM_DESC_PATTERNS.search(desc):
        return False, "spam description"

    # REJECT: version 0.0.0 or 0.0.1 with no repo (likely abandoned scaffolds)
    if version in ("0.0.0",) and not links.get("repository"):
        return False, "v0.0.0 no repo"

    # QUALITY SCORING
    quality_score = 0

    # Has a repository link (+3)
    if links.get("repository"):
        quality_score += 3

    # Has a homepage (+1)
    if links.get("homepage"):
        quality_score += 1

    # Has keywords (+1)
    if len(keywords) >= 2:
        quality_score += 1

    # Description quality: longer = better (+1 for 30+ chars, +2 for 80+)
    if len(desc) >= 80:
        quality_score += 2
    elif len(desc) >= 30:
        quality_score += 1

    # npm search/quality scores (from npm registry API)
    detail = score.get("detail", {})
    npm_quality = detail.get("quality", 0)
    npm_popularity = detail.get("popularity", 0)
    npm_maintenance = detail.get("maintenance", 0)

    # npm quality score > 0.3 (+2)
    if npm_quality > 0.3:
        quality_score += 2

    # npm popularity > 0.01 (+2) — even minimal usage is a signal
    if npm_popularity > 0.01:
        quality_score += 2

    # npm maintenance > 0.3 (+1)
    if npm_maintenance > 0.3:
        quality_score += 1

    # Scoped packages from known orgs are usually quality (+2)
    trusted_scopes = {
        "@modelcontextprotocol", "@anthropic", "@openai", "@google",
        "@microsoft", "@aws", "@azure", "@cloudflare", "@vercel",
        "@supabase", "@prisma", "@sentry", "@datadog", "@stripe",
        "@slack", "@notionhq", "@hubspot", "@salesforce", "@shopify",
        "@twilio", "@sendgrid", "@mapbox", "@heroku", "@railway",
        "@netlify", "@firebase", "@mongodb", "@elastic", "@grafana",
        "@langchain", "@llamaindex", "@huggingface", "@cohere",
        "@upstash", "@neon", "@planetscale", "@turso",
        "@sigmacomputing", "@apify", "@browserbase", "@e2b",
        "@sap-ux", "@ui5", "@adobe", "@figma", "@canva",
    }
    if scope in trusted_scopes:
        quality_score += 2

    # Has "mcp" or "model-context-protocol" explicitly in name (+1)
    if "mcp" in name.lower():
        quality_score += 1

    # THRESHOLD: need >= 3 quality points to pass
    if quality_score < 3:
        return False, f"low quality score ({quality_score})"

    return True, f"score={quality_score}"


def is_quality_github_repo(repo):
    """Strict quality gate for GitHub repos."""
    name = repo.get("name", "")
    desc = repo.get("description") or ""
    stars = repo.get("stargazers_count", 0)
    forks = repo.get("forks_count", 0)
    archived = repo.get("archived", False)
    fork = repo.get("fork", False)
    size = repo.get("size", 0)  # KB
    has_issues = repo.get("has_issues", False)
    updated = repo.get("updated_at", "")
    language = repo.get("language") or ""

    # REJECT: archived repos
    if archived:
        return False, "archived"

    # REJECT: forks (we want originals only)
    if fork:
        return False, "fork"

    # REJECT: spam names
    if SPAM_NAME_PATTERNS.search(name):
        return False, f"spam name: {name}"

    # REJECT: no description
    if not desc or len(desc.strip()) < 10:
        return False, "no/short description"

    # REJECT: empty repos (< 5 KB)
    if size < 5:
        return False, "empty repo"

    # REJECT: not updated in 2025+ (stale)
    if updated and updated < "2024-06-01":
        return False, "stale (pre-2024-06)"

    # QUALITY SCORING
    quality_score = 0

    # Stars are the strongest signal
    if stars >= 100:
        quality_score += 4
    elif stars >= 20:
        quality_score += 3
    elif stars >= 5:
        quality_score += 2
    elif stars >= 1:
        quality_score += 1

    # Has forks (+1)
    if forks >= 2:
        quality_score += 1

    # Recent activity (+2)
    if updated >= "2025-01-01":
        quality_score += 2
    elif updated >= "2024-06-01":
        quality_score += 1

    # Has a real language (+1)
    if language in ("TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "C#", "Ruby", "Kotlin", "Swift"):
        quality_score += 1

    # Description length (+1 for good description)
    if len(desc) >= 50:
        quality_score += 1

    # "mcp" in name is a good signal (+1)
    if "mcp" in name.lower():
        quality_score += 1

    # Reasonable repo size (+1)
    if size >= 50:
        quality_score += 1

    # THRESHOLD: need >= 3 quality points
    if quality_score < 3:
        return False, f"low quality ({quality_score}), {stars} stars"

    return True, f"score={quality_score}, stars={stars}"


def is_quality_smithery(server):
    """Quality gate for Smithery entries (already curated, lighter filter)."""
    name = server.get("displayName") or server.get("name") or ""
    desc = server.get("description", "")

    if not name or len(name.strip()) < 2:
        return False, "no name"

    if SPAM_NAME_PATTERNS.search(name):
        return False, "spam name"

    # Smithery is curated so we're less strict, but still filter junk
    if not desc or len(desc.strip()) < 10:
        return False, "no description"

    return True, "smithery-curated"


# ─── HTTP Helpers ──────────────────────────────────────────────────
def http_get(url, max_retries=2):
    for attempt in range(max_retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=15) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            if e.code in (429, 403) and attempt < max_retries:
                time.sleep(5 * (attempt + 1))
                continue
            return None
        except Exception:
            if attempt < max_retries:
                time.sleep(2)
                continue
            return None
    return None


def http_get_text(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode()
    except Exception:
        return None


# ─── npm Registry Crawler ─────────────────────────────────────────
def crawl_npm():
    print("\n[npm] Crawling npm registry ...")
    servers = []
    rejected = Counter()
    search_terms = ["mcp-server", "mcp server", "model-context-protocol", "mcpserver"]

    for term in search_terms:
        offset = 0
        while offset < 5000:
            url = f"https://registry.npmjs.org/-/v1/search?text={urllib.parse.quote(term)}&size=250&from={offset}"
            data = http_get(url)
            if not data:
                break

            items = data.get("objects", [])
            if not items:
                break

            for obj in items:
                pkg = obj.get("package", {})
                if not pkg:
                    continue
                name = pkg.get("name", "")
                desc = pkg.get("description", "")
                keywords = " ".join(pkg.get("keywords", []))
                text = f"{name} {desc} {keywords}".lower()
                if "mcp" not in text and "model context protocol" not in text:
                    continue

                # QUALITY GATE
                passes, reason = is_quality_npm_package(obj)
                if not passes:
                    rejected[reason.split(":")[0].strip()] += 1
                    continue

                links = pkg.get("links", {})
                repo_url = links.get("repository") or links.get("homepage")

                servers.append({
                    "server_url": repo_url or f"https://www.npmjs.com/package/{name}",
                    "name": name,
                    "description": desc[:500] if desc else "",
                    "category": infer_category(name, desc),
                    "github_url": repo_url if repo_url and "github.com" in str(repo_url) else None,
                    "source": "npm"
                })

            if len(items) < 250:
                break
            offset += 250
            time.sleep(0.3)

    # Deduplicate by name
    seen = set()
    deduped = []
    for s in servers:
        if s["name"] not in seen:
            seen.add(s["name"])
            deduped.append(s)

    print(f"  Passed quality gate: {len(deduped)}")
    print(f"  Rejected: {sum(rejected.values())} ({dict(rejected)})")
    return deduped


# ─── Smithery Crawler ─────────────────────────────────────────────
def crawl_smithery():
    print("\n[smithery] Crawling Smithery.ai ...")
    servers = []
    rejected = 0
    page = 1

    while page <= 30:
        url = f"https://registry.smithery.ai/servers?page={page}&pageSize=100"
        data = http_get(url)

        if not data:
            url = f"https://smithery.ai/api/servers?page={page}&limit=100"
            data = http_get(url)
            if not data:
                break

        items = data.get("servers", data.get("results", data.get("data", data.get("items", []))))
        if not items:
            break

        for s in items:
            # QUALITY GATE
            passes, reason = is_quality_smithery(s)
            if not passes:
                rejected += 1
                continue

            name = s.get("displayName") or s.get("name") or s.get("title") or "unknown"
            desc = s.get("description", "")
            qualified = s.get("qualifiedName") or s.get("slug") or s.get("name", "")

            servers.append({
                "server_url": s.get("url") or s.get("endpoint") or f"https://smithery.ai/server/{qualified}",
                "name": name,
                "description": desc[:500] if desc else "",
                "category": infer_category(name, desc),
                "github_url": s.get("homepage") or s.get("repository"),
                "source": "smithery"
            })

        if len(items) < 100:
            break
        page += 1
        time.sleep(0.5)

    print(f"  Passed quality gate: {len(servers)} (rejected: {rejected})")
    return servers


# ─── GitHub Topics Crawler ────────────────────────────────────────
def crawl_github():
    print("\n[github] Crawling GitHub topics ...")
    servers = []
    rejected = Counter()
    topics = ["mcp-server", "model-context-protocol", "mcp-servers"]

    for topic in topics:
        page = 1
        while page <= 10:
            url = f"https://api.github.com/search/repositories?q=topic:{topic}&sort=stars&order=desc&per_page=100&page={page}"
            try:
                req = urllib.request.Request(url, headers={
                    "User-Agent": USER_AGENT,
                    "Accept": "application/vnd.github.v3+json"
                })
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read().decode())
            except urllib.error.HTTPError as e:
                if e.code in (403, 429):
                    print(f"  Rate limit hit at topic={topic} page={page}")
                    break
                break
            except Exception:
                break

            items = data.get("items", [])
            if not items:
                break

            for repo in items:
                # QUALITY GATE
                passes, reason = is_quality_github_repo(repo)
                if not passes:
                    rejected[reason.split("(")[0].strip().split(",")[0].strip()] += 1
                    continue

                servers.append({
                    "server_url": repo.get("html_url", ""),
                    "name": repo.get("name", ""),
                    "description": (repo.get("description") or "")[:500],
                    "category": infer_category(repo.get("name", ""), repo.get("description") or ""),
                    "github_url": repo.get("html_url", ""),
                    "source": "github"
                })

            if len(items) < 100 or page >= 10:
                break
            page += 1
            time.sleep(2)

    # Deduplicate
    seen = set()
    deduped = []
    for s in servers:
        key = s["github_url"] or s["server_url"]
        if key not in seen:
            seen.add(key)
            deduped.append(s)

    print(f"  Passed quality gate: {len(deduped)}")
    print(f"  Rejected: {sum(rejected.values())} ({dict(rejected)})")
    return deduped


# ─── PyPI Crawler ─────────────────────────────────────────────────
def crawl_pypi():
    print("\n[pypi] Crawling PyPI ...")
    servers = []
    terms = ["mcp-server", "mcp server", "model-context-protocol"]

    for term in terms:
        html = http_get_text(f"https://pypi.org/search/?q={urllib.parse.quote(term)}&o=")
        if not html:
            continue
        matches = re.findall(r'href="/project/([^/"]+)/"', html)
        for pkg_name in matches:
            # Basic name quality filter
            if SPAM_NAME_PATTERNS.search(pkg_name):
                continue
            servers.append({
                "server_url": f"https://pypi.org/project/{pkg_name}/",
                "name": pkg_name,
                "description": "",
                "category": "other",
                "source": "pypi"
            })
        time.sleep(0.5)

    # Enrich with PyPI metadata and filter
    enriched = []
    for s in servers[:300]:  # cap enrichment
        try:
            data = http_get(f"https://pypi.org/pypi/{s['name']}/json")
            if not data:
                continue
            info = data.get("info", {})
            desc = info.get("summary", "")
            # Quality: must have description mentioning MCP
            if not desc or len(desc) < 15:
                continue
            if "mcp" not in desc.lower() and "model context" not in desc.lower() and "mcp" not in s["name"].lower():
                continue
            s["description"] = desc[:500]
            s["github_url"] = (info.get("project_urls") or {}).get("Homepage") or (info.get("project_urls") or {}).get("Repository")
            s["category"] = infer_category(s["name"], desc)
            enriched.append(s)
            time.sleep(0.1)
        except Exception:
            continue

    # Deduplicate
    seen = set()
    deduped = []
    for s in enriched:
        if s["name"] not in seen:
            seen.add(s["name"])
            deduped.append(s)

    print(f"  Passed quality gate: {len(deduped)}")
    return deduped


# ─── Bulk Register ────────────────────────────────────────────────
def register_servers(servers):
    print(f"\n>>> Registering {len(servers)} quality servers with Observatory...")

    if DRY_RUN:
        print("  [DRY RUN] Skipping actual registration.")
        print("  Top entries:")
        for s in servers[:20]:
            print(f"    {s['name']:45s} | {s['category']:15s} | {s['source']}")
        return {"registered": 0, "updated": 0, "errors": 0, "skipped": len(servers)}

    registered = 0
    updated = 0
    errors = 0

    for i, s in enumerate(servers):
        try:
            body = json.dumps({
                "server_url": s["server_url"],
                "name": s["name"],
                "description": s.get("description") or None,
                "category": s.get("category") or None,
                "github_url": s.get("github_url") or None
            }).encode()

            req = urllib.request.Request(
                REGISTER_ENDPOINT,
                data=body,
                headers={"Content-Type": "application/json", "User-Agent": USER_AGENT},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                result = json.loads(resp.read().decode())
                if result.get("registered"):
                    if result.get("updated"):
                        updated += 1
                    else:
                        registered += 1
        except Exception:
            errors += 1

        if (i + 1) % 100 == 0:
            pct = round((i + 1) / len(servers) * 100)
            print(f"\r  Progress: {i+1}/{len(servers)} ({pct}%) | new: {registered} | updated: {updated} | errors: {errors}", end="", flush=True)
            time.sleep(0.1)

    print("")
    return {"registered": registered, "updated": updated, "errors": errors, "skipped": 0}


# ─── Main ─────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  Dominion Observatory - Quality Registry Ingestion")
    print("=" * 60)
    print(f"  Target: {OBSERVATORY_URL}")
    print(f"  Mode:   {'DRY RUN (no writes)' if DRY_RUN else 'LIVE'}")
    print(f"  Source: {SOURCE}")
    print(f"  Quality gates: ENABLED")
    print()

    all_servers = []

    if SOURCE in ("all", "npm"):
        all_servers.extend(crawl_npm())

    if SOURCE in ("all", "smithery"):
        all_servers.extend(crawl_smithery())

    if SOURCE in ("all", "github"):
        all_servers.extend(crawl_github())

    if SOURCE in ("all", "pypi"):
        all_servers.extend(crawl_pypi())

    # Global dedup by normalized URL
    print(f"\n--- Pre-dedup total: {len(all_servers)}")
    seen = set()
    deduped = []
    for s in all_servers:
        key = re.sub(r"^https?://", "", s["server_url"].lower().rstrip("/"))
        if key not in seen:
            seen.add(key)
            deduped.append(s)
    all_servers = deduped
    print(f"    Post-dedup total: {len(all_servers)}")

    # Breakdowns
    source_counts = Counter(s["source"] for s in all_servers)
    cat_counts = Counter(s["category"] for s in all_servers)
    print(f"    By source: {dict(source_counts)}")
    top_cats = dict(cat_counts.most_common(15))
    print(f"    By category: {top_cats}")

    # Register
    result = register_servers(all_servers)

    print()
    print("=" * 60)
    print("  INGESTION COMPLETE")
    print("=" * 60)
    print(f"  New servers registered: {result['registered']}")
    print(f"  Existing updated:      {result['updated']}")
    print(f"  Errors:                {result['errors']}")
    print(f"  Skipped (dry run):     {result['skipped']}")
    print()

    if not DRY_RUN:
        try:
            data = http_get(f"{OBSERVATORY_URL}/api/stats")
            if data:
                total = data.get("total_servers_tracked") or data.get("total_servers", "?")
                print(f"  >>> New Observatory total: {total} servers")
        except Exception:
            pass


if __name__ == "__main__":
    main()
