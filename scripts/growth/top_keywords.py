"""Top keywords for the content rule (docs/CONTENT-RULE.md, step 1-2).

Usage: python3 -I scripts/growth/top_keywords.py <output.json> [--days 28] [--top 20]
Needs GSC_SERVICE_ACCOUNT_JSON and the `cryptography` package (same as gsc_daily.py).

1. Reads Search Console for the last N days (data lags about 2 days) by query, query+page and
   query+country.
2. Ranks queries by tier-1 impressions (all impressions break ties) and keeps the top N.
3. Adds the cost per click where `data/keyword-cpc.csv` has it (columns: keyword,cpc_usd,source,date,
   from Google Keyword Planner or another real source). Otherwise it adds an estimated commercial
   value tier from the query's intent, clearly marked as an estimate. Neither is ever shown on the site.
4. Groups the top queries by the page Google ranks for them, scores each group
   (impressions x value) and prints the groups, best target first.
"""
import argparse, base64, csv, datetime as dt, json, os, re, time, urllib.request
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

SITE = "https://www.myautospex.com"
SITE_ENC = "https%3A%2F%2Fwww.myautospex.com%2F"
TIER1 = {"usa", "gbr", "can", "aus", "nzl", "irl", "deu", "fra", "nld", "bel", "lux", "aut", "che", "swe", "dnk", "fin", "nor", "isl"}  # tier 1 as defined in GROWTH-PLAN section 9
CPC_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "data", "keyword-cpc.csv")

# Estimated commercial value when no CPC is on file: advertisers pay most for money decisions.
# A rough guide for choosing what to work on, never a published figure.
VALUE_TIERS = [
    ("high", 3, r"insur|loan|financ|lease|payment|warranty|lawyer|attorney|lemon|accident|refinanc|trade.?in|"
                r"sell (my )?car|car value|worth|apprais|repair cost|cost to|price|quote|estimate|premium|afford"),
    ("medium", 2, r"vin|recall|history|report|mechanic|shop|near me|parts?\b|tire|battery|brake|transmission|"
                  r"catalytic|wrap|tint|detail"),
    ("low", 1, r"."),
]


def token():
    sa = json.loads(os.environ["GSC_SERVICE_ACCOUNT_JSON"])
    b64 = lambda b: base64.urlsafe_b64encode(b).rstrip(b"=")
    now = int(time.time())
    head = b64(json.dumps({"alg": "RS256", "typ": "JWT"}).encode())
    claim = b64(json.dumps({"iss": sa["client_email"], "scope": "https://www.googleapis.com/auth/webmasters.readonly",
                            "aud": "https://oauth2.googleapis.com/token", "iat": now, "exp": now + 3600}).encode())
    key = serialization.load_pem_private_key(sa["private_key"].encode(), None)
    sig = b64(key.sign(head + b"." + claim, padding.PKCS1v15(), hashes.SHA256()))
    body = ("grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion="
            + (head + b"." + claim + b"." + sig).decode()).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", body, {"Content-Type": "application/x-www-form-urlencoded"})
    return json.load(urllib.request.urlopen(req))["access_token"]


def batch(tok, parts):
    # The batch endpoint avoids the encoded slash in the site URL, which the proxy rejects in a path.
    data = "".join(f"--B\r\nContent-Type: application/http\r\nContent-ID: <{cid}>\r\n\r\nPOST {path}\r\n"
                   f"Content-Type: application/json\r\n\r\n{json.dumps(body)}\r\n" for cid, path, body in parts) + "--B--\r\n"
    req = urllib.request.Request("https://searchconsole.googleapis.com/batch/webmasters/v3", data.encode(),
                                 {"Content-Type": "multipart/mixed; boundary=B", "Authorization": f"Bearer {tok}"})
    raw = urllib.request.urlopen(req, timeout=90).read().decode()
    out = {}
    for m in re.finditer(r"Content-ID: <response-([^>]+)>(.*?)(?=\r?\n--batch|\Z)", raw, re.S):
        j = re.search(r"\{.*\}", m.group(2), re.S)
        out[m.group(1)] = json.loads(j.group(0)).get("rows", []) if j else []
    return out


