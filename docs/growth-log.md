# Growth log

Newest entry first. Written by the daily growth run; see `docs/GROWTH-PLAN.md`.

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
