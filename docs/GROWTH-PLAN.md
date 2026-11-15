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
2. **Search Console:** go to Sitemaps, enter `sitemap.xml` and click Submit. Then use URL inspection → Request indexing for `/`, `/fault-code-decoder`, `/vin-lookup`, `/recalls` and `/blog`.
3. **Bing Webmaster Tools** (bing.com/webmasters): sign in and **import the site from Search Console**. It's one click and also covers DuckDuckGo and Yahoo.
4. **Vercel → Domains:** change the `myautospex.com` redirect from 307 to 308.
5. **Search Console access for the agent.** Do this once; it lasts:
   - Google Cloud console → create a project → enable the "Google Search Console API" → create a **service account** → Keys → Add key → JSON.
   - In Search Console → Settings → Users and permissions → Add user → the service account's email, with **Full** permission. Its API access is still read-only; claude-seo's setup guide uses Full for this.
   - In the Claude cloud environment "AutoSpex_v3" (environment menu → Edit), add an environment variable `GSC_SERVICE_ACCOUNT_JSON` containing the JSON file's text. Never paste it into a chat.
   - In the same settings, **delete the network secret "Search Console read-only token"**. It expired on 14 Nov, and while it's saved the proxy replaces the service account's sign-in with it.
6. **Microsoft Clarity** (free; see section 6):
   - Create a project for www.myautospex.com.
   - Install it through your existing Google Tag Manager container (Tags → New → "Microsoft Clarity" template, or a Custom HTML tag with Clarity's snippet), then Publish.
   - In Clarity → Settings → Data Export → Generate API token. In the "AutoSpex_v3" environment settings → Network secrets, add it for host `www.clarity.ms`, header `Authorization`, prefix `Bearer`.
7. **Optional, only if you choose paid traffic:** create a Google Ads or Microsoft Advertising account, add billing, set a daily cap, and connect an ads connector so the agent can manage campaigns.

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
- **Target by day 21:** 200+ pages indexed, 8,000+ weekly impressions, 200+ clicks in the week.

### Week 4 (7–15 Dec): double down on what works
- Put the week's work into the page type and queries that gained most in Search Console, and stop expanding types that aren't getting indexed.
- **Holiday angle:** guides on winter warning lights, battery and tire-pressure codes (P0562, C0750 and similar), and used-car buying checks with the VIN tool.
- **Day 30:** a full report comparing against the forecast, and a plan for days 31–90.
- **Target by day 30, organic only:** 250+ pages indexed, 15,000+ weekly impressions, 300–1,500 visits in the month. Anything paid comes on top.

---

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
