// Ids of the embeddable charts (/embed/chart/<id>). Kept apart from the chart code so App.tsx can tell an embed page
// from a 404 without loading any charts. components/EmbedChart.tsx must define every id here (TypeScript checks it).
export const EMBED_IDS = ['suv-complaints-top-model-years', 'suv-complaints-heatmap', 'suv-complaints-problem-areas'] as const;
export type EmbedId = (typeof EMBED_IDS)[number];
export const isEmbedPath = (pathname: string) => {
  const m = /^\/embed\/chart\/([a-z0-9-]+)\/?$/.exec(pathname);
  return Boolean(m && (EMBED_IDS as readonly string[]).includes(m[1]));
};
