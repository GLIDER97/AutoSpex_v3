# 30-day growth plan: www.myautospex.com

**Goal set by the owner:** 10,000 visitors from tier-1 countries (US, UK, Canada, Australia and similar) between 16 Nov and 15 Dec 2026, with the day-to-day work done by a scheduled Claude agent.

**Starting point (Search Console, 14 Nov 2026):**
- 2 clicks and 901 impressions since January, at an average position of 59.
- 4 of 31 URLs indexed.
- Most impressions came from outside the tier-1 countries.
- The technical fixes went live on 15 Nov; the PR #1 follow-ups (internal links, titles, images) are waiting to be merged.

This file is the agent's instructions as well as the owner's plan. The agent reads it at the start of every run and records its progress in `docs/growth-log.md`.

---

## 1. Honest forecast

Organic search can't deliver 10,000 tier-1 visitors in 30 days for this site:
- **Indexing is slow.** Google takes days to weeks to crawl and index pages on a new domain with no links, and new pages usually start on page 3–6 of results.
- **Volume needs top rankings.** 10,000 visits a month from search means ranking in the top 3 for terms with tens of thousands of monthly searches combined.
- **The competition is strong.** Those terms are held by AutoZone, RepairPal, Kelley Blue Book, Carfax, NHTSA and obd-codes.com, which have years of links.
- **Mass-producing pages backfires.** Publishing hundreds of AI pages to force it violates Google's "scaled content abuse" spam policy and can get the whole site demoted.

**My rough estimate for organic only:** 300–1,500 visits in the 30 days, most of them in the last two weeks. It then compounds: plausibly 2,000–10,000 a month by month 3–6, if the content and link work below keeps going. These are estimates, not promises.

**To reach 10,000 in 30 days, the gap has to come from a channel that doesn't wait for Google to rank you:**

| Channel | Can the agent run it alone? | Realistic visitors in 30 days | Cost |
|---|---|---|---|
| Organic search (this plan) | Yes | 300–1,500 | Free |
| Bing and DuckDuckGo via IndexNow | Yes | 50–300 | Free |
| Paid search (Google or Microsoft Ads, US only) on the tool pages | Yes, with a connector such as Adspirer, after you fund an ad account | ≈ budget ÷ cost per click. At an estimated $0.50–$2.00 per US click, 10,000 clicks costs about $5,000–$20,000 | Ad spend |
| Reddit (r/MechanicAdvice, r/cars, r/whatcarshouldIbuy), Product Hunt, car forums | **No.** Automated posting there is spam and gets accounts and domains banned. It needs a real person helping people and mentioning the tools where they genuinely help | 0–5,000+, very uneven | About 15 minutes a day of your time |
| Outreach for links (car blogs, local news, "free tools" lists) | Partly. The agent can find targets and draft emails; sending them needs your Gmail connected and your approval | Small directly; this is what makes rankings stick | Free |

**Bottom line:** autonomous work can make the site rank and grow. Hitting 10,000 in the first 30 days needs a paid budget, or a person doing community distribution. The owner decides which; see section 7.

---

## 2. One-time setup (owner, about 45 minutes total)

1. **Merge PR #1** (internal links, titles, WebP images).
2. **Search Console (optional):**
   - The agent submits `sitemap.xml` itself once it has Search Console access (step 5), and Google already finds the sitemap through `robots.txt`.
   - "Request indexing" has no API. Doing it by hand for `/`, `/fault-code-decoder`, `/vin-lookup`, `/recalls` and `/blog` can speed up the first crawl, but it isn't required.
3. **Bing Webmaster Tools** (bing.com/webmasters): sign in and **import the site from Search Console**. It's one click and also covers DuckDuckGo and Yahoo.
4. **Vercel → Domains (optional, small impact):** change the `myautospex.com` redirect from 307 to 308. Every page already declares the `www` address as canonical, and the Vercel connector can't change this setting.
5. **Search Console access for the agent.** Do this once; it lasts:
   - Google Cloud console → create a project → enable the "Google Search Console API" → create a **service account** → Keys → Add key → JSON.
   - In Search Console → Settings → Users and permissions → Add user → the service account's email, with **Full** permission. Full lets the agent submit the sitemap; it can't remove the site or change owners.
   - In the Claude cloud environment "AutoSpex_v3" (environment menu → Edit), add an environment variable `GSC_SERVICE_ACCOUNT_JSON` containing the JSON file's text. Never paste it into a chat.
   - In the same settings, **delete the network secret "Search Console read-only token"**. It expired on 14 Nov, and while it's saved the proxy replaces the service account's sign-in with it.
