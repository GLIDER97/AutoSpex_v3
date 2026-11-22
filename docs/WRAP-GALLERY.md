# Wrap gallery

**Owner's request (22 Nov 2026):** show the images the Wrap Designer makes on the website, so they can rank in image search and spread around the web, each with its details (car model, coverage, finish, color, extras), light but sharp, and SEO and AEO friendly.

## What is published, and what never is

| Preview | Saved? | Published? |
|---|---|---|
| Drawn from scratch: the visitor enters year, make and model, no photo | Yes, once per unique design (same vehicle and options are saved once) | Only after the daily run reviews it |
| Made from a visitor's own photo | **No.** The photo and the result are never kept | **Never.** Photos show real plates, homes, streets and sometimes people |
| Either kind | Only the options chosen are counted (finish, color, coverage, extras), with nothing about the visitor | As totals, once there are 50+ previews |

- The Wrap Designer says this under its button.
- The privacy policy says it in "What you enter into the tools".
- **Starter set:** the gallery opened with 19 starter designs made by MyAutoSpex on 22 Nov 2026, using the same model and prompts the tool uses. They are labeled "Made by MyAutoSpex" and cost $0.171 for 20 images, one of which was rejected. Visitor designs are labeled "Designed by a visitor".

## How it works

1. **Saving** (`api/_wrapGallery.ts`, called from `api/ai.ts`): after a successful from-scratch preview, the server:
   - compresses the image to WebP at 1200 px (about 55–150 KB) and 640 px (about 20–50 KB), with sharp at quality 72
   - embeds IPTC/XMP metadata: title, caption, creator and credit "MyAutoSpex Wrap Designer", the CC BY 4.0 license, and "AI-generated" (`DigitalSourceType: trainedAlgorithmicMedia`)
   - stores the result in the Neon database (`wrap_designs`)

   Caps: 80 a day and 2,500 in total, so the free database tier can't fill up. When the total nears 2,500, ask the owner about moving images to Vercel Blob.
2. **Serving:** `/images/wraps/v/<id>/<descriptive-name>-1200.webp`, `-640.webp` and `-share.jpg` are rewritten to `api/wrap-image.ts` (`vercel.json`). The JPEG is made on demand for networks that don't take WebP. Responses are cached forever by the CDN. Starter images are static files in `public/images/wraps/`.
3. **Reviewing and publishing** (daily run, after the deploy is live):
   ```
   NODE_USE_ENV_PROXY=1 node scripts/wraps/review.mjs fetch <scratchpad>/wraps
   ```
   Look at `<scratchpad>/wraps/sheet.jpg` (open single images where unsure) and check every design against the checklist below. Then:
   ```
   node scripts/wraps/review.mjs publish <dir> <id>:<year>:<make>:<model> ...
   node scripts/wraps/review.mjs done <dir>
   ```
   Commit `data/wraps/gallery.json`, `stats.json` and `review-state.json`. Publish at most 6 visitor designs a day. If none pass, run `done` anyway.
4. **Pages** are prerendered from `data/wraps/gallery.json` (`data/wraps/index.ts` builds every title, alt text, caption, file name and description from the design's details):
   - `/wrap-gallery`: all designs, filters by finish and coverage, a "Which wraps are people trying?" chart (from 50+ previews), FAQ, and `CollectionPage` + `ItemList` of `ImageObject` structured data
   - `/wrap-gallery/<year-make-model-finish-color-coverage>`: the image (WebP srcset 640/1200, real width and height), details (vehicle, coverage, finish, color with swatch and hex, extras), care tips, "Try this design" (opens the Wrap Designer prefilled), "Use this image" (free under CC BY 4.0 with a ready credit line and downloads), Pinterest and copy-link sharing, similar designs, `ImageObject` (with `creditText`, `license`, `acquireLicensePage` and `about: Car`) and breadcrumbs
   - The sitemap lists each page with its image (`image:image`). `llms.txt` lists every design and image URL. The og:image is the JPEG.

## Review checklist (publish only if every answer is yes)

1. It is a car: the named vehicle, or clearly close to it, in one piece, with no warped body, extra wheels or melted parts.
2. The wrap matches the label: the finish (a chrome label must look like a mirror, matte must have no shine), the color, the coverage (roof only, hood only, stripes and so on) and the extras.
3. No added text, watermarks or invented logos. A car's own factory badge is fine.
4. No people, plates with readable text, or anything unpleasant.
5. **The vehicle name is clean:**
   - a real year, make and model, with the capitalization corrected in `publish`
   - nothing offensive, no personal names, no URLs
   - when the text isn't a real vehicle, don't publish
6. It isn't a near-duplicate of a published design (same model, color and finish).

## Growth uses
- **Image search:** descriptive file names, alt text, captions, structured data and the image sitemap.
- **Links:** every reuse under CC BY 4.0 carries a link back to the design page.
- **Pinterest and social:** shares use the 1200 px JPEG.
- **Original data:** the option counts become a "most-tried wrap colors" data point that AI answers can cite once there are enough previews (charts rule: drawn in code).
