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
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Gemini API key (server-only)

The AI tools never call Gemini from the browser. They POST to `/api/gemini`
(`api/gemini.ts`, a Vercel function), which reads `GEMINI_API_KEY` from the server
environment and forwards the request. The function only accepts the models and
options the site uses, only answers requests from the site's own origin, and
rate-limits each IP. `npm run dev` serves the same endpoint locally.

- On Vercel, set `GEMINI_API_KEY` under Project Settings → Environment Variables.
- Never expose the key to client code (no `define` in `vite.config.ts`, no `VITE_` prefix).
  After `npm run build`, `grep -r AIza dist/` must print nothing.
- To use a new model or config option in a component, add it to the allowlist in `api/gemini.ts`.
