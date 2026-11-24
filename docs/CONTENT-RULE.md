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

Run `python3 -I scripts/growth/top_keywords.py <scratchpad>/top-keywords.json`. It ranks the last 28 days of Search Console queries by tier-1 impressions and maps each to the page Google ranks for it. Save the printed table in the log.

## Step 2: the high-CPC ones

- **Real CPC first:** if `data/keyword-cpc.csv` lists the keyword (columns `keyword,cpc_usd,source,date`), the script uses it. That file comes from a real source: a Google Keyword Planner export from the owner (free with a Google Ads account), or a paid keyword API **only after the owner says yes** (GROWTH-PLAN section 10).
- **Otherwise an estimate:** the script tags each keyword's commercial value (high, medium or low) from its intent. Insurance, loans, warranties, prices and repair costs are high. This estimate guides the choice only. It is never shown on the site or presented as a CPC.
- Never invent a CPC figure.

## Step 3: pick the target

Take the top-scoring page group (score = impressions x CPC, or x the value weight). Skip a page if it got a content piece in the last 4 weeks and its keywords haven't been re-measured yet; take the next group.

**Update that page; don't create a competing one.** A second page on the same keywords splits Google's signals (cannibalization). For a tool page, the tool stays first, and the content goes below it as a guide section with its own heading and table of contents. Only when the keywords clearly want a separate page (a different intent) does it get one, linked both ways.

## Step 4: research before writing

- The **questions behind the keywords:** Google suggestions, "People also ask"-style questions, and the page's own long-tail queries in Search Console (all 157 insurance queries, not just the top 20).
- **What currently ranks** for the main keyword: what it covers, and what it lacks (usually original data, clear visuals and sources). The piece must beat the best result on usefulness, not on length.
- **Official, free data** to build original numbers from. Examples: BLS consumer price index for motor vehicle insurance, NHTSA, EPA, FHWA, Census, the Federal Reserve. Note every source with its URL and date.

## Step 5: the content piece (the quality bar)

**Search optimization**
- Main keyword in the title tag (about 60 characters, written to be clicked), the H1 or the guide's H2, and the first 100 words. Close variants in the H2s and body, naturally, never stuffed.
- Meta description of 120–160 characters that promises the specific answer and data.
- Question-style H2s taken from step 4. Each starts with a direct one- or two-sentence answer (what AI answers quote), then the detail.
- A short table of contents with anchor links for long sections.
- Links to the related tools, vehicle reports, studies and code guides, and from them back to this page.
- Structured data that matches the content: `FAQPage` only for real Q&A on the page, and `Dataset` for any table we publish. `HowTo` only for real steps.

**Original, citable data (required)**
- At least **one finding nobody else publishes**, computed by us from official data. For example: "car insurance prices rose X% from <month year> to <month year> (BLS CPI, motor vehicle insurance)". Every figure has its source link and date.
- A **key numbers** box at the top of the section, and a **Key findings** list of 3–5 short, quotable sentences that a writer or an AI answer can lift as-is.
- **Method and limitations** in plain words. Say what the data can't tell you.
- **Never invented:** no made-up stats, quotes, experts, reviews, ratings or testimonials (GROWTH-PLAN section 5).

**Charts and diagrams (required, drawn in code, $0)**
- **At least 3 charts** from the chart kit, picked by `docs/DATA-VIZ.md` section 1: trends over time, comparisons, and shares.
- **At least 1 explanatory diagram** that makes a complex idea simple. Examples: what makes up a premium (a share bar with labels), how a factor changes the price (a flow or before-and-after), a decision path ("do I need full coverage?").
  - Drawn in SVG or HTML in code, never an AI image (IMAGE-STYLE rule 2: no facts in AI images).
- **Every chart and diagram gets:**
  - a title that states the takeaway
  - a source line
  - "Show as table"
  - alt text or a text summary
  - readability at 390 px wide and in dark mode

**Made to earn links**
- **Embed this chart:** a copy-paste snippet for each main chart, with a credit link back to the page.
- A **CSV download** of the data, and a **"How to cite this"** line with the page URL and the date.
- A permanent URL, a visible "Updated <date>", and "Reviewed by the MyAutoSpex Editorial Team" (linked to the editorial policy).
- **Outreach:** after it ships, draft 10 short, personal emails to relevant sites (car blogs, consumer finance and insurance writers, local news money columns). Each offers the finding and the embeddable chart. They're saved as Gmail drafts the owner sends (decision 8); the agent never sends anything.

**Plain writing**
- Short sentences, US English, no filler or hype.
- Length set by what answers the questions: usually 1,200–2,500 words added. A page doesn't get longer just to be longer.

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
