<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1kmgFR693dAriBT08Z3eM9_waFkqwuKkn

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and fill in `OPENROUTER_API_KEY`
   (and `GOOGLE_MAPS_API_KEY` for the shop search)
3. Run the app:
   `npm run dev`

## Server-only API keys

The browser never holds an API key. Pages call the site's own Vercel functions,
which read the keys from the server environment:

| Function | Key | Used by |
| --- | --- | --- |
| `api/ai.ts` (`POST /api/ai`) | `OPENROUTER_API_KEY` | Every AI tool. Text and photo reading on Claude Haiku 5.5, images and wrap previews on Flux 3 Klein, through [OpenRouter](https://openrouter.ai). |
| `api/places.ts` (`GET /api/places`) | `GOOGLE_MAPS_API_KEY` | Mechanic finder and wrap shop search (Google Places API (New)). Without it the pages link to Google Maps instead. |

Neither endpoint takes a prompt. Pages send a tool id and that tool's fields
(`{ tool: 'fault-code', fields: { codes: ['P0171'] } }`); `api/_tools.ts` checks
the fields (known keys, fixed choices, short single-line text) and writes the
prompt, the system instruction and the answer's schema on the server. The wrap
tool only recolors a car: the server checks an uploaded photo shows a vehicle
and writes the edit instruction itself. Adding an AI feature means adding a
tool there.

Every paid call also takes one unit of a daily allowance, per visitor (a salted
hash of the IP) and site-wide, counted in the Neon Postgres database
(`DATABASE_URL`, see `api/_usage.ts`). When an allowance is used up the tools
say they're busy and to try again tomorrow. The limits are environment
variables (whole numbers, `0` turns a feature off):

| Variable | Default | Counts |
| --- | --- | --- |
| `AI_TEXT_DAILY_LIMIT` / `AI_TEXT_DAILY_LIMIT_PER_IP` | 2000 / 100 | AI text answers (every tool but the wrap previews) |
| `AI_IMAGE_DAILY_LIMIT` / `AI_IMAGE_DAILY_LIMIT_PER_IP` | 150 / 15 | Wrap previews |
| `PLACES_DAILY_LIMIT` / `PLACES_DAILY_LIMIT_PER_IP` | 300 / 30 | Google shop searches not served from the CDN cache |

Without `DATABASE_URL` the deployed functions refuse paid calls; `npm run dev`
counts in memory. The table (`usage_counters`) is created on first use.
Vercel BotID (basic mode) also screens both endpoints (`api/_botid.ts`; set
`BOTID_CHECK=off` to disable). The origin check only stops other websites'
pages; scripts can forge it, which is why the checks above exist.

- On Vercel, set the keys under Project Settings → Environment Variables, then redeploy.
- Never expose a key to client code (no `define` in `vite.config.ts`, no `VITE_` prefix).
  After `npm run build`, `grep -rE "sk-or-|AIza" dist/` must print nothing.
- `AI_TEXT_MODEL` / `AI_IMAGE_MODEL` switch to other OpenRouter models without a code change.
- In OpenRouter, set a monthly credit limit on the key. In Google Cloud, restrict the
  Maps key to the Places API (New) and set a daily quota.

## Tests

- `npm test`: validators, prompt templates, daily caps (the SQL runs on PGlite) and the
  endpoint handlers with mocked upstream APIs.
- `npm run test:e2e`: every tool page in Chromium against `npm run dev`, with OpenRouter,
  Google Places and NHTSA vPIC mocked (`tests/e2e/mock-upstream.mjs`), then again with
  the daily limits at 0. Needs Playwright with Chromium installed.

## Free government data (no key)

Some tools use free public US government APIs instead of AI. The browser calls
them directly (both allow cross-origin requests):

- Recalls page: NHTSA recalls API (`api.nhtsa.gov`), see `utils/nhtsaRecalls.ts`.
- MPG efficiency audit: EPA ratings from fueleconomy.gov web services, see `utils/fuelEconomy.ts`.
- VIN lookup: NHTSA vPIC (`vpic.nhtsa.dot.gov`).
