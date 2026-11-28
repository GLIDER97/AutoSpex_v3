# Silos: when one page ranks for too many different questions

**Standing rule from the owner (24 Nov 2026), binding on every daily run.** When a page ranks for many keywords that ask *different questions*, one page can't answer them all well. Plan a **silo**: the page becomes the **pillar**, and each different question gets its own **supporting page**, all tightly linked. It works with `docs/GROWTH-PLAN.md` section 0 (tier-1 visitors; only work AI apps can't replace or will cite) and `docs/CONTENT-RULE.md`.

## 1. When to plan a silo

Check every Monday, after the content rule's step 1 (`scripts/growth/top_keywords.py`), and for any page the content rule targets:

1. **Pull the page's queries:** every query it ranks for, from the last 90 days of Search Console, with tier-1 impressions.
2. **Sort them by the question they ask,** not by wording. "Car insurance calculator" and "estimate my car insurance" are the same question. "How much car insurance do I need" is a different one.
3. **Plan a silo when both are true:**
   - the page ranks for **30 or more tier-1 queries**
   - **2 or more sub-questions** each have at least 3 queries, or at least 100 US searches in 90 days (Bing `GetKeyword`), and the page's main purpose doesn't answer them

A sub-question the page can answer in one section stays on the page (as a content-rule section). Only a question that needs its own data, tool or depth becomes a supporting page.

## 2. What goes in a silo

- **Pillar:** the page that already ranks. It keeps its URL, never moves, and answers the main question best (with the content-rule piece). It links to every supporting page from a "Guides" section, with descriptive anchor text.
- **Supporting pages:** one per sub-question, under one folder (`/car-insurance/...`). Each one:
  - targets **one** sub-question and its keyword cluster, listed in the keyword map below. No two pages target the same cluster.
  - has an element AI apps can't replace or will cite (section 0): its own tool, an original dataset or a 50-state table from official sources, plus charts and a diagram (`docs/DATA-VIZ.md`)
  - links **up to the pillar** in its first screen ("Estimate your premium") and again at the end
  - links **across** only to other pages in the same silo where it helps the reader
  - links **out** only to closely related pages, such as a vehicle report
  - has breadcrumbs: Home › pillar › page (visible and structured data)
  - meets `docs/PUBLISHING-STANDARD.md` in full (3+ charts and 1+ diagram, original sourced data, embeddable, outreach drafts)
- **Demand evidence before building:** each supporting page needs either Search Console queries already landing on the pillar, or at least 100 US searches in 90 days on Bing. Record that evidence in this file.
- **Build order:** by expected tier-1 visits, meaning search demand times the click share we can realistically reach, highest first. Supporting pages count toward the daily page pace (rule 5).
- **YMYL care:** insurance and money pages need exact, current, sourced facts. Check every legal requirement against the state's own site (DMV, department of insurance or statute) and show the "checked" date. Say plainly that the page isn't financial or legal advice.

## 3. Measuring a silo

At 28 days after each page ships, record in `docs/content-log.md`:
- the pillar's position for its main keywords
- each supporting page's tier-1 impressions and clicks
- the clicks between pages in the silo, from Clarity, where available

A supporting page that stays unindexed or gets no tier-1 impressions after 6 weeks gets its title and intro rewritten, then is merged into the pillar if it still fails.

---

## Silo 1: car insurance (planned 24 Nov 2026)

**Why:** `/insurance-estimator` ranks for **157 queries** (90 days to 22 Nov, almost all US) and brings 66% of the site's impressions. Most ask the pillar's own question ("car insurance calculator / estimate"), but several clusters ask different questions. Bing US 90-day volumes (24 Nov) show large demand next to it.

**Pillar:** `/insurance-estimator`, "car insurance calculator / estimator / estimate". Content-rule piece on day 8 (26 Nov), adding:
- a monthly-cost view ("car insurance cost per month calculator")
- the BLS CPI chart of how premiums have risen
- a premium-breakdown diagram

`/car-insurance` redirects to the pillar (301), so the folder has one clear head.

**Pillar piece shipped 26 Nov** (`docs/content-log.md`): the BLS CPI price guide (3 embeddable charts, CSV), the coverage breakdown diagram and the monthly-cost view. The supporting pages are next, gap insurance first.

