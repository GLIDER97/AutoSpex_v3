# Growth log

Newest entry first. Written by the daily growth run; see `docs/GROWTH-PLAN.md`.

## 2026-11-21: day 3 (week 1, day 3)

### What changed
- **`/codes` hub page** (week 1 effort goal): every code guide grouped by system (misfires, fuel mixture, engine temperature, EVAP leaks, catalytic converter), each with its drive verdict and summary, a "how to read a code" box sourced to SAE J2012, and a link to the code lookup for codes not listed. Linked from the header Tools menu (desktop and mobile), the footer, the homepage code section and the code lookup's "Code guides". Code pages' breadcrumb (visible and structured data) now points to `/codes` instead of the decoder. Added to the sitemap and `llms.txt`.
- **`/codes/p0442`** (EVAP small leak; Bing US 288, next in demand order). Sources: RepairPal; EPA OBD inspection guidance for the emissions answer. Links both ways with P0455.
- Builds on PR #8 (owner-session indexing audit, 20 Nov): the hub adds the extra internal links that audit called for.

### Keyword research (section 4a)
| Target query | Bing US, last 90 days | Google suggestions (subtopics) |
|---|---|---|
| p0442 code | 288 | Chevy (Silverado 1500, Impala), Ford, Toyota, VW Jetta, Buick Enclave, GMC |

(Researched on day 2; the hub targets the code guides as a set, no single query.)

### Numbers
| | Last 28 days (23 Oct–19 Nov) | Last 3 days (17–19 Nov) |
|---|---|---|
| Clicks | 1 (India, homepage) | 1 |
| Impressions | 126 (tier-1: 115, US 106) | 18 |
| Average position | 46.9 | **5.0** (was 36.2) |
| Tier-1 clicks | 0 | 0 |

- **Index: 7 indexed (was 5)**, including **`/codes/p0455`, indexed within a day of going live**, and `/editorial-policy`. 20 discovered but not indexed (`/codes/p0300`, `/codes/p0171`), 8 unknown to Google (`/codes/p0128`), 1 crawled but not indexed. No manual action, no drop. Google read the sitemap again on 20 Nov, 0 errors.
- **Top pages (3 days):** `/recalls` 14 impressions at position 4.8; homepage 5 at 5.4.
- **Week 1 so far (latest 7 days of data, 13–19 Nov):** 39 tier-1 impressions (goal 50+), 0 tier-1 clicks (goal 0).
- **Clarity, last day:** 0 human sessions (4 bot sessions filtered). Nothing to act on.
- **OpenRouter:** $0.00 of $10 this month. No images.
- **Community data:** not live yet (day 15+).

### Blocked
- Nothing new. Open owner requests: 1 (make the apex redirect 308) and 2 (request indexing for 10 key pages in Search Console).

### Tomorrow (day 4)
- Two code pages in demand order: P0301 (cylinder 1 misfire, Bing 241) and P0172 (system too rich, bank 1, Bing 131), both of which link into the existing misfire and fuel-mixture groups.
- Days 6–7: the first data study (moved up by the indexing audit).

## 2026-11-20: day 2 (week 1, day 2)

### What changed
- **Two new OBD-II code pages,** the highest-demand codes without a page or guide:
  - `/codes/p0128` (coolant thermostat: engine running too cold). Bing US 610 in 90 days, the most of the remaining top-10 codes.
  - `/codes/p0455` (EVAP large leak). Bing US 549.
  - Same structure as day 1. Sources: RepairPal for both; the P0455 emissions-inspection answer cites EPA's OBD inspection guidance (EPA420-R-01-015). No dollar figures (no cost source, see owner request 2).
- **Fix:** the code-page H1 lowercased the whole short name, which would have printed "eVAP". Only a normal capitalized first word is lowercased now.
- **IndexNow:** day 1's `/codes/p0300`, `/codes/p0171`, `/fault-code-decoder` and `robots.txt` submitted, HTTP 200.

### Keyword research (section 4a)
| Target query | Bing US, last 90 days | Google suggestions (subtopics) |
|---|---|---|
| p0128 code | 610 | Chevy, Dodge (Charger), Honda Civic, Jeep (Wrangler, Grand Cherokee), Ford, Chrysler 300 |
| p0455 code | 549 | Chevy (Silverado 1500), Toyota, Ford, Hyundai, Honda; "how to fix", "repair cost" |
| p0442 code | 288 | Chevy (Silverado, Impala), Ford, Toyota, VW Jetta, Buick Enclave, GMC |
| p0301 code | 241 | causes; Chevy, Ford, Toyota, Jeep Wrangler, Nissan, Honda Accord |
| p0172 code | 131 | Chevy (Equinox), Ford, Honda, BMW, Toyota, Subaru (WRX); "how to fix" |
| p0401 code | 118 | Ford (F150, 6.0 Powerstroke), Toyota, Chevy, 6.7 Cummins, Jeep |
| p0174 code | 0 (Bing returned none) | Chevy, Ford (F150), "bank 2 location", Toyota, BMW, Nissan |

New demand order for the remaining codes: P0442, P0301, P0172, P0401, P0174. The pages answer the make-specific searches by sending people to the decoder with their car, not with per-make pages.

### Numbers
| | Last 28 days (22 Oct–18 Nov) | Last 3 days (16–18 Nov) |
|---|---|---|
| Clicks | 1 (India, homepage) | 1 |
| Impressions | 116 (tier-1: 106) | 17 (16 US) |
| Average position | 51.0 | 36.2 |
| Tier-1 clicks | 0 | 0 |