6. **Microsoft Clarity** (free; see section 6):
   - Create a project for www.myautospex.com.
   - Install it through your existing Google Tag Manager container (Tags → New → "Microsoft Clarity" template, or a Custom HTML tag with Clarity's snippet), then Publish.
   - In Clarity → Settings → Data Export → Generate API token. In the "AutoSpex_v3" environment settings → Network secrets, add it for host `www.clarity.ms`, header `Authorization`, prefix `Bearer`.
7. **Free keyword data:** in Bing Webmaster Tools (after step 3), go to Settings (gear icon) → API Access → API Key → Generate. In the "AutoSpex_v3" environment settings, add it as the environment variable `BING_WEBMASTER_API_KEY`. claude-seo's Bing scripts read the same variable.
8. **Optional, only if you choose paid traffic:** create a Google Ads or Microsoft Advertising account, add billing, set a daily cap, and connect an ads connector so the agent can manage campaigns.

---

## 3. What the daily agent does

**Schedule:** every day at 06:36 IST. It runs as a fresh cloud session on the `AutoSpex_v3` environment with this repository.

**Every run, in this order:**
1. **Read:** this plan, `docs/growth-log.md`, and the latest Vercel deploy state of `main`.
2. **Measure.** Read Search Console for the last 3 days and the last 28 days:
   - clicks, impressions, CTR and position, by page, query and country
   - index status of every sitemap URL (URL Inspection API, at most 200 per day)

   Then read the Clarity insights for the last day: rage clicks, dead clicks, scroll depth and quick-backs by page. Append one row per day to `docs/growth-metrics.csv`: date, clicks, impressions, tier-1 clicks, pages indexed and pages published.
3. **Index.** Submit every new or changed URL from yesterday's deploy to IndexNow (Bing, Yandex and others). Note any page that has been "Discovered – currently not indexed" for more than 7 days.
4. **Do today's work item** from the roadmap below: build pages, improve pages or fix problems. **At most 2 new pages a day**, each meeting the quality bar in section 5.
5. **Ship:**
   - Build (`npm run build` must pass).
   - Run the page checks (claude-seo `page_checks.py` on the changed pages).
   - Load the changed pages in a browser and check for hydration errors.
   - Open a PR and, if the owner allowed it (section 7), merge it once Vercel's preview passes.
6. **Log:** in `docs/growth-log.md`, record what changed, why, which numbers moved, and tomorrow's work item.

**Every Monday, additionally:**
- **Quick wins:** queries ranking 5–20 with 50+ impressions → improve the matching page's title, intro, headings and FAQ for that query.
- **Low click-through:** pages with impressions but CTR under 1% → rewrite the title and description.
- **UX fixes:** act on Clarity's findings on the top 5 pages (move the main action above the fold, fix dead clicks, shorten forms).
- **Audit:** a full claude-seo audit plus Lighthouse on the 6 most-visited pages; fix anything high severity.
- **Report:** a weekly summary in the log, comparing against the targets in section 4.

---

## 4. 30-day roadmap

The tier-1 focus means **US first**: the content already uses US prices, NHTSA and the EPA.

### Week 1 (16–22 Nov): get indexed, build the page systems
- **Day 1:**
  - IndexNow: add a key file to `public/` and a script that submits changed URLs after each deploy.
  - Start the growth log and the metrics file.
- **Days 1–3: OBD-II code pages, the biggest long-tail opportunity.** Build a `/codes/:code` template rendered from a reviewed data file (`data/codes.json`). Each page gets:
  - the standard SAE definition
  - common causes and symptoms
  - whether it's safe to drive
  - a typical US repair cost range, with a linked source
  - related codes
  - a "decode this with your car" link into `/fault-code-decoder`
  - FAQ

  Launch with the 10 most-searched codes: P0420, P0300, P0171, P0455, P0442, P0128, P0401, P0172, P0174 and P0301.
- **Days 4–5: recall pages built from NHTSA's free API.** Build `/recalls/:make/:model/:year` from a weekly data snapshot. Launch with the 10 best-selling US models for 2018–2024 (Ford F-150, Chevrolet Silverado, Ram 1500, Toyota RAV4, Honda CR-V, Toyota Camry, Nissan Rogue, Jeep Grand Cherokee, Toyota Tacoma and Honda Civic).
- **Days 6–7:** link both page types from the tool pages, the homepage and the sitemap, and add them to `llms.txt`.
- **Target by day 7:** 60+ pages indexed in Google, 100+ in Bing, first impressions on code pages.

### Week 2 (23–29 Nov): grow carefully, fix what users hit
- Add about 2 code pages a day, in search-demand order.
- Add recall pages for 10 more models, only once the first batch shows as indexed.
- Fix the first Clarity findings: dead clicks, rage clicks, and pages people leave quickly.
- Monday: the quick-wins pass on queries ranking 5–20.
- **Target by day 14:** 120+ pages indexed, 3,000+ weekly impressions, 50+ clicks in the week, at least 40% of clicks from tier-1 countries.

### Week 3 (30 Nov–6 Dec): depth and links
- Add cost guides that link the tools together, such as "Catalytic converter replacement cost by car" and "Is it worth fixing a car with 150,000 miles?", each with sourced figures.
- **Link outreach (needs Gmail connected and the owner's approval):** list 30 relevant sites, such as car blogs, "best free car tools" lists and local news "money-saving" columns, and draft personalized emails. No mass sending.
- Rewrite titles and intros on pages with high impressions and low CTR.
- From day 15: build the community data feature (section 4d).
- **Target by day 21:** 200+ pages indexed, 8,000+ weekly impressions, 200+ clicks in the week.

### Week 4 (7–15 Dec): double down on what works
- Put the week's work into the page type and queries that gained most in Search Console, and stop expanding types that aren't getting indexed.
- **Holiday angle:** guides on winter warning lights, battery and tire-pressure codes (P0562, C0750 and similar), and used-car buying checks with the VIN tool.
- **Day 30:** a full report comparing against the forecast, and a plan for days 31–90.
- **Target by day 30, organic only:** 250+ pages indexed, 15,000+ weekly impressions, 300–1,500 visits in the month. Anything paid comes on top.

---

## 4a. Free keyword research (no paid tools)

The owner chose not to pay for Semrush, Ahrefs or Ubersuggest. The agent picks topics with these free sources, in this order:

1. **Google Search Console** (once the service account is set up). These are the real queries the site already appears for. Queries ranking 5–20 with impressions are the best opportunities, because the page only needs improving.
2. **Bing Webmaster Tools keyword API** (free, official; needs `BING_WEBMASTER_API_KEY`). It returns real Bing search volumes by country:
   - `GetKeyword`: `https://ssl.bing.com/webmaster/api.svc/json/GetKeyword?q=<query>&country=us&language=en-US&startDate=<date>&endDate=<date>&apikey=<key>`
   - `GetRelatedKeywords`, with the same parameters, for related terms and their volumes.

   Bing's volumes are smaller than Google's but rank topics in roughly the same order, which is all the agent needs to prioritize. Use the US market for tier-1 focus, and keep it to about 100 calls a day.
3. **Google search suggestions** (free, no key): `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=<query>`. These show how people actually phrase searches. For example, "p0420 code" suggests "chevy", "toyota", "ford", "bank 1" and "how to fix", which become sections and FAQs on the P0420 page. Use them for phrasing and subtopics, not volumes. Keep it light: a few dozen requests a day, a second or more apart.
4. **NHTSA complaint counts** (free; `api.nhtsa.gov` is already allowed). For recall pages, models with more owner complaints and recalls get more searches, so build those first.

**How the agent uses them:** before writing a page, it checks the target query's Bing volume and Google suggestions and records both in the log. It writes the page around the main query plus the suggested subtopics. Every Monday, it re-ranks the backlog by Search Console impressions first, then Bing volume.

## 4b. Images, charts and the OpenRouter budget

The owner added an OpenRouter key, saved as a hidden network secret for `openrouter.ai`, with a **budget of $10 a month**.

- **Budget check first, every time.** Before generating any image, call `GET https://openrouter.ai/api/v1/key` and read `usage_monthly`.
  - If it is **$9.00 or more**, generate no images for the rest of the calendar month and note it in the log.
  - Record every generation (date, model, cost, file) in `docs/openrouter-spend.csv`.
- **Volume and model.**
  - At most **1 AI image per new article**, and none for refreshed articles.
  - Pick the cheapest image-capable model from `GET https://openrouter.ai/api/v1/models` (output modalities include image), and never one costing more than $0.10 per image.
- **What AI images may show.** Only illustrative hero images (a car on a road, a dashboard glow, a mechanic's tools).
  - No text, labels, numbers, logos, real brands or real people.
  - Never use them to show facts such as a part's location, a wiring diagram or a warning-light chart: image models get those wrong, and on a car-repair site that is misinformation.
- **Charts and diagrams that carry facts are drawn in code** (SVG or HTML) from the sourced data, with a source caption. Examples: repair cost by model, recalls by year.
- **Every image:**
  - WebP, at most 1200 px wide and about 120 KB
  - a descriptive file name (`p0420-catalytic-converter.webp`)
  - real `width` and `height`
  - alt text that describes it
  - `loading="lazy"` unless it's the first image

  Indexable pages carry `max-image-preview:large`, so these images can appear in Google Discover.
- **Monday refresh:** also refresh 1–2 older articles. Add sources, fix outdated figures, add links to newer pages, and change `meta.date` only when the content meaningfully changes.

## 4c. New tools or new content?

**For the first 30 days, content comes first.**
- Pages answering specific searches (codes, recalls, costs) are what a new site can get indexed and ranked quickly.
- New tools mostly compete for broad, hard terms ("vin decoder", "depreciation calculator") held by big sites, and they take longer to rank.

Tools matter differently:
- they keep visitors on the site
- they are what other sites link to
- every content page should link to, or pre-fill, the matching tool

So:
- Improve the existing 13 tools using Clarity data.
- The **one new tool** for these 30 days is the community data feature in section 4d, which the owner chose on 16 Nov. No other new tools.

## 4d. Community data: repair-cost reports and "What fixed it?" (from day 15)

The owner chose these two features on 16 Nov, to build a real, owner-reported dataset no competitor has. Nothing in them needs daily human moderation.

**1. "What did you pay?" repair-cost reports.** Asked right after a result in the code lookup and the repair quote checker, and on code and cost pages.
- One short form:
  - car year, make and model (pre-filled where the tool already knows them)
  - the code or repair, chosen from a list
  - total price paid
  - shop type: dealer, independent or DIY
  - US state
  - month of the repair
- No names, emails, free text, photos or ZIP codes.

**2. "What fixed it?" on code pages.**
- One tap on a list of that code's known fixes, taken from the page's own content, plus "Something else".
- No text box in the first version.
- One vote per visitor per code.

**How it works:**
- **Storage:** a free Postgres database the owner connects once in Vercel (Storage → Create Database → Neon, connected to this project). Only the site's `api/` serverless functions use it. The agent's sandbox never holds database credentials.
- **Abuse protection without extra accounts:**
  - only allowed values, and price limits per repair
  - a hidden honeypot field and a minimum time on the page
  - a few submissions per visitor per day, tracked with a salted hash of the IP that is deleted after 30 days
  - outlier flags based on the median
- **Only totals are public:**
  - A public endpoint returns stats only where at least **5 reports** exist: median, typical range and count for costs, and percentages for fixes. Individual reports are never shown.
  - Each day the agent saves a snapshot to `data/community-stats.json`, and the pre-render writes those numbers into the static pages, so Google sees them.
  - Pages label them "Reported by N MyAutoSpex visitors" with the date range.
- **No seeding:** never add made-up reports or votes, not even to make a page look active.
- **Encourage contributions honestly:** ask at the moment a tool shows its result, keep it to taps, and show impact ("Your report helped N drivers compare prices").
- **Health check:** `/api/community/health` reports whether the database is connected, so the agent can tell whether the owner's setup is done.
- **Legal pages:** add the data use to the Privacy Policy, and a short contribution clause to the Terms.

**Timing:** build from day 15 (1 Dec). If the health check shows no database, ship the feature switched off, log the owner action and carry on with content.

## 5. Quality rules the agent must follow (non-negotiable)

- **At most 2 new pages a day,** each with something a reader can't get from a generic AI answer: real data (NHTSA, EPA), a working tool link, specific symptoms and steps.
- **Every price, statistic, law or rule links to its source.** No source means the figure stays out.
- **No first-person experience claims,** no invented people, reviews, ratings or testimonials. Pages are credited to the MyAutoSpex Editorial Team.
- **No doorway pages:** don't make near-duplicate pages that differ only by a keyword, and don't create a recall page for a model/year with no recalls (link to the model's other years instead).
- **Don't change how a tool calculates or answers** unless it's a clear bug fix with before and after checks in the PR.
- **Never post to Reddit, forums, social media or review sites,** never send email without the owner's approval, and never buy or exchange links.
- **The build and the browser checks must pass before merging.** If a deploy breaks a page, revert first and investigate after.
- **Stop and flag:** if Search Console shows a manual action or a sudden drop in indexed pages, stop publishing and write it in the log.

---

## 6. Microsoft Clarity: yes, connect it

It's free, it installs through your existing Tag Manager container without code changes, and its export API gives the agent each page's:
- rage clicks
- dead clicks
- scroll depth
- quick-backs

Those drive the weekly UX fixes (section 3). It doesn't bring visitors by itself, and it only becomes useful once there's traffic to watch, from about week 2. It adds one small script to every page, which the Monday Lighthouse run watches.

---

## 7. Owner decisions (15 Nov 2026)

1. **Paid traffic: none.** This plan is organic only, so the 30-day expectation is the organic forecast in section 1, not 10,000. Revisit at day 30.
2. **Merging: allowed.** The agent may merge its own PRs, and PR #1, once Vercel's preview passes and its own build and browser checks pass.
3. **Start: 16 Nov 2026.** Until the owner's setup is done, the agent builds and ships pages and skips the measurement steps it has no access to, noting that in the log.
4. **Community distribution:** not chosen. The agent doesn't post anywhere.
5. **Community data (16 Nov):** build repair-cost reports and "What fixed it?" (section 4d) from day 15. My Garage recall alerts and a parts marketplace are not in scope.
