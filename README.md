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

Both functions only answer requests from the site's own origin, check every
input against what the pages send, and rate-limit each IP. `npm run dev`
serves the same endpoints locally.

- On Vercel, set the keys under Project Settings → Environment Variables, then redeploy.
- Never expose a key to client code (no `define` in `vite.config.ts`, no `VITE_` prefix).
  After `npm run build`, `grep -rE "sk-or-|AIza" dist/` must print nothing.
- `AI_TEXT_MODEL` / `AI_IMAGE_MODEL` switch to other OpenRouter models without a code change.
- In OpenRouter, set a monthly credit limit on the key. In Google Cloud, restrict the
  Maps key to the Places API (New) and set a daily quota.

## Free government data (no key)

Some tools use free public US government APIs instead of AI. The browser calls
them directly (both allow cross-origin requests):

- Recalls page: NHTSA recalls API (`api.nhtsa.gov`), see `utils/nhtsaRecalls.ts`.
- MPG efficiency audit: EPA ratings from fueleconomy.gov web services, see `utils/fuelEconomy.ts`.
- VIN lookup: NHTSA vPIC (`vpic.nhtsa.dot.gov`).