- **Week 1 so far (latest 7 days of data, 12–18 Nov):** 34 tier-1 impressions (goal 50+), 0 tier-1 clicks. The new code pages aren't in this data yet (2-day lag, and not crawled).
- **Index:** 5 of 38 inspected sitemap URLs indexed, unchanged. 18 discovered but not indexed (including `/fault-code-decoder` and `/vin-lookup`), 12 unknown to Google, 1 crawled but not indexed, 2 inspections timed out. No manual action, no drop. Sitemap last read by Google 18 Nov (before the code pages); 0 errors.
- **Top pages (3 days):** `/recalls` 13 impressions at position 29.9; homepage 5.
- **Clarity, last day:** 1 session (India, PC: probably the owner), homepage and `/coupons`, 61.5% scroll depth, **5 dead clicks** in that session, no rage clicks or quick-backs; 8 bot sessions filtered. One session is too little to act on; watch whether dead clicks repeat on `/coupons`.
- **OpenRouter:** $0.00 of $10 this month. No images generated.
- **Community data:** not live yet (day 15+).

### Blocked
- Nothing new. Open owner requests 1 (move the daily runs to a fresh-session scheduled task) and 2 (repair-cost source) still stand.

### Tomorrow (day 3)
- The `/codes` hub page (week 1 effort goal), linked from the Tools menu, footer and code lookup, plus P0442 (EVAP small leak, Bing 288).
- Submit today's two pages to IndexNow once the deploy is live (done in this run if the deploy finishes).

## 2026-11-19: day 1 (week 1, day 1)

**Late start.** The scheduled runs on 17, 18 and 19 Nov could read the repository but not push to it, so nothing shipped. The daily run now fires into the owner's main session, which can push. The 30-day plan starts today, three days behind the roadmap dates.

### What changed
- **IndexNow:** key file `public/9abc396f79fd435e077798f01439c6d0.txt` and `scripts/indexnow.mjs` (`node scripts/indexnow.mjs <urls>` or `--all`), run after each deploy.
- **OBD-II code pages, first two:** a `/codes/:code` template (`components/CodePage.tsx`) rendered from reviewed data in `data/codePages.ts`. It is pre-rendered with `TechArticle` and breadcrumb markup, added to the sitemap and `llms.txt`, and linked from the code lookup page under "Code guides".
  - `/codes/p0300` (random misfire) and `/codes/p0171` (system too lean, bank 1).
  - Each page has: the standard definition, whether it's safe to drive, symptoms, causes, parts often replaced without fixing it, what to check first, how the computer sets the code, what the cost depends on, related codes, FAQ and sources.
- **P0420 skipped on purpose:** it has the highest demand (922 Bing searches in 90 days) but already has a full guide, `/article/p0420-code-catalytic-converter-sensor-guide`. A code page would compete with it, so code pages link to the guide instead.
- **Crawl cost protection:** decoder links that carry a code (`/fault-code-decoder?codes=...`) start a paid AI lookup on load. They are now `rel="nofollow"`, and `robots.txt` disallows `/fault-code-decoder?`.
- **Started** this log, `docs/growth-metrics.csv` and `docs/openrouter-spend.csv`.

### Keyword research (section 4a)
| Target query | Bing US, last 90 days | Google suggestions (subtopics) |
|---|---|---|
| p0300 code | 694 | Chevy (Silverado), Nissan, Ford, Dodge, Toyota, Jeep (Grand Cherokee, Wrangler); "engine code" |
| p0171 code | 398 | Chevy, Toyota, Ford, Nissan, BMW, Honda (Accord), Ford F150; "bank 1" |
| p0420 code | 922 | bank 1 / bank 2, Chevy, Toyota, Ford, Nissan, Honda; "how to fix" |

Bing's related-keyword results were unrelated (generic "code" queries), so they were ignored. The make-specific searches are answered by sending people to the decoder with their car, not by separate per-make pages (which would be near-duplicates).

### Numbers
| | Last 28 days | Last 3 days |
|---|---|---|
| Clicks | 1 (India, homepage, position 1: likely a brand search) | 1 |
| Impressions | 118 | 19 |
| Average position | 51.1 | 36.6 |
| Tier-1 clicks | 0 | |

- **Index:** 5 of 36 sitemap URLs indexed (`/`, `/blog`, `/recalls`, `/wrap-designer`, `/coupons`). 17 discovered but not indexed, 11 unknown to Google, 1 crawled but not indexed, 2 inspections timed out. No manual action and no drop.
- **Sitemap:** listed, last read 18 Nov, 0 errors.
- **Top queries (28 days):** "wrap visualizer for designers" (25 impressions, position 82), "technical service bulletin lookup" (9, 66), "emission test check by vin" (6, position 7.5), "affordable vin check with recall data" (3, 8.7).
- **Clarity, last day:** 1 session (India, from Google, on `/fault-code-decoder`), 65% scroll depth, no dead clicks, rage clicks or quick-backs.
- **Week 1 target:** 60+ pages indexed in Google by day 7. Today: 5.
- **OpenRouter:** $0.00 of $10 this month. No images generated (the code pages don't need one).
- **Community data:** not live yet (day 15+).

### Blocked
- **No repair-cost source.** RepairPal's cost estimator and CarMD's report pages refuse automated requests (403/404), so code pages show what drives the cost and link to the decoder's labeled AI estimate instead of dollar figures. *Owner action (optional):* suggest a public cost source that can be cited, or approve leaving costs out.

### Tomorrow (day 2)
- Submit today's URLs to IndexNow and check they're accepted.
- Two more code pages in demand order, avoiding codes with their own guide: P0455 and P0442 (EVAP leaks), after keyword research.
