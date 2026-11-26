# Content log

Each content-rule piece and data study, with its target keywords' baseline, finding, charts and outreach (`docs/CONTENT-RULE.md` step 7). Pieces are re-measured at 14 and 28 days. Links earned (Search Console Links report) and AI-app referrals (Clarity) are recorded per piece. Newest first.

## 2026-11-26: `/insurance-estimator`, silo 1 pillar (first content-rule piece)

- **Target cluster** (`docs/SILOS.md` keyword map): car / auto insurance calculator, estimator, estimate, quote estimate, premium calculator, cost per month.
- **Baseline, Search Console, 29 Oct–23 Nov (28 days):**
  - 858 impressions, 0 clicks (CTR 0%), average position 32.1, across 176 queries
  - 848 of the impressions were tier 1

  | Query | Impressions | Clicks | Position |
  |---|---|---|---|
  | car insurance estimator | 94 | 0 | 47.0 |
  | car insurance estimate | 62 | 0 | 45.4 |
  | estimate car insurance | 59 | 0 | 65.8 |
  | auto insurance calculator | 58 | 0 | 44.1 |
  | auto insurance estimator | 56 | 0 | 49.0 |
  | car insurance calculator | 49 | 0 | 35.6 |
  | car insurance estimate calculator | 22 | 0 | 20.5 |
  | calculate car insurance | 12 | 0 | 13.8 |

- **Finding (original, from BLS CPI-U motor vehicle insurance, CUUR0000SETE, data to October 2026):**
  - Prices rose 51.4% in the five years to October 2026, against 22.0% for all items.
  - They peaked in February 2026 and were 4.8% lower by October (−5.0% over the 12 months to September 2026).
  - +52.9% from December 2021 to December 2024, including +20.3% in 2023.
  - Five-year comparison: repair and maintenance +45.0%, gasoline +31.9%, new vehicles +10.8%, used −7.4%.
- **Charts:**
  - a line chart of insurance vs all items, January 2017 = 100
  - yearly change columns
  - five-year change bars across driving costs
  - each embeddable at `/embed/chart/car-insurance-price-trend`, `/embed/chart/car-insurance-yearly-change` and `/embed/chart/driving-costs-5-years`
- **Diagrams:**
  - what each part of a policy pays for, plus the state-minimum and full-coverage brackets (sourced to the NAIC consumer guide, checked 26 Nov)
  - how the calculator works out the estimate (4-step flow)
- **Also:**
  - a monthly-cost view in the result (per month, 6-month policy, per year)
  - CSV of 118 months, "How to cite this", Dataset markup, `llms.txt`
  - new title "Car Insurance Calculator: Monthly Cost Estimate" and H1 "Car insurance calculator"
- **Outreach:** 10 email drafts and 2 contact-form texts in `docs/outreach/2026-11-26-car-insurance-prices.md`: Insurance Journal, Claims Journal, Carrier Management, InsuranceNewsNet, CollisionWeek, Autobody News, Consumer Federation of America, United Policyholders, Axios, Repairer Driven News, plus Clark.com and Money Talks News forms. Waiting for the owner's main session to save them as Gmail drafts.
- **Re-measure:** 10 Dec (14 days) and 24 Dec (28 days). Data refresh: monthly, after BLS publishes the CPI (`scripts/insurance/cpi.mjs`).
- **Links earned:** none yet.

## 2026-11-24: `/studies/suv-owner-complaints`, first data study

- **Finding:** NHTSA owner complaints for 20 popular SUVs, model-years 2015–2022: 83,871 complaints across 160 model-years. The 2017 Ford Escape has the most (2,714).
- **Charts:**
  - top model-years
  - model × year heatmap
  - problem areas
  - fires
  - complaints by filing year
  - a 4-step buyer flow
  - 3 embeddable
- **Outreach:** 9 emails sent by the owner on 25 Nov (`docs/outreach/2026-11-25-suv-complaints-study.md`); the Autoblog tips form not used yet.
- **Re-measure:** 8 Dec and 22 Dec. Indexing: "Discovered – currently not indexed" on 26 Nov.
- **Links earned:** none yet.
