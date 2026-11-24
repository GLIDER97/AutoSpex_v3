# Publishing standard: the bar for everything we publish

**Standing rule from the owner (24 Nov 2026), binding on every run and every session.** Every content piece, blog post, guide, vehicle report, code guide, data study, silo page, tool page or hub we create, or substantially update, must:
- have **excellent SEO**
- be **valuable enough for AI search engines to cite** in their answers
- include **impressive graphs and diagrams** that make complex information easy to understand
- be **so valuable and authoritative that other sites in the niche naturally want to link to it**

The owner's words: "make sure any content piece or blog post or anything you create have excellent SEO optimization that AI search engines would consider valuable enough to cite in their responses. It should also include impressive graphs and diagrams that make complex information easy for users to understand. The content should be so valuable and authoritative that other website owners in the same niche would naturally want to link to it and give it backlinks."

**Scope:** any page whose job is to attract visitors from search. It doesn't apply to legal pages, the 404 page or small fixes (a typo, a broken link). If a page can't meet the standard, don't publish it. Improve it until it does, or drop it.

It works with `docs/GROWTH-PLAN.md` section 0 (tier-1 visitors; work AI apps can't replace or will cite), `docs/DATA-VIZ.md` (how charts look and behave), `docs/CONTENT-RULE.md` and `docs/SILOS.md`.

## 1. Excellent SEO, for tier-1 searchers

- **One clear target:** a main keyword and its cluster, from tier-1 demand (Search Console tier-1 impressions or Bing US volume), recorded in the log. It must not overlap another page's cluster (`docs/SILOS.md` keyword map).
- **Title tag** about 60 characters, with the main keyword near the front, written to be clicked. **Meta description** 120–160 characters that promises the specific answer or data.
- **One H1.** The main keyword appears in the H1 and the first 100 words. Close variants go in H2s and the body, naturally, never stuffed.
- **Question-style H2s** from real searches (Google suggestions, Search Console queries). Each one starts with a direct 1–2 sentence answer, then the detail.
- **A table of contents** with anchor links on long pages.
- **Internal links:**
  - to the related tool, pillar, vehicle reports, studies and guides
  - from at least 2 relevant existing pages to the new one
  - descriptive anchor text, never "click here"
- **Clean URL** (lowercase, hyphens, no dates). Canonical URL, sitemap entry with `lastmod`, `llms.txt` entry, IndexNow after deploy.
- **Structured data** that matches what's on the page: Article, Dataset, FAQPage (real Q&A only), HowTo (real steps only), BreadcrumbList, WebApplication for tools.
- **Fast and accessible:** loads fast on a phone, real image sizes, alt text, readable at 390 px and in dark mode, no console or hydration errors. claude-seo `page_checks.py` shows 0 issues.

## 2. Worth citing by AI search

AI answers cite pages that give them a fact they can't get elsewhere, stated clearly, with a source.

- **At least one original finding:** a number we computed from official or verified data (NHTSA, EPA, BLS, FHWA, Census, the Federal Reserve, state agencies, or our own community data) that nobody else publishes in that form.
- **A key-numbers box** near the top, and **3–5 quotable key findings**: short, self-contained sentences with the number, the date and the source.
- **Every figure has a source link and a date.** Show "Data as of" and "Updated" dates.
- **The method and its limits,** in plain words.
- **A CSV download** of any table we publish, and a **"How to cite this"** line with the URL and date.
- **Trust signals:**
  - "Reviewed by the MyAutoSpex Editorial Team" (linked to the editorial policy)
  - legal or money facts checked against the official source, with the checked date
  - "not legal or financial advice" where it applies
- **Never invented:** no made-up statistics, quotes, experts, reviews, ratings, testimonials or trust badges (GROWTH-PLAN section 5).
- **AI crawlers allowed:** GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended and Bingbot are never blocked.

## 3. Impressive graphs and diagrams that make it easy

All drawn in code from the chart kit (`components/tool/charts.tsx`), following `docs/DATA-VIZ.md`. Never an AI image or a paid API for anything that carries facts.

**Minimum by page type**

| Page type | Charts | Explanatory diagrams |
|---|---|---|
| Content-rule piece, data study, silo pillar or supporting page | 3+ | 1+ |
| Vehicle report | 3+ (already in the template) | optional |
| Code guide | 1+ where there's data (complaint counts, "What fixed it?", prices) | **1** (how the system works, or what to check first, as a flow) |
| Blog post or guide | 1+ where there's data | 1+ |
| Tool page | the result shown as a chart where it helps | 1 (how the estimate is worked out) |

**Every chart and diagram:**
- a **title that states the takeaway** ("Premiums rose 41% in four years", not "Premiums by year")
- a source line
- "Show as table" (charts)
- a text summary or alt text
- the brand colors and type
- readability at 390 px and in dark mode

**Good diagram types:**
- a flow or decision path ("Do you need gap insurance?")
- a labeled breakdown (what makes up a premium)
- how a system works (the EVAP system and where leaks happen)
- a before-and-after
- a timeline

**Make it easy:** one idea per chart, the plain-English takeaway first, no jargon without a one-line explanation.

## 4. So good other sites link to it

- **Better than what ranks today:**
  - check the top results for the main keyword before writing
  - the page must be clearly more useful (original data, a working tool, clearer visuals, more accurate facts), not just longer
- **A linkable asset on every page:**
  - an original dataset, a working tool, a 50-state table, or a chart worth embedding
  - a page with none of these isn't ready
- **Embed this chart:**
  - a copy-paste snippet for each main chart
  - the snippet carries a credit link back to the page
- **Stable and current:**
  - a permanent URL
  - a visible updated date
  - data refreshed on schedule (vehicle data weekly, studies monthly)
- **Outreach for the bigger pieces** (content-rule pieces, studies, silo pages):
  - 10 personal emails to relevant tier-1 sites
  - saved as Gmail drafts the owner sends (decision 8)
  - the agent never sends anything

## 4b. Writing that reads like an expert, not like AI

A final editing pass on every page's prose, run after the draft and before the checks. Adapted from the "marks of default AI text" list in the MIT-licensed antialgorithm skill (github.com/mankidev/antialgorithm), owner's request, 24 Nov. Expert-sounding text earns trust, and AI answers prefer to quote specific, plain sentences.

**Cut these:**
- **Generic sentences:** if a sentence could be pasted onto any other site unchanged, rewrite it with this page's facts: the vehicle, the code, the state, the number, the source.
- **Empty claims:** "comprehensive", "ultimate", "everything you need to know", "in today's world". Show the fact instead.
- **Hype:** questions that only build hype ("Ever wondered...?"), exclamation marks, cheerleading calls to action. A link that says what it does ("Check your VIN for recalls") is enough.
- **Habit patterns:** three adjectives in a row, lists of three by habit, mirrored slogan pairs ("not X, but Y" used as decoration).
- **Summing up:** a closing paragraph that restates the page ("In conclusion..."). End when the last useful thing is said.
- **Flat rhythm:** every sentence the same length. Mix short and long.
- **Named feelings:** "frustrating", "stressful" stated outright, where a concrete detail would show it ("the light came back on two days after the repair").
- **Notes about the text itself:** "this guide will...", "as mentioned above", word counts.
- **Numbers for decoration:** use a count, date or price only when the reader needs it, and always with its source.

**Keep these, even though the checklist would normally question them:** question-style headings, key-findings lists, tables of contents, tables and short bullet lists. Search engines and AI answers rely on that structure, and section 1 requires it. The checklist applies to the sentences inside them, not to the structure.

**Never** invent a detail to sound concrete. Every fact still needs its source (section 2).

## 5. Definition of done

Every PR that adds or substantially updates a page puts this checklist in its description, ticked for each page, with a one-line note where an item doesn't apply:

- [ ] Target keyword cluster recorded (tier-1 demand), with no overlap with another page
- [ ] Title, meta description, H1, question H2s with direct answers, table of contents if long
- [ ] Internal links: out to related pages, and in from 2+ existing pages
- [ ] Original finding with source and date; key numbers; 3–5 quotable findings
- [ ] Method and limits; CSV; "How to cite this"; reviewed-by line; dates
- [ ] Charts and diagrams at the minimum for the page type, each with a takeaway title, source and table or summary
- [ ] Linkable asset and "Embed this chart"
- [ ] Structured data, sitemap, `llms.txt`, IndexNow
- [ ] Writing pass done (section 4b): no generic, hype, summing-up or decorative-number sentences
- [ ] Build, `test:api`, `page_checks.py` 0 issues, browser check at 390 and 1280 px in light and dark mode

## 6. Older pages

Pages published before 24 Nov don't fully meet this standard. These include the 14 articles, the code guides (no diagrams) and some tool pages. The Monday refresh brings them up to it, highest tier-1 impressions first, 1–2 a week, alongside the content rule. Each refresh notes in the log which standard items it added.