**Page 4 (average cost) shipped 28 Nov, ahead of 1–3:**
- Demand: Bing US, 90 days, average car insurance cost 670, average cost of car insurance 138, why is car insurance so expensive 118.
- Gap insurance (1) waits for a citable depreciation source; the Value Shock calculator's figures are an AI estimate.
- Coverage (2) and SR-22 (3) wait until each state's own site can be checked; this sandbox can't reach them (26 Nov).
- The page uses the BLS Consumer Expenditure Surveys, not the CPI chart planned above; the CPI trend stays on the pillar.

**Supporting pages, in build order** (Bing US, 90 days):

| # | Page | Targets (keyword cluster) | Demand evidence | AI-proof / citable element | Data source (must be official or verified) |
|---|---|---|---|---|---|
| 1 | `/car-insurance/gap-insurance-calculator` | gap insurance; gap insurance calculator; do I need gap insurance | **6,436** (15,900 broad) | A **calculator**: the visitor's loan balance against their car's falling value, month by month, showing the gap and when it closes. Chart of the gap over time; a decision diagram ("do you need gap cover?"). | Loan maths (standard amortization). Depreciation: the method and source the Value Shock calculator uses. Publish only with a cited depreciation source. |
| 2 | `/car-insurance/how-much-coverage` | how much car insurance do I need; full coverage car insurance; full coverage vs liability; coverage calculator; third party insurance calculator | **700** + **908** (2,481 broad); 9 pillar queries | A **coverage recommender** (car value, loan or lease, savings) and a **50-state + DC table of minimum liability limits**, each linked to the state's own source. A map-style or ranked chart of the minimums; a decision diagram for full coverage vs liability. | Each state's DMV, department of insurance or statute, with the checked date. |
| 3 | `/car-insurance/sr22` | sr22 insurance; what is an SR-22; how long do you need an SR-22 | **4,739** | A **50-state table**: whether the state uses SR-22 (or FR-44 or another form), how long it's required, and what triggers it, each linked to the state's source. A diagram of how an SR-22 filing works. | State DMV sites and statutes, with the checked date. State pages (`/car-insurance/sr22/<state>`) only if Search Console later shows state queries. |
| 4 | `/car-insurance/average-cost` | average car insurance cost; how much should I be paying; why is car insurance so expensive; car insurance calculator by zip code | **670** + **118**; pillar queries | **Price trend from the BLS CPI for motor vehicle insurance** (monthly, multi-year), compared with car prices and repair costs (CPI series): our own computed figures. Averages by state only from a citable source. | BLS CPI series (free API). State averages: only with a source that allows citation; otherwise left out. |
| 5 | `/car-insurance/teen-drivers` | car insurance for teens; adding a teen driver | **470** (544 broad) | **Crash data by driver age** from NHTSA FARS (our charts) and what it means for premiums; a checklist diagram of ways families lower the cost. | NHTSA FARS / Traffic Safety Facts. |
| 6 | `/car-insurance/cheapest-cars-to-insure` | cheapest cars to insure; insurance estimate by model; average insurance cost by car model | **155**; 7 pillar queries | A model comparison linked to our vehicle reports. | **Only if a source with usable terms exists** (for example HLDI insurance loss results). Otherwise skip, and add an "insurance factors" note to the vehicle reports instead. |

**Pace:** after the pillar piece on 26 Nov, about 2 supporting pages a week, inside the daily pace, alongside the vehicle reports. The order holds unless Search Console shows a cluster growing faster.

**Keyword map (who targets what):**

| Cluster | Page |
|---|---|
| car / auto insurance calculator, estimator, estimate, quote estimate, premium calculator, cost per month | `/insurance-estimator` |
| gap insurance (calculator, do I need) | `/car-insurance/gap-insurance-calculator` |
| how much coverage, full coverage, liability only, minimum coverage by state | `/car-insurance/how-much-coverage` |
| SR-22 (what it is, how long, by state) | `/car-insurance/sr22` |
| average cost, how much should I pay, why so expensive, rates rising | `/car-insurance/average-cost` |
| teen and new drivers | `/car-insurance/teen-drivers` |
| cheapest / most expensive cars to insure, insurance by model | `/car-insurance/cheapest-cars-to-insure` (only if a source exists) |
