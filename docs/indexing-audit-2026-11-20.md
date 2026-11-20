# Indexing audit, 20 Nov 2026

Run on the owner's request because only 5 of 38 sitemap URLs were indexed in Google. Data: URL Inspection for all 40 sitemap URLs, live responses fetched as Googlebot, internal links in the built site, Bing Webmaster crawl data, claude-seo `page_checks.py`.

## Findings
| Check | Result |
|---|---|
| Index status (Google) | 7 indexed (`/`, `/blog`, `/recalls`, `/wrap-designer`, `/coupons`, `/editorial-policy`, `/codes/p0455`); **29 "discovered – currently not indexed" with no crawl date at all**; 3 unknown to Google; 1 crawled but not indexed (`/article/obd2-fault-code-decoder-guide`, last crawled 12 Sep, before the rewrites) |
| Blocking | None. Every crawled page: fetch successful, robots.txt allowed, indexing allowed, Google's canonical = ours |
| Responses as Googlebot | All 200, 0.16–0.46 s to first byte, no `X-Robots-Tag`, no bot challenge |
| Redirects | `https://myautospex.com/*` → `www` with **307 (temporary)**; should be 308 (permanent) |
| Internal links | Tool and info pages: linked from every page (39 links each). New code pages: only 4 links each and none from the homepage |
| Sitemap | 40 URLs but only 18 had `<lastmod>`; included 4 low-value pages (privacy, terms, cookies, contact) |
| Bing | 15 pages indexed; `/codes/p0300` discovered and crawled via IndexNow within a day |

## Diagnosis
Nothing technical blocks Google. It knows the pages (sitemap and links) but crawls this new, barely linked site very rarely: one or two fetches every few days, mostly the homepage. "Discovered – currently not indexed" with no crawl date is Google deferring the crawl because it gives the site low priority. That priority rises with links from other sites, with pages Google already values linking to the new ones, and with consistent quality.

## Fixed in this change
- Every sitemap URL now has an accurate `<lastmod>` (`updated` in `seo/site.ts`; code pages and articles already had dates).
- Privacy, terms, cookies and contact are left out of the sitemap (still indexable), so the few crawls go to pages that matter.
- The homepage, the page Google re-crawls most, now has a "Check engine code guides" section linking every code page.
- All sitemap URLs resubmitted to IndexNow after the deploy.

## Decisions for the daily runs
- **Move the first data study up** from week 3 to days 6–7: links from other sites are the main lever for crawl priority.
- Build the `/codes` hub page (day 3 plan) and link it from the homepage section too.
- Keep the 2-pages-a-day pace: adding pages faster doesn't help while Google defers crawling the ones it knows.
- Re-inspect all sitemap URLs every Thursday and compare with this baseline.
- Rewrite `/article/obd2-fault-code-decoder-guide` content check: it was crawled and rejected in September; confirm the current version is clearly different from `/article/free-obd2-code-decoder-repair-costs` and `/codes/*`, or merge it.

## Owner actions (asked in "status")
1. Change the apex redirect to permanent (Vercel → Project → Settings → Domains → `myautospex.com` → redirect to `www.myautospex.com` with **308**).
2. Optional, high impact: in Search Console, URL inspection → "Request indexing" for up to 10 key pages (no API exists for this): `/fault-code-decoder`, `/vin-lookup`, `/codes/p0300`, `/codes/p0171`, `/codes/p0128`, `/maintenance-validator`, `/insurance-estimator`, `/ownership-calculator`, `/article/check-engine-light-meaning`, `/article/p0420-code-catalytic-converter-sensor-guide`.
