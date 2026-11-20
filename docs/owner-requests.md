# Owner requests

Things the daily runs need the owner's permission for (`docs/GROWTH-PLAN.md` section 10). They are asked in the reply to "status"; each answer is recorded here with the date.

## Open

1. **Make the myautospex.com → www redirect permanent (2 minutes, your Vercel account).** It's a temporary (307) redirect today; permanent (308) tells Google the `www` address is the only one. Vercel → your project → Settings → Domains → `myautospex.com` → edit → redirect to `www.myautospex.com` with status 308. Reply "done" when it's changed, or "you do it" if you'd like me to try through the Vercel connector.
2. **Optional, high impact: ask Google to crawl 10 key pages (about 5 minutes).** Google has no API for this. In Search Console, paste each URL into the inspection bar at the top and click "Request indexing": `/fault-code-decoder`, `/vin-lookup`, `/codes/p0300`, `/codes/p0171`, `/codes/p0128`, `/maintenance-validator`, `/insurance-estimator`, `/ownership-calculator`, `/article/check-engine-light-meaning`, `/article/p0420-code-catalytic-converter-sensor-guide` (all on https://www.myautospex.com). Reply "done" or "skip".

## Answered

| Date | Request | Answer |
|---|---|---|
| 2026-11-16 | Lead forms: does anyone follow up? | Nobody: forms replaced with direct links |
| 2026-11-19 | Route daily runs through this session | Yes |
| 2026-11-19 | Start day 1 now | Yes |
| 2026-11-19 | Move daily runs out of the long main chat to save Claude usage | Yes: runs now fire into a dedicated session ("MyAutoSpex daily growth runs"); the main chat answers "status" |
| 2026-11-19 | Repair-cost source | None: pages show no dollar figures and link to the code lookup's labeled AI estimate |
