"""Daily Search Console measurement for the growth runs (docs/GROWTH-PLAN.md section 2/3).

Usage: python3 scripts/growth/gsc_daily.py <output.json>
Needs GSC_SERVICE_ACCOUNT_JSON (service account key) and the `cryptography` package
(if the system copy fails, use a venv: python3 -m venv v && v/bin/pip install cryptography).
Reads sitemaps and Search Analytics (3 and 28 days, by page, query and country), submits the
sitemap only if it is missing, and inspects up to 200 sitemap URLs. Prints a summary.
"""
import base64, datetime as dt, json, os, re, sys, time, urllib.request
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

SITE_ENC = "https%3A%2F%2Fwww.myautospex.com%2F"
SITE = "https://www.myautospex.com/"
TIER1 = {"usa","gbr","can","aus","nzl","irl","deu","fra","nld","bel","aut","esp","ita","prt","swe","dnk","fin","nor","che","lux","pol","cze","grc","hun","rou","svk","svn","hrv","bgr","est","lva","ltu","cyp","mlt"}

def token():
    sa = json.loads(os.environ["GSC_SERVICE_ACCOUNT_JSON"])
    b64 = lambda b: base64.urlsafe_b64encode(b).rstrip(b"=")
    now = int(time.time())
    head = b64(json.dumps({"alg": "RS256", "typ": "JWT"}).encode())
    claim = b64(json.dumps({"iss": sa["client_email"], "scope": "https://www.googleapis.com/auth/webmasters",
                            "aud": "https://oauth2.googleapis.com/token", "iat": now, "exp": now + 3600}).encode())
    key = serialization.load_pem_private_key(sa["private_key"].encode(), None)
    sig = b64(key.sign(head + b"." + claim, padding.PKCS1v15(), hashes.SHA256()))
    body = ("grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + (head + b"." + claim + b"." + sig).decode()).encode()
    r = urllib.request.urlopen(urllib.request.Request("https://oauth2.googleapis.com/token", body, {"Content-Type": "application/x-www-form-urlencoded"}))
    return json.load(r)["access_token"]

TOK = token()

def batch(parts):
    data = "".join(f"--B\r\nContent-Type: application/http\r\nContent-ID: <{cid}>\r\n\r\n{method} {path}\r\n"
                   + (f"Content-Type: application/json\r\n\r\n{json.dumps(body)}\r\n" if body is not None else "\r\n")
                   for cid, method, path, body in parts) + "--B--\r\n"
    req = urllib.request.Request("https://searchconsole.googleapis.com/batch/webmasters/v3", data.encode(),
                                 {"Content-Type": "multipart/mixed; boundary=B", "Authorization": f"Bearer {TOK}"})
    raw = urllib.request.urlopen(req, timeout=90).read().decode()
    out = {}
    for m in re.finditer(r"Content-ID: <response-([^>]+)>(.*?)(?=\r?\n--batch|\Z)", raw, re.S):
        j = re.search(r"\{.*\}", m.group(2), re.S)
        out[m.group(1)] = json.loads(j.group(0)) if j else {"raw": m.group(2)[:300]}
    return out

today = dt.date.today()
end = today - dt.timedelta(days=2)  # Search Console data lags about 2 days
def rng(days): return (end - dt.timedelta(days=days - 1)).isoformat(), end.isoformat()
q = lambda days, dims, n=1000: {"startDate": rng(days)[0], "endDate": rng(days)[1], "dimensions": dims, "rowLimit": n}
base = f"/webmasters/v3/sites/{SITE_ENC}"
parts = [("sitemaps", "GET", f"{base}/sitemaps", None)]
for d in (3, 28):
    for dims in ([], ["page"], ["query"], ["country"]):
        parts.append((f"{d}-{'-'.join(dims) or 'total'}", "POST", f"{base}/searchAnalytics/query", q(d, dims)))
res = batch(parts)
report = {"date": today.isoformat(), "range28": rng(28), "range3": rng(3), "sa": res}

sm = res.get("sitemaps", {}).get("sitemap", [])
if not any(s.get("path") == "https://www.myautospex.com/sitemap.xml" for s in sm):
    put = batch([("put", "PUT", f"{base}/sitemaps/https%3A%2F%2Fwww.myautospex.com%2Fsitemap.xml", None)])
    report["sitemap_submitted"] = put

urls = re.findall(r"<loc>([^<]+)</loc>", urllib.request.urlopen("https://www.myautospex.com/sitemap.xml").read().decode())
insp = {}
for u in urls[:200]:
    req = urllib.request.Request("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
                                 json.dumps({"inspectionUrl": u, "siteUrl": SITE}).encode(),
                                 {"Content-Type": "application/json", "Authorization": f"Bearer {TOK}"})
    try:
        r = json.load(urllib.request.urlopen(req, timeout=60))["inspectionResult"]["indexStatusResult"]
        insp[u] = {"coverage": r.get("coverageState"), "lastCrawl": r.get("lastCrawlTime")}
    except Exception as e:
        insp[u] = {"coverage": f"error: {e}"}
report["inspection"] = insp
json.dump(report, open(sys.argv[1], "w"), indent=1)

def tot(k):
    rows = res.get(k, {}).get("rows", [])
    return rows[0] if rows else {"clicks": 0, "impressions": 0, "position": 0}
t28, t3 = tot("28-total"), tot("3-total")
tier1 = sum(r["clicks"] for r in res.get("28-country", {}).get("rows", []) if r["keys"][0] in TIER1)
from collections import Counter
cov = Counter(v["coverage"] for v in insp.values())
print(json.dumps({"28d": t28, "3d": t3, "tier1_clicks_28d": tier1, "sitemaps": [(s.get("path"), s.get("lastDownloaded"), s.get("errors")) for s in sm],
                  "coverage": cov, "indexed": [u for u, v in insp.items() if v["coverage"] == "Submitted and indexed"]}, indent=1))
