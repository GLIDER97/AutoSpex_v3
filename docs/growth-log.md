# Growth log

Newest entry first. Written by the daily growth run; see `docs/GROWTH-PLAN.md`.

## 2026-11-23: day 5 (week 1, day 5; Monday)

### What changed
- **`/cars` hub**, the section 0 day-5 item. It compares every vehicle report:
  - key numbers: 4 model-years, 6,940 owner complaints counted, 18 recalls
  - three ranked bar charts drawn in code: most complaints, share of complaints in NHTSA's "Engine" category, most recalls
  - a VIN-check box, all reports by make, the method, a comparison CSV (`/data/cars/all-vehicle-reports.csv`) and "How to cite this"
  - `CollectionPage` + `Dataset` structured data
  - Linked from the Explore menu, the footer, `/recalls`, the VIN tool's intro and every code guide ("Which cars have the most engine complaints?"). Vehicle-page breadcrumbs (visible and structured data) now point to `/cars`.
- **Two new vehicle reports:**
  - `/cars/ford/escape/2019`: 606 complaints, 3 recalls; Bing US 40 for "2019 ford escape problems"; completes 2017–2019
  - `/cars/honda/cr-v/2017`: 1,787 complaints, 7 recalls (the most of any report); chosen by NHTSA complaint count, since Bing had no year-level volume
  - Both have all the charts.
- **Weekly vehicle data refresh:** all 4 snapshots re-run (2018 Escape: 1,833 complaints).
- **Monday loop:**
  - Quick wins: none. No query has 50+ impressions; the top is "wrap visualizer for designers" with 25, at position 81.
  - Low CTR: not enough impressions to judge.
  - Audit: claude-seo `page_checks.py` on the 6 most-visited pages (home, Wrap Designer, blog, code lookup, wrap gallery, affordability) found **0 issues**. Lighthouse isn't available in the sandbox and was skipped.
  - 4b refresh: `obd2-fault-code-decoder-guide` and `check-engine-light-meaning` now link to the code guides hub, four code guides and the vehicle reports. Dates unchanged (no content change).
  - Regex mining starts in week 2.
- **Wrap gallery review:** 0 new designs and 0 recorded previews since launch. A test preview from here was blocked by the permission check, so the owner is asked to make one (owner request 1). `stats.json` refreshed (0).

### Numbers
| | Last 28 days (25 Oct–21 Nov) | Last 3 days (19–21 Nov) |
|---|---|---|
| Clicks | 1 | 0 |
| Impressions | 127 (tier-1 106) | 9 |
| Average position | 44.8 | 16.2 |
| Tier-1 clicks | 0 | 0 |

- **Index: 32 of 60 inspected URLs (was 16)**, after the owner's indexing requests and the new internal links.
  - Newly indexed: the 2017 Escape report and **14 of 19 wrap gallery pages**.
  - Not yet indexed: 21 discovered (the 2018 Escape, P0442, 4 tools, 13 older articles), 5 unknown, 2 crawled but not indexed. No manual action, no drop.
  - The sitemap was read 22 Nov: 60 web URLs and 38 image entries.
- **Week 1:** indexed 32 against the 12+ goal (**met**). Tier-1 impressions 33 in the latest 7 days of data (goal 50+; amber so far). Tier-1 clicks 0 (goal 0).
- **Clarity, last day:** 8 human sessions, 6 users (4 US, 4 India), 12 bots filtered. Pages: home 3, Wrap Designer 3, blog 2, code lookup 2, wrap gallery 2. 66% scroll depth, 8 dead clicks (25% of sessions), 12 quick-backs (37.5% of sessions), 0 rage clicks. Referrers: Google 1, internal 2. **AI-app referrals: 0.** The live API gives no per-page breakdown, so nothing specific to fix yet.
- **OpenRouter:** $3.43 of $10 this month. No images today.
- **Community data:** not live yet (week 2).

### Needs the owner
- Owner request 1: one wrap preview to confirm the gallery saves designs.

### Tomorrow (day 6)
- First data study from the NHTSA data (section 0, days 6–7), with charts, method, CSV and "How to cite this". For example: complaint trends by filing year across the reported model-years, extended to more best-selling 2015–2022 SUVs where the data supports it.
- The wrap gallery review, as every run.

## 2026-11-22: owner instruction, wrap gallery (not a daily run; day numbering unchanged)

- **New: `/wrap-gallery`** with one page per design, showing Wrap Designer images with all their details: vehicle, coverage, finish, color with hex, extras and date. `docs/WRAP-GALLERY.md`, decision 12.
- **Privacy call:**
  - Previews made from a visitor's own photo are never saved or published.
  - Previews drawn from year, make and model are saved (once per unique design, capped at 80 a day and 2,500 in total), and the daily run reviews them before publishing.
  - Only anonymous option counts are kept for every preview. The privacy policy and the tool say so.