def load_cpc():
    if not os.path.exists(CPC_FILE):
        return {}
    with open(CPC_FILE, newline="") as f:
        return {r["keyword"].strip().lower(): r for r in csv.DictReader(f) if r.get("keyword") and r.get("cpc_usd")}


def value_tier(query):
    for name, weight, pattern in VALUE_TIERS:
        if re.search(pattern, query, re.I):
            return name, weight


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--days", type=int, default=28)
    ap.add_argument("--top", type=int, default=20)
    a = ap.parse_args()

    end = dt.date.today() - dt.timedelta(days=2)
    start = end - dt.timedelta(days=a.days - 1)
    body = lambda dims: {"startDate": start.isoformat(), "endDate": end.isoformat(), "dimensions": dims, "rowLimit": 5000}
    base = f"/webmasters/v3/sites/{SITE_ENC}/searchAnalytics/query"
    res = batch(token(), [("q", base, body(["query"])), ("qp", base, body(["query", "page"])),
                          ("qc", base, body(["query", "country"]))])

    tier1, page = {}, {}
    for r in res["qc"]:
        if r["keys"][1] in TIER1:
            tier1[r["keys"][0]] = tier1.get(r["keys"][0], 0) + r["impressions"]
    for r in res["qp"]:
        q, p = r["keys"]
        if q not in page or r["impressions"] > page[q][1]:
            page[q] = (p.replace(SITE, "") or "/", r["impressions"])

    cpc = load_cpc()
    rows = []
    for r in res["q"]:
        q = r["keys"][0]
        tier, weight = value_tier(q)
        c = cpc.get(q.lower())
        rows.append({
            "query": q,
            "impressions": r["impressions"],
            "tier1_impressions": tier1.get(q, 0),
            "clicks": r["clicks"],
            "ctr": round(r["ctr"], 4),
            "position": round(r["position"], 1),
            "page": page.get(q, ("", 0))[0],
            "cpc_usd": float(c["cpc_usd"]) if c else None,
            "cpc_source": c.get("source") if c else None,
            "value_tier": tier,
            "value_weight": weight,
        })
    rows.sort(key=lambda x: (-x["tier1_impressions"], -x["impressions"]))
    top = rows[: a.top]

    groups = {}
    for r in top:
        g = groups.setdefault(r["page"], {"page": r["page"], "queries": [], "impressions": 0, "score": 0.0})
        g["queries"].append(r["query"])
        g["impressions"] += r["tier1_impressions"] or r["impressions"]
        # Real CPC beats the estimate: score = impressions x (CPC in dollars, or the tier weight).
        g["score"] += (r["tier1_impressions"] or r["impressions"]) * (r["cpc_usd"] if r["cpc_usd"] is not None else r["value_weight"])
    ranked = sorted(groups.values(), key=lambda g: -g["score"])

    report = {"range": [start.isoformat(), end.isoformat()], "cpc_file": bool(cpc), "top": top, "groups": ranked}
    with open(a.out, "w") as f:
        json.dump(report, f, indent=1)

    print(f"Search Console {start} to {end}: {len(rows)} queries. Top {len(top)} by tier-1 impressions"
          f" ({'CPC from data/keyword-cpc.csv where listed' if cpc else 'no CPC file: value tier is an estimate'}):")
    print("| # | Query | Tier-1 impr. | All impr. | Clicks | Position | CPC / value | Page |")
    print("|---|---|---|---|---|---|---|---|")
    for i, r in enumerate(top, 1):
        val = f"${r['cpc_usd']:.2f}" if r["cpc_usd"] is not None else f"{r['value_tier']} (est.)"
        print(f"| {i} | {r['query']} | {r['tier1_impressions']} | {r['impressions']} | {r['clicks']} | {r['position']} | {val} | {r['page']} |")
    print("\nTarget pages, best first (score = impressions x CPC, or x value weight when no CPC):")
    for g in ranked:
        print(f"- {g['page']}: score {g['score']:.0f}, {g['impressions']} impressions, {len(g['queries'])} queries")


if __name__ == "__main__":
    main()
