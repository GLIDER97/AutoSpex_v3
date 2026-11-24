# Content rule: upgrade the page Google already shows, for the keywords worth the most

**Standing rule from the owner (24 Nov 2026), binding on every daily run.** Each week, find the 20 keywords that bring the most impressions, pick the ones worth the most money to advertisers (high CPC), and turn the page that ranks for them into the best, most citable answer on the web: with original data, charts and diagrams that make complex things easy, and features that make other sites want to link to it.

It works with `docs/GROWTH-PLAN.md` section 0 (only work AI apps can't replace or will cite) and the charts rule in `docs/DATA-VIZ.md`.

## Why it works

- Google is already testing these pages for these searches. Moving a page from position 20 to the top 5 is far faster than ranking a new page.
- High-CPC keywords are the searches advertisers pay most for, so each visitor is worth the most (and later, the most to the owner's parts and car-sales plans).
- Original numbers, clear answers and good charts are what AI answers cite and what other sites link to. Content an AI app can write by itself is neither.

## When

- **Every Monday**, as part of the weekly loop (GROWTH-PLAN section 3): steps 1 to 3.
- **The content piece** (steps 4 to 7) ships that day or in the next run. **One piece a week** to start; two once tier-1 impressions pass 1,000 a week.
- **First run: day 8 (Thu 26 Nov), on `/insurance-estimator`** (it holds 13 of the top 20 keywords, all high-value).

## Step 1: the top 20 keywords

Tier-1 visitors are the goal (GROWTH-PLAN section 0), so keywords are ranked by tier-1 impressions. Run `python3 -I scripts/growth/top_keywords.py <scratchpad>/top-keywords.json`. It ranks the last 28 days of Search Console queries by tier-1 impressions and maps each to the page Google ranks for it. Save the printed table in the log.

## Step 2: the high-CPC ones

- **Real CPC first:** if `data/keyword-cpc.csv` lists the keyword (columns `keyword,cpc_usd,source,date`), the script uses it. That file comes from a real source: a Google Keyword Planner export from the owner (free with a Google Ads account), or a paid keyword API **only after the owner says yes** (GROWTH-PLAN section 10).
- **Otherwise an estimate:** the script tags each keyword's commercial value (high, medium or low) from its intent. Insurance, loans, warranties, prices and repair costs are high. This estimate guides the choice only. It is never shown on the site or presented as a CPC.
- Never invent a CPC figure.
- **Owner's choice (24 Nov): C now, A later.** Use the estimate for now. Once tier-1 impressions pass **1,000 a week**, the status reply asks the owner for a Google Keyword Planner export of the top keywords (option A), and from then on `data/keyword-cpc.csv` is kept current monthly.

## Step 3: pick the target

Take the top-scoring page group (score = impressions x CPC, or x the value weight). Skip a page if it got a content piece in the last 4 weeks and its keywords haven't been re-measured yet; take the next group.

**Update that page; don't create a competing one.** A second page on the same keywords splits Google's signals (cannibalization). For a tool page, the tool stays first, and the content goes below it as a guide section with its own heading and table of contents. Only when the keywords clearly want a separate page (a different intent) does it get one, linked both ways.

## Step 3b: silo check

If the target page ranks for 30+ tier-1 queries that ask 2+ different questions, follow `docs/SILOS.md`:
- The page becomes the pillar and gets this week's piece for its main question.
- Each other question gets a supporting page in the silo plan, built in order of expected tier-1 visits.

Never stretch one page to answer questions it isn't about.

## Step 4: research before writing

- The **questions behind the keywords:** Google suggestions, "People also ask"-style questions, and the page's own long-tail queries in Search Console (all 157 insurance queries, not just the top 20).
- **What currently ranks** for the main keyword: what it covers, and what it lacks (usually original data, clear visuals and sources). The piece must beat the best result on usefulness, not on length.
- **Official, free data** to build original numbers from. Examples: BLS consumer price index for motor vehicle insurance, NHTSA, EPA, FHWA, Census, the Federal Reserve. Note every source with its URL and date.

## Step 5: the content piece

It must meet **`docs/PUBLISHING-STANDARD.md` in full**, at the highest tier:
- excellent SEO for tier-1 searchers
- at least one original, sourced finding that AI answers will cite
- at least 3 charts and 1 explanatory diagram drawn in code
- an embeddable, linkable asset with a CSV and "How to cite this"
- 10 outreach drafts

Paste the standard's definition-of-done checklist into the PR. The standard began as this step and now applies to everything the site publishes.

## Step 6: checks before shipping

- `npm run build` and `npm run test:api` pass.
- claude-seo `page_checks.py` shows 0 issues on the page.
- Chromium at 390 px and 1280 px, light and dark: no sideways scroll and no console or hydration errors. Every chart readable, "Show as table" works, and the tool above still works.
- Every number checked against its source once more.
- Then the usual PR, merge after Vercel and IndexNow (daily task, section 4).

## Step 7: measure and record

- **Record each piece in `docs/content-log.md`:**
  - the date, the page and the target keywords, with their baseline (impressions, clicks, CTR, position over the previous 28 days)
  - the finding
  - the charts and diagrams
  - the outreach sent
- **Re-measure the same keywords at 14 and 28 days.**
  - **If position or clicks haven't improved by day 28:** rewrite the title, intro and first answers (the parts that decide clicks and citations), and note why.
  - **If they have:** do the same for the next keyword group on that page.
- Count links earned (Search Console Links report) and AI-app referrals (Clarity) per piece where the data allows.