- **Images:**
  - WebP 1200 px (55–150 KB) and 640 px (20–50 KB) via sharp at q72, plus a JPEG made on demand for shares.
  - Every file carries IPTC/XMP metadata: title, caption, credit, CC BY 4.0, "AI-generated".
  - Descriptive file names, alt text and captions built from the design.
  - srcset with real width and height; lazy loading below the fold.
- **SEO/AEO:**
  - `ImageObject` with credit, license and `acquireLicensePage`; `CollectionPage` + `ItemList` on the hub; breadcrumbs
  - an image sitemap (`image:image`) and `llms.txt` entries
  - question headings and an FAQ
  - "Use this image" with a ready credit line, so reuse earns links
  - Pinterest save and copy-link sharing
  - "Try this design" opens the Wrap Designer prefilled
- **Navigation:** new **Explore** menu (wrap gallery, code guides, vehicle reports, articles) replaces the "Articles" link; code guides moved there from Tools. Footer link added.
- **Starter set:**
  - 20 designs made with Flux 3 Klein, the tool's own model and prompts, at **$0.0090 each, $0.171 in total**. That's the measured cost of a from-scratch preview, matching the estimate given to the owner.
  - 19 published. The Nissan GT-R was rejected: labeled blue chrome, but it looked like gloss paint.
  - OpenRouter this month: $3.40 of $10.
- **Daily runs from now on:** review new visitor designs with `scripts/wraps/review.mjs` (GROWTH-PLAN section 3, step 4).
- **Follow-up (owner): new loading indicator.** Every loader is now a spinning car wheel drawn in SVG: tire with tread, 5-spoke rim, yellow center cap. The large versions roll over a moving road. Sizes: page loading and long AI waits extra large, tool sections large, buttons small. In the Wrap Designer it sits inside the preview box. It stops moving for visitors who ask their device to reduce motion (`components/tool/CarLoader.tsx`).
- **Follow-up (owner): the same wheel loader everywhere.** It's now also in secondary buttons (EPA lookups in the MPG and ownership tools, the price estimate in the affordability tool), the mechanic chat ("typing…" and the send button), and the VIN report's summary tiles while each section loads. No other spinner styles are left.
- **Follow-up (owner):** the Wrap Designer now promotes the gallery with a highlighted "Need ideas? Browse the car wrap gallery" banner under the title, using the 3 most colorful designs. Below "What it costs" it shows 4 gallery images matched to the visitor's chosen finish and a large green "View the complete wrap gallery" card (`components/WrapGalleryTeaser.tsx`).

## 2026-11-22: owner instruction, charts on every data page (not a daily run; day numbering unchanged)

- **New standing rule (owner):** every page with data or data insights shows it with charts, drawn by Claude in code, never with an AI or paid API. Saved in GROWTH-PLAN section 0 (charts rule) and decision 11, `docs/owner-requests.md`, and the spec `docs/DATA-VIZ.md`.
- **Chart kit extended** (`components/tool/charts.tsx`; HTML/SVG, server-rendered, $0):
  - `StatTile` with `Sparkline`
  - `MeterList` (share of a total per row)
  - `ColumnChart` (y-axis, hairline grid, peak and latest labeled, hover, tap or focus readout, partial year drawn lighter, "Show as table")
  - `Timeline` (dated events, numbered, no overlaps)
  - `Stars` (ratings out of 5)
- **Both Ford Escape reports now use them:**
  - key-number tiles with a complaints-per-year sparkline and star ratings
  - complaint areas as share meters, and reported crashes, fires, injuries and deaths as tiles
  - complaints per year as a column chart
  - recalls on a timeline, numbered to match the list
  - crash ratings as stars, with the rollover risk under each
  - EPA combined MPG as ranked bars, with city and highway figures in a table
- Checked at 390 px and 1280 px in light and dark mode: no sideways scroll, no console or hydration errors.

## 2026-11-22: day 4 (week 1, day 4)

