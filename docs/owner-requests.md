# Owner requests

Things the daily runs need the owner's permission for (`docs/GROWTH-PLAN.md` section 10). They are asked in the reply to "status"; each answer is recorded here with the date.

## Open

Nothing open.

## Answered

| Date | Request | Answer |
|---|---|---|
| 2026-11-16 | Lead forms: does anyone follow up? | Nobody: forms replaced with direct links |
| 2026-11-19 | Route daily runs through this session | Yes |
| 2026-11-19 | Start day 1 now | Yes |
| 2026-11-19 | Move daily runs out of the long main chat to save Claude usage | Yes: runs now fire into a dedicated session ("MyAutoSpex daily growth runs"); the main chat answers "status" |
| 2026-11-19 | Repair-cost source | None: pages show no dollar figures and link to the code lookup's labeled AI estimate |
| 2026-11-21 | Make the myautospex.com → www redirect permanent | Done by the owner: verified live as 308 on 21 Nov |
| 2026-11-21 | Spending limit on the website's own OpenRouter key | Done by the owner |
| 2026-11-21 | Save outreach emails as Gmail drafts | **Yes.** The agent may create drafts in the owner's Gmail (Gmail connector); it never sends. The owner reviews and clicks Send. Owner also given guides for the Places quota/budget alert and archiving the Apps Script deployment (21 Nov) |
| 2026-11-21 | Request indexing for 10 key pages in Search Console | Done by the owner on 21 Nov (track indexing of those pages from the next run) |
| 2026-11-21 | Image style for the site | Styles 1 (studio catalog) and 2 (brand color-block); site must feel premium, authentic and highly trustworthy (`docs/IMAGE-STYLE.md`) |
| 2026-11-21 | Run a 4-model image test (~$0.50) | Yes. Result: Nano Banana Pro for heroes and cars, Nano Banana 2.1 for everything else |
| 2026-11-21 | Allow Nano Banana Pro (~$0.14) above the $0.10 cap | Yes, for homepage hero images and any image showing a car |
| 2026-11-21 | Pick the homepage hero image | **Option 2** (parts and tools on green and yellow, no car). Live on the homepage from 21 Nov |
| 2026-11-21 | Add credit to OpenRouter (balance was $0.44 after the page-image batch hit HTTP 402) | **Done by the owner:** $10 added (balance $9.04 at 21 Nov); the last 5 page images were made |
| 2026-11-21 | Images on every page, not just the homepage | Yes, but the articles keep their own images. Done: 24 page images (14 tools, 6 code guides plus the index, about, editorial policy, contact, 404) |
| 2026-11-21 | Request indexing for `/codes/p0300`, `/codes/p0171` and `/codes/p0442` in Search Console | Done by the owner on 21 Nov (track them from the next run; the first 10 requests took the index from 7 to 14) |
| 2026-11-21 | Re-aim the plan at work AI apps can't replace or will cite: A vehicle report pages from live NHTSA and EPA data, B community real prices sooner, C an embeddable recall checker | **Yes to all.** Standing rule: only work AI apps can't beat or will cite (GROWTH-PLAN section 0, decision 10) |
| 2026-11-22 | Charts on every data page | **Yes (owner's instruction):** every page with data or data insights shows it with charts (bars, histograms, timelines, share bars, rating stars and similar), drawn by Claude in code, never with an AI or paid API. Standing rule: GROWTH-PLAN section 0 charts rule, `docs/DATA-VIZ.md` |
| 2026-11-22 | Show every Wrap Designer image on the site, with details, light files and SEO/AEO; change the navigation if useful | **Yes (owner's instruction).** Built as `/wrap-gallery` with an "Explore" menu. Previews from visitors' own photos are never published (privacy); drawn previews are published after the daily review. Images free to reuse under CC BY 4.0 with credit. `docs/WRAP-GALLERY.md`, decision 12 |
| 2026-11-24 | Test the wrap gallery with one preview | **"You do it."** Done from the owner's main session through the live Wrap Designer in a browser: 2021 Tesla Model 3, full matte light-grey wrap, black wheels. It drew in 8 seconds (about $0.009 on the website's key) and was **saved as design #1**: `/api/wraps` lists it, the anonymous option counts went up, and `/images/wraps/v/1/...-1200.webp`, `-640.webp` and `-share.jpg` are served with the embedded metadata. Saving works; the empty gallery meant nobody had drawn a vehicle yet. The next daily run reviews it. Note: `/api/wraps` is cached for 5 minutes at the CDN, so check with a new query string |
| 2026-11-24 | Content rule: top 20 keywords by impressions, high-CPC ones, citable content with charts and diagrams on the ranking page | **Owner's own request.** Written as `docs/CONTENT-RULE.md` + `scripts/growth/top_keywords.py`; GROWTH-PLAN section 0, section 3 (Mondays), decision 13. First piece: `/insurance-estimator` on 26 Nov, then the VIN lookup |
| 2026-11-24 | Silo structure when one page ranks for many different questions; every effort aimed at tier-1 visitors only | **Owner's own instruction.** Section 0 goal + silo rule, `docs/SILOS.md` with silo 1 (car insurance: pillar `/insurance-estimator`; then gap insurance 6,436, coverage/full coverage 1,608, SR-22 4,739, average cost 788, teen drivers 470 Bing US searches in 90 days). Decision 14. Tier-1 country list in the scripts corrected to section 9's definition |
| 2026-11-24 | Where real CPC figures come from (A Keyword Planner export, B paid API, C estimate) | **C now, A later.** The intent-based estimate guides the content rule. Once tier-1 impressions pass 1,000 a week, the status reply asks for a Google Keyword Planner export (`data/keyword-cpc.csv`) |
| 2026-11-24 | Apply the quality bar to everything published | **Owner's own instruction.** `docs/PUBLISHING-STANDARD.md`: SEO, AI-citable, charts and diagrams, linkable, for every page type, with a definition-of-done checklist in every PR. Decision 15 |
| 2026-11-25 | Save the SUV study's outreach emails as Gmail drafts | **Done by the main session (decision 8):** 9 drafts saved in the owner's Gmail (The Drive, The Autopian, Motorious, TTAC, Motor1, Center for Auto Safety, Jalopnik, CarEdge, ABC7). Nothing sent. The owner checks the 4 "confirm first" addresses (Center for Auto Safety, Jalopnik, CarEdge, ABC7), replaces [Your name] and sends. The Autoblog tips-form text is in `docs/outreach/2026-11-25-suv-complaints-study.md` for the owner to paste if they want. Record sends in that file's tracking table |
| 2026-11-28 | Save the car insurance outreach emails as Gmail drafts | **Done by the main session (decision 8):** 10 drafts saved, each with the average-cost P.S. and the owner's backlink line. Nothing sent. Repairer Driven News has no recipient yet (copy the address from its contact page); confirm Claims Journal (newsdesk@ vs editorial@) and Carrier Management (carriermanagement.com vs wellsmedia.com) first. Clark.com and Money Talks News are contact forms (text in the outreach file). No replies yet to the 9 SUV-study emails (checked 28 Nov) |
