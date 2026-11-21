# Image style: the design preference for every image on MyAutoSpex

Chosen by the owner on 21 Nov 2026 after comparing 18 sample styles. Every AI image made for the site (by the daily runs or by hand) follows this file. The site has to look **premium, authentic and highly trustworthy**, and keep looking right once it also sells car parts and accessories and resells cars.

## The two styles

### Style 1: Studio catalog (neutral, trustworthy)
The look shoppers expect from a top parts retailer or car marketplace.
- **Use for:** images of a part or accessory, code guides (the part the code is about), article covers about repairs and maintenance, and any card or grid of products.
- **Look:** a seamless warm light-grey studio backdrop curving into the floor, large soft-box lighting, a subtle floor reflection and a soft contact shadow, true-to-life colors, crisp detail, calm.

### Style 2: Brand color-block (bold, recognizably ours)
The brand signature: the road-sign green and yellow as a set.
- **Use for:** the homepage hero, category and tool banners, the default social share image, promotions, and article covers about money, buying and selling.
- **Look:** a solid deep green (`#006b4f`) seamless backdrop with one large signal-yellow (`#ffcd00`) geometric shape behind the subject, hard directional light with a crisp graphic shadow, high contrast, confident.

Use one style per image; never mix them in one picture. Never use cartoon, illustration, 3D clay or other styles.

## Models (owner-approved, 21 Nov 2026)

| Job | Model (OpenRouter ID) | Measured cost |
|---|---|---|
| Homepage hero images, and **any image that shows a car** | `google/gemini-3-pro-image` (Nano Banana Pro) | about $0.139 an image |
| Everything else: parts, accessories, objects, banners without a car | `google/gemini-nano-banana-2.1` (Nano Banana 2.1) | about $0.036 an image |

- **Why Pro for cars:** in a test on 21 Nov, every cheaper model drew a recognizable real car (Corolla, Civic, Jetta) even when told not to. A real model on the site can read as a claimed brand link, or as a car we're selling. Pro kept the car generic.
- **Pro is better, not perfect:** in the first hero set (21 Nov), both images with a car still resembled real models (a Volvo grille, a VW SUV). Check every car image (rule 3), and prefer layouts where cars can't be identified, such as a side profile, a rear three-quarter view or a tight crop. Use parts and tools when a car isn't needed.
- **Why the exception:** the owner approved going over the plan's $0.10-per-image cap for these two uses only.
- **How to call:** `POST https://openrouter.ai/api/v1/chat/completions` with `"modalities": ["image", "text"]` and `"image_config": {"aspect_ratio": "16:9"}` (or `"1:1"`, `"4:3"`). The image comes back as a data URL in `choices[0].message.images[0].image_url.url`. The cost is in `usage.cost`.
- If a model is retired, use the closest newer Google image model in the same tier, and log the change.

## Prompt recipes
Build every prompt as **style base + subject + rules**. Keep the wording below so images stay consistent.

**Style 1 base:**
> Premium automotive e-commerce studio photograph. Seamless warm light-grey studio backdrop curving into the floor, large soft-box lighting, subtle floor reflection and soft contact shadow, true-to-life colors, crisp detail, calm and trustworthy catalog quality.

**Style 2 base:**
> Premium brand campaign studio photograph on a solid deep green (#006b4f) seamless backdrop, with one large signal-yellow (#ffcd00) geometric shape behind the subject, hard directional light with a crisp graphic shadow, true-to-life materials, high contrast, confident, premium and trustworthy.

**Subject:** one plain sentence naming what's in the picture.
- For a car, always add: *"a clean, well-kept generic [sedan / compact SUV / pickup] with a neutral, non-identifiable design (not resembling any real manufacturer's model), [color] paint, three-quarter front view"*.

**Rules (always append):**
> No text, no letters, no numbers, no logos, no badges, no brand names, no license plate characters, no people.

**Composition:** when text will sit over or beside the image, add *"the subject sits on the right half; the left 45% is calm, empty backdrop"*.

## Hard rules
1. **Items for sale use real photos only.** When the site sells a specific part, accessory or used car, its listing shows real photos of that actual item, never an AI image. AI images are for banners, categories, guides and articles. Anything else would mislead buyers.
2. **No facts in AI images.** No part locations, wiring, warning-light charts or numbers. Facts go in charts and diagrams drawn in code from sourced data.
3. **Generic cars only.** If a car resembles a real model, or shows a badge, a readable plate or warped wheels, reject it and regenerate, up to 2 retries. Then pick the best one or skip the image.
4. **No people or faces,** and no invented customers or mechanics.
5. **Check every image before publishing:** no stray text or logos, nothing warped, the right style colors, and the subject placed where the layout needs it.

## Files
- **Format:** WebP. Hero images at most 1600 px wide and about 160 KB; everything else at most 1200 px wide and about 120 KB.
- **Name:** descriptive, for example `hero-sedan-color-block.webp` or `p0300-spark-plugs-studio.webp`.
- **Markup:** real `width` and `height`, alt text describing what's shown, and `loading="lazy"` except for the first image on the page.
- **Hero images:** load with `fetchpriority="high"`.

## Budget
- **Before every batch:** read `usage_monthly` from `GET https://openrouter.ai/api/v1/key`. At $9.00 or more, make no images for the rest of the month.
- **Log every image** in `docs/openrouter-spend.csv`.

## Rollout (first pass, owner-approved 21 Nov 2026)

| What | Style | Model | Images | Status |
|---|---|---|---|---|
| Homepage hero (3 options for the owner to pick) | 2 | Pro | 3 | options made 21 Nov: the parts option recommended; both car options resembled real models |
| Category banners and default social share image | 2 | 2.1 (Pro if it shows a car) | 5 | to do |
| Code guide images (the part each code is about) | 1 | 2.1 | 6 + 1 per new code page | to do |
| Replace the 14 mixed article covers | 1 or 2 by topic | 2.1 (Pro if it shows a car) | 14 | to do |
