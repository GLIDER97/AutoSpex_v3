# Data visualization: how MyAutoSpex shows numbers

**Standing rule from the owner (22 Nov 2026):** every page or section with data or data insights shows that data as charts, drawn by Claude in code, so a visitor understands it in seconds. No AI image model or paid API is ever used for a chart (no AI cost). This file is the spec; `docs/GROWTH-PLAN.md` section 0 holds the rule.

## 1. Pick the chart by the data's job

| The reader needs to... | Use | Kit component |
|---|---|---|
| See a headline number | Big-number tile, with a sparkline if there's a trend | `StatTile`, `Sparkline` |
| Compare amounts across named things (complaint areas, versions, models) | Ranked horizontal bars, largest first | `BarList` |
| See what share of a whole each thing is | Meter rows (a share of the total per row) | `MeterList` |
| See one whole split into 2–6 parts that add up to 100% | Share bar (tall segmented bar) with a legend | `ShareBar` |
| See change over time (complaints per year, prices per month) | Columns (counts per period) or a line (a continuous measure) | `ColumnChart` |
| See dated events (recalls, investigations) | Timeline on a year axis | `Timeline` |
| Read a rating out of 5 | A row of stars plus the number | `Stars` |
| Compare two series per category (car A vs car B) | Paired bars with a legend | `PairedBars` |
| Split a total per period into two parts | Stacked columns with a legend | `StackedColumns` |
| Compare a value across two dimensions (model × year) | Heatmap: one hue, 5 shades, number in each cell, legend, table | `Heatmap` |
| Explain a process or decision path ("check a used SUV in 4 steps") | Flow diagram: numbered steps with arrows, stacked on phones | `FlowDiagram` |
| See a continuous measure over many periods (a monthly price index), alone or against a second series | Line chart on one shared axis (index both to 100 at the start), gaps where a value is missing, arrow-key and hover readout | `LineChart` |
| See changes that can be negative, per period (yearly % change) | Columns above and below a zero line, every column labeled | `ChangeColumns` |
| Compare changes that can be negative across named things (5-year price change by cost) | Bars left or right of a zero line, the subject highlighted | `ChangeBars` |
| Show what something is made of and which packages include which parts (a policy's coverages; state minimum vs full coverage) | Labeled breakdown: grouped cards with brackets underneath, stacked on phones | `BreakdownDiagram` |

- **Pies and donuts** only for one whole split into 2–4 parts that stand alone. Anything else reads faster as a share bar or ranked bars.
- **Never use these:**
  - two y-axes on one chart
  - a one-bar chart (use a tile instead)
  - a number on every point of a long series (label the peak and the latest; hover gives the rest)
  - more than about 7 colors (fold the tail into "Other")
- If a number stands alone, a tile beats a chart.

## 2. Look

- **Colors:** `--chart-1` (blue) for a single series and `--chart-2` (amber) for a second, both validated for color-blind safety in light and dark mode. Lighter steps of the same hue come from `color-mix()` with the card surface (tracks, partial periods). Use one hue per chart unless the series really are different things.
  - The status colors (`sign-red`, `sign-green`) are only for good or bad meaning, always with a word or icon too.
  - A new color needs the `dataviz` skill's `validate_palette.js` run against both card surfaces (light `#ffffff`, dark `#212528`).
- **Bars:**
  - at most 24 px thick
  - 4 px rounded at the value end, square at the baseline, starting from zero
  - a 2 px gap between touching bars or segments
- **Grid and axes:** 1 px solid hairlines in the border color, clean round tick values.
- **Text:**
  - values, labels and legends in text colors, never in the series color
  - large standalone numbers use normal figures; columns of numbers use `tabular-nums`

## 3. Easy for everyone to read

- A one-line takeaway above every chart, as a direct answer ("The engine: 59% of complaints name it").
- A source caption under every chart (source name and link, plus "data as of" date).
- **Hover and focus:** each bar or column shows its exact value on hover, tap or keyboard focus. Values are never only in a tooltip: there is always a direct label or the table.
- **"Show as table"** on every chart with more than a few values, and a screen-reader description (`aria-label` or a visually hidden caption).
- **Nothing relies on color alone:** a legend for two or more series, labels on the marks that matter.
- **Mobile first:** works at 390 px with no sideways scroll; long labels wrap rather than get cut off.

## 4. How it's built

- Plain React with HTML/CSS or inline SVG, in `components/tool/charts.tsx`, server-rendered by the prerender, so Google and AI crawlers see the numbers as text.
- No chart library and no images: charts stay sharp, light, themeable and free.
- Charts read the same data that the page's CSV download and "How to cite this" line come from.

## 5. Check before shipping

1. Screenshot every new or changed chart at 390 px and 1280 px, in light and dark mode (`document.documentElement.classList.add('dark')`), and look at it:
   - no overlapping or clipped labels
   - bars in scale
   - a legend where needed
2. No console or hydration errors.
3. Check it against the "Never use these" list in section 1.

## 6. Embed this chart

- **Every main chart on a data page gets an "Embed this chart" box** (`EmbedThisChart`). It shows a copy-paste snippet: an iframe of `/embed/chart/<id>`, plus a credit link to our page that sits outside the iframe, so the embedding page links back to ours.
- **To add an embeddable chart:**
  1. Add the id to `data/embedIds.ts`.
  2. Add its definition (takeaway title, source, date, height, render) to `EMBEDS` in `components/EmbedChart.tsx`.
- **The embed pages:**
  - are prerendered without the site header and footer, `noindex`, with the canonical set to the source page, and kept out of the sitemap
  - follow the visitor's light or dark setting (`?theme=dark|light` overrides it)
  - can be framed by any site; only `/embed/*` allows this (`vercel.json`), and every other page stays same-origin only
