"""Free keyword research (docs/GROWTH-PLAN.md section 4a): Bing Webmaster GetKeyword volume
(US, last 90 days) and Google search suggestions for "<code> code".

Usage: python3 -I scripts/growth/keywords.py P0455 P0442 ...
Needs BING_WEBMASTER_API_KEY, which is never printed. Writes kw-<date>.json in the current folder.
Bing's GetRelatedKeywords results for these queries are generic noise, so ignore them.
"""
import json, os, sys, urllib.parse, urllib.request, datetime as dt
KEY = os.environ["BING_WEBMASTER_API_KEY"]  # never printed
end = dt.date.today() - dt.timedelta(days=3); start = end - dt.timedelta(days=90)
def bing(method, q):
    url = (f"https://ssl.bing.com/webmaster/api.svc/json/{method}?q={urllib.parse.quote(q)}&country=us&language=en-US"
           f"&startDate={start}T00:00:00&endDate={end}T00:00:00&apikey={KEY}")
    try:
        return json.load(urllib.request.urlopen(url, timeout=40)).get("d")
    except Exception as e:
        return f"error {getattr(e, 'code', '')}"
def suggest(q):
    u = "https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=" + urllib.parse.quote(q)
    try: return json.loads(urllib.request.urlopen(u, timeout=20).read().decode("utf-8", "replace"))[1]
    except Exception as e: return f"error {e}"
out = {}
for code in sys.argv[1:]:
    q = f"{code.lower()} code"
    kw = bing("GetKeyword", q)
    rel = bing("GetRelatedKeywords", q)
    vol = None
    if isinstance(kw, dict): vol = kw.get("Impressions") or kw.get("BroadImpressions")
    rel_top = sorted(rel, key=lambda r: -(r.get("Impressions") or 0))[:12] if isinstance(rel, list) else rel
    out[code] = {"query": q, "bing_keyword": kw, "related": [(r.get("Query"), r.get("Impressions")) for r in rel_top] if isinstance(rel_top, list) else rel_top,
                 "google_suggest": suggest(q) + (suggest(code.lower() + " ") if isinstance(suggest(q), list) else [])}
json.dump(out, open(f"kw-{dt.date.today()}.json", "w"), indent=1)
for c, v in out.items():
    kw = v["bing_keyword"]
    print(c, "| Bing exact/broad:", (kw.get("ExactImpressions"), kw.get("BroadImpressions"), kw.get("Impressions")) if isinstance(kw, dict) else kw)
    print("   related:", v["related"])
    print("   google:", v["google_suggest"][:14])