### What changed
- **Vehicle report pages, the first page type under the new section 0 rule** (only work AI apps can't replace or will cite):
  - `/cars/ford/escape/2018` and `/cars/ford/escape/2017`.
  - Each page has:
    - a key-numbers box with dated source links
    - complaints by component, as a bar chart drawn in HTML
    - **complaints by the year they were filed**, our own computed trend
    - every recall with its risk and fix
    - NHTSA crash ratings for each version tested
    - EPA MPG for each engine and drive
    - links to the VIN check, the recall check, the code guides for the top complaint areas and the cost tools
    - the method, a CSV download and a "How to cite this" line
    - `Dataset` structured data with a `Car` and a `DataDownload`, plus breadcrumbs
  - The pages are in the sitemap (lastmod = data date) and in a new "Vehicle reports" section of `llms.txt`, and are linked from `/recalls` under "Vehicle reports". Both years link to each other.
- **Data pipeline:** `scripts/vehicles/snapshot.mjs` reads the NHTSA complaints, recalls and 5-Star ratings APIs and EPA fueleconomy.gov for each entry in `data/vehicles/list.json` and writes `data/vehicles/<slug>.json`. It keeps counts only, no complaint text or VINs. The build never calls the APIs. `data/vehicles/index.ts` publishes a model-year only with 25+ complaints or 1+ recall. Re-run the snapshot weekly (Mondays).
- `robots.txt` still allows every crawler, AI crawlers included.
- `docs/growth-metrics.csv` has a new `ai_referrals` column (section 0); earlier rows are blank.

### Keyword research and choice (section 4a)
Bing US, last 90 days, "<year> <make> <model> problems" for 16 best-selling 2015–2022 model-years: only the Ford Escape had measurable volume.

| Query | Bing US (90 days) | NHTSA complaints | Recalls |
|---|---|---|---|
| 2018 ford escape problems | 179 (plus "2018 ford escape reliability" 111) | 1,833 | 4 |
| 2017 ford escape problems | 113 | 2,714 | 4 |
| 2019 ford escape problems | 40 | not built yet | |
| 2018 honda cr-v, 2017 nissan rogue, 2015 jeep grand cherokee, 2019 toyota rav4, 2016 honda civic, 2018 chevy equinox, 2015/2017 f-150, 2016 explorer, 2019 ram 1500, 2016 altima, 2017 cherokee, 2018 silverado (problems or recalls) | 0 | CR-V 2017: 1,787; Grand Cherokee 2015: 1,372; RAV4 2019: 891 | |

Bing's year-level volumes are thin, so from tomorrow NHTSA complaint counts (section 4a item 4) break the ties.

**What the data shows (our own computed figures):**
- 2017 Escape: 59% of 2,714 complaints involve the engine, and complaints are still rising: 645 were filed in 2025 against 50 in 2017.
- 2018 Escape: 490 complaints filed in 2025.
- Both get a 5-star overall NHTSA crash rating.

### Numbers
| | Last 28 days (24 Oct–20 Nov) | Last 3 days (18–20 Nov) |
|---|---|---|
| Clicks | 1 (India) | 0 |
| Impressions | 129 (tier-1 about 115) | 19 |
| Average position | 45.2 | 10.1 |
| Tier-1 clicks | 0 | 0 |

- **Index: 16 indexed (was 7)**, after the owner's indexing requests on 21 Nov.
  - Indexed: `/fault-code-decoder`, `/vin-lookup`, `/codes`, `/maintenance-validator`, `/insurance-estimator`, the P0420 guide, and all code pages except P0442 (unknown to Google yet).
  - 19 discovered but not indexed, 2 crawled but not indexed. No manual action, no drop.
  - Sitemap last read 20 Nov.
- **Code guides: 5 of 6 indexed (83%)**, above the 60% line in rule 5. Under section 0, though, code guides stay at most 1 a day, with unique data.
- **Week 1 so far (latest 7 days of data, 14–20 Nov):** 39 tier-1 impressions (goal 50+), 0 tier-1 clicks (goal 0). Indexed pages 16 is **above the week 1 goal of 12**.
- **Clarity, last day:** 1 session (India, likely the owner) over 5 pages. 1 dead click, 4 quick-backs, 71% scroll depth, 25 bot sessions. **AI-app referrals: 0** (no referrers recorded).
- **OpenRouter:** $3.25 used this month (the owner's page-image work on 21 Nov), $6.75 left. No images today: the vehicle pages need no image, and a car image would need Nano Banana Pro at about $0.14.
- **Community data:** not live yet. It moves up to week 2 (section 0, B).

### Blocked
- Nothing. No open owner requests.

### Tomorrow (day 5)
- 2 more vehicle pages, chosen by NHTSA complaint count among best-sellers with any Bing demand: likely the 2019 Ford Escape (Bing 40) and the 2017 Honda CR-V (1,787 complaints).
- A `/cars` hub (make, model, year), linked from the Tools menu, `/recalls`, the VIN tool and the code guides. The vehicle-page breadcrumb then moves to `/cars`.

## 2026-11-21: owner session note (not a daily run; day numbering unchanged)

- **Direction change (owner, 21 Nov evening):** GROWTH-PLAN section 0 is now the top rule. Only work that AI apps can't replace (live official data per vehicle, real prices people paid, working tools, an embeddable widget) or that they will cite (original numbers, dates, sources, CSV, "How to cite this"). Owner said yes to A, B and C (decision 10).
- **Day 4 therefore builds the vehicle report pages** (`/cars/:make/:model/:year`, 2 model-years), instead of the P0301 and P0172 code guides planned above. Code guides drop to at most 1 a day, each with unique data.
- **Also shipped in the owner session on 21 Nov:**
  - the homepage hero (PR #16)
  - a studio photo on 24 pages that doubles as each page's share image (PR #17)
  - the site icon (PR #18)
  - outreach moved to week 2 and a week-3 checkpoint (PR #19)
- **Index after the owner's indexing requests:** 14 pages (Search Console, evening of 21 Nov). The owner also requested indexing for P0300, P0171 and P0442.
- **OpenRouter:** $3.25 of $10 this month. The owner added $10 credit after the account balance ran out mid-batch. Check the account balance as well as the key limit (IMAGE-STYLE.md, Budget).

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
